/* eslint-disable no-undef */
/*
  TODO
  Fetch 2 user's github data and display their profiles side by side
  If there is an error in finding user or both users, display appropriate error
  message stating which user(s) doesn't exist

  It is up to the student to choose how to determine a 'winner'
  and displaying their profile/stats comparison in a way that signifies who won.
 */
document.querySelector('form').addEventListener('submit', event => {
  event.preventDefault()

  const usernameLeft = document.querySelector('[name="username-left"]')
  const usernameRight = document.querySelector('[name="username-right"]')
  const leftUserSection = document.querySelector('.user-results.left')
  const rightUserSection = document.querySelector('.user-results.right')
  const userSectionContainer = document.querySelector('.duel-container')
  const errorSection = document.querySelector('.duel-error')

  document.querySelector('.tie-container').classList.add('hide')

  fetch(
    `${USERS_URL}?username=${usernameLeft.value}&username=${
      usernameRight.value
    }`
  )
    .then(response => {
      if (response.ok) {
        return response.json()
      }
      throw new Error(response.statusText)
    })
    .then(userObjects => {
      leftUserSection.innerHTML = buildUserProfile(userObjects[0])
      rightUserSection.innerHTML = buildUserProfile(userObjects[1])
      userSectionContainer.classList.remove('hide')
      errorSection.classList.add('hide')
      applyStyles(
        duelWinners(userObjects[0], userObjects[1]),
        leftUserSection,
        rightUserSection
      )
    })
    .catch(err => {
      console.log(err)
      errorSection.innerHTML = err.message
      errorSection.classList.remove('hide')
      userSectionContainer.classList.add('hide')
    })
})

function determineWinner (left, right) {
  if (left > right) {
    return 'left'
  } else if (right > left) {
    return 'right'
  }
  return 'tie'
}

function duelWinners (leftUser, rightUser) {
  const winners = {
    'public-repos': determineWinner(
      leftUser['public-repos'],
      rightUser['public-repos']
    ),
    'total-stars': determineWinner(
      leftUser['total-stars'],
      rightUser['total-stars']
    ),
    'most-starred': determineWinner(
      leftUser['most-starred'],
      rightUser['most-starred']
    ),
    'perfect-repos': determineWinner(
      leftUser['perfect-repos'],
      rightUser['perfect-repos']
    ),
    followers: determineWinner(leftUser['followers'], rightUser['followers']),
    following: determineWinner(leftUser['following'], rightUser['following'])
  }
  const countLeftWins = Object.values(winners).filter(x => x === 'left').length
  const countRightWins = Object.values(winners).filter(x => x === 'right')
    .length
  winners['overall-winner'] = determineWinner(countLeftWins, countRightWins)
  return winners
}

function applyStyles (winners, leftUserSection, rightUserSection) {
  const leftWinners = Object.entries(winners)
    .filter(entry => entry[1] === 'left')
    .map(entry => [entry[0], 'winner'])

  const leftLosers = Object.entries(winners)
    .filter(entry => entry[1] === 'right')
    .map(entry => [entry[0], 'loser'])

  const rightWinners = Object.entries(winners)
    .filter(entry => entry[1] === 'right')
    .map(entry => [entry[0], 'winner'])

  const rightLosers = Object.entries(winners)
    .filter(entry => entry[1] === 'left')
    .map(entry => [entry[0], 'loser'])

  const leftUserStyles = [...leftWinners, ...leftLosers]
  const rightUserStyles = [...rightWinners, ...rightLosers]

  leftUserStyles.forEach(entry => {
    const element = leftUserSection.querySelector(`.${entry[0]}`)
    console.log(entry)
    console.log(element)
    element.classList.add(`duel-${entry[1]}`)
  })

  rightUserStyles.forEach(entry => {
    const element = rightUserSection.querySelector(`.${entry[0]}`)
    console.log(entry)
    console.log(element)
    element.classList.add(`duel-${entry[1]}`)
  })

  if (winners['overall-winner'] === 'left') {
    leftUserSection.prepend(winnerElement())
  } else if (winners['overall-winner'] === 'right') {
    rightUserSection.prepend(winnerElement())
  } else {
    document.querySelector('.tie-container').classList.remove('hide')
  }
}

function winnerElement () {
  const outer = document.createElement('div')
  outer.classList.add('winner-container')
  const inner = document.createElement('p')
  inner.classList.add('winner-text')
  inner.innerText = 'Winner'
  outer.appendChild(inner)
  return outer
}
