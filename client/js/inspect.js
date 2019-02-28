/* eslint-disable no-undef */
document.querySelector('form').addEventListener('submit', event => {
  event.preventDefault()

  const username = document.querySelector('form input').value
  const userResults = document.querySelector('.user-results')
  const errorSection = document.querySelector('.user-error')

  fetch(`${USER_URL}/${username}`)
    .then(response => {
      if (response.ok) {
        return response.json()
      }
      throw new Error(response.statusText)
    })
    .then(data => {
      userResults.innerHTML = buildUserProfile(data)
      userResults.classList.remove('hide')
      errorSection.classList.add('hide')
    })
    .catch(err => {
      errorSection.innerHTML = err.message
      userResults.classList.add('hide')
      errorSection.classList.remove('hide')
    })
})
