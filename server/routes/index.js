import { Router } from 'express'
import axios from 'axios'
import validate from 'express-validation'
import token from '../token'

import validation from './validation'

function computePerfectRepos (ghUserRepos) {
  return ghUserRepos.filter(repo => repo.open_issues === 0).length
}

function computeHighestStars (ghUserRepos) {
  return ghUserRepos.reduce(
    (highestCount, repo) =>
      highestCount < repo.stargazers_count
        ? repo.stargazers_count
        : highestCount,
    0
  )
}

function computeTotalStars (ghUserRepos) {
  return ghUserRepos.reduce(
    (totalStars, repo) => totalStars + repo.stargazers_count,
    0
  )
}

function extractLanguageInfo (ghUserRepos) {
  return ghUserRepos.reduce((languageObj, repo) => {
    const langCount = languageObj[repo.language]
      ? languageObj[repo.language] + 1
      : 1
    return {
      ...languageObj,
      [repo.language]: langCount
    }
  }, {})
}

function computeFavLanguage (ghUserRepos) {
  const langInfo = extractLanguageInfo(ghUserRepos)

  const topEntry = Object.entries(langInfo).reduce((maxEntry, entry) => {
    return maxEntry[1] < entry[1] ? entry : maxEntry
  })

  return topEntry[0]
}

function forkerTitle (ghUserRepos) {
  const repoCount = ghUserRepos.length
  const forkedCount = ghUserRepos.filter(repo => repo.fork === true).length
  return forkedCount > repoCount / 2 ? 'Forker' : null
}

function oneTrickTitle (ghUserRepos) {
  const langInfo = extractLanguageInfo(ghUserRepos)
  return Object.keys(langInfo).length === 1 ? 'One-Trick Pony' : null
}

function jackAllTitle (ghUserRepos) {
  const langInfo = extractLanguageInfo(ghUserRepos)
  return Object.keys(langInfo).length >= 10 ? 'Jack of all Trades' : null
}

function stalkerTitle (ghUser) {
  return ghUser.following >= ghUser.followers * 2 ? 'Stalker' : null
}

function popularTitle (ghUser) {
  return ghUser.followers >= ghUser.following * 2 ? 'Mr. Popular' : null
}

function customTitle (ghUserRepos) {
  const repoCount = ghUserRepos.count
  const licensedRepos = ghUserRepos.filter(repo => !!repo.license).count
  return licensedRepos >= repoCount / 2 ? 'Legalize It' : null
}

function computeTitles (ghUser, ghUserRepos) {
  return [
    forkerTitle(ghUserRepos),
    oneTrickTitle(ghUserRepos),
    jackAllTitle(ghUserRepos),
    stalkerTitle(ghUser),
    popularTitle(ghUser),
    customTitle(ghUserRepos)
  ].filter(title => !!title)
}

function nonNullOrEmptyString (anything) {
  return anything === null ? '' : anything
}

function noReposUser (ghUser) {
  return {
    username: nonNullOrEmptyString(ghUser.login),
    name: nonNullOrEmptyString(ghUser.name),
    location: nonNullOrEmptyString(ghUser.location),
    bio: nonNullOrEmptyString(ghUser.bio),
    'avatar-url': nonNullOrEmptyString(ghUser.avatar_url),
    titles: [],
    'favorite-language': '',
    'public-repos': 0,
    'total-stars': 0,
    'most-starred': 0,
    'perfect-repos': 0,
    followers: nonNullOrEmptyString(ghUser.followers),
    following: nonNullOrEmptyString(ghUser.following)
  }
}

function transformGithubUser (ghUser, ghUserRepos) {
  if (ghUserRepos.length === 0) {
    return noReposUser(ghUser)
  }

  return {
    username: nonNullOrEmptyString(ghUser.login),
    name: nonNullOrEmptyString(ghUser.name),
    location: nonNullOrEmptyString(ghUser.location),
    bio: nonNullOrEmptyString(ghUser.bio),
    'avatar-url': nonNullOrEmptyString(ghUser.avatar_url),
    titles: nonNullOrEmptyString(computeTitles(ghUser, ghUserRepos)),
    'favorite-language': nonNullOrEmptyString(computeFavLanguage(ghUserRepos)),
    'public-repos': nonNullOrEmptyString(ghUser.public_repos),
    'total-stars': nonNullOrEmptyString(computeTotalStars(ghUserRepos)),
    'most-starred': nonNullOrEmptyString(computeHighestStars(ghUserRepos)),
    'perfect-repos': nonNullOrEmptyString(computePerfectRepos(ghUserRepos)),
    followers: nonNullOrEmptyString(ghUser.followers),
    following: nonNullOrEmptyString(ghUser.following)
  }
}

const ghRequestErrorHandler = username => error => {
  let returnObj = {}
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data)
    console.log(error.response.status)
    console.log(error.response.headers)
    returnObj.status = error.response.status
    returnObj.message = `User not found: ${username}`
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request)
    returnObj.status = 504
    returnObj.message = 'Github is down'
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Error', error.message)
    returnObj.status = 500
    returnObj.message = `Internal error while retrieving ${username}`
  }
  console.log(error.config)
  console.log(returnObj)
  return returnObj
}

function requestUserData (username, res) {
  return Promise.all([
    axios
      .get(`https://api.github.com/users/${username}`, {
        headers: {
          Authorization: token
        }
      })
      .catch(ghRequestErrorHandler(username)),
    axios
      .get(`https://api.github.com/users/${username}/repos`, {
        headers: {
          Authorization: token
        }
      })
      .catch(ghRequestErrorHandler(username))
  ])
}

export default () => {
  let router = Router()

  /** GET /health-check - Check service health */
  router.get('/health-check', (req, res) => res.send('OK'))

  // The following is an example request.response using axios and the
  // express res.json() function
  /** GET /api/rate_limit - Get github rate limit for your token */
  router.get('/rate', (req, res) => {
    axios
      .get(`http://api.github.com/rate_limit`, {
        headers: {
          Authorization: token
        }
      })
      .then(({ data }) => res.json(data))
  })

  /** GET /api/user/:username - Get user */
  router.get('/user/:username', validate(validation.user), (req, res) => {
    requestUserData(req.params.username)
      .then(responses => {
        if (responses[0].status !== 200) {
          throw responses[0]
        }
        return transformGithubUser(responses[0].data, responses[1].data)
      })
      .then(data => res.json(data))
      .catch(err => {
        console.log(err)
        res.status(err.status).send(err.message)
      })
  })

  /** GET /api/users? - Get users */
  router.get('/users/', validate(validation.users), (req, res) => {
    Promise.all(req.query.username.map(name => requestUserData(name, res)))
      .then(responses => {
        let failed = false
        let failures = {
          status: 404,
          message: ''
        }

        const usersResponse = responses.map(response => {
          if (response[0].status !== 200) {
            failed = true
            failures.status = response[0].status
            failures.message += ' ' + response[0].message
            return {}
          }

          return transformGithubUser(response[0].data, response[1].data)
        })

        if (failed) {
          throw failures
        }

        return usersResponse
      })
      .then(data => res.json(data))
      .catch(err => {
        console.log(err)
        res.status(err.status)
        res.statusMessage = err.message
        res.send()
      })
  })

  return router
}
