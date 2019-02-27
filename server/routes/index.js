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
  return licensedRepos > repoCount / 2 ? 'Legalize It' : null
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

function transformGithubUser (ghUser, ghUserRepos) {
  return {
    name: ghUser.name,
    location: ghUser.location,
    bio: ghUser.bio,
    avatar_url: ghUser.avatar_url,
    titles: computeTitles(ghUser, ghUserRepos),
    fav_language: computeFavLanguage(ghUserRepos),
    public_repos: ghUser.public_repos,
    total_stars: computeTotalStars(ghUserRepos),
    highest_stars: computeHighestStars(ghUserRepos),
    perfect_projects: computePerfectRepos(ghUserRepos),
    followers: ghUser.followers,
    following: ghUser.following
  }
}

function requestUserData (username) {
  return Promise.all([
    axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: token
      }
    }),
    axios.get(`https://api.github.com/users/${username}/repos`, {
      headers: {
        Authorization: token
      }
    })
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
      .then(responses =>
        transformGithubUser(responses[0].data, responses[1].data)
      )
      .then(data => {
        console.log(data)
        return data
      })
      .then(data => res.json(data))
      .catch(console.log)
  })

  /** GET /api/users? - Get users */
  router.get('/users/', validate(validation.users), (req, res) => {
    Promise.all(req.query.username.map(requestUserData))
      .then(data => {
        console.log(data)
        return data
      })
      .then(responses =>
        responses.map(response =>
          transformGithubUser(response[0].data, response[1].data)
        )
      )
      .then(data => {
        console.log(data)
        return data
      })
      .then(data => res.json(data))
      .catch(console.log)
  })

  return router
}
