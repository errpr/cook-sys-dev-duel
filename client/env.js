/* eslint-disable no-unused-vars */
const API_URL = 'http://localhost:3000/api'
const USER_URL = `${API_URL}/user`
const USERS_URL = `${API_URL}/users`
const buildUserProfile = data => {
  return `
    <span class="username">${data.username}</span>
    <span class="full-name">${data.name}</span>
    <span class="location">${data.location}</span>
    <span class="bio">${data.bio}</span>
    <img class="avatar" src="${data['avatar-url']}" alt="avatar picture">
    <div class="stats">
        <div class="stat">
            <span class="label">Titles:&nbsp;</span>
            <span class="titles value">${data.titles.join(', ')}</span>
        </div>
        <div class="stat">
            <span class="label">Favorite language:&nbsp;</span>
            <span class="favorite-language value">${
  data['favorite-language']
}</span>
        </div>
        <div class="stat">
            <span class="label">Total stars:&nbsp;</span>
            <span class="total-stars value">${data['total-stars']}</span>
        </div>
        <div class="stat">
            <span class="label">Highest star count:&nbsp;</span>
            <span class="most-starred value">${data['most-starred']}</span>
        </div>
        <div class="stat">
            <span class="label">Public repos:&nbsp;</span>
            <span class="public-repos value">${data['public-repos']}</span>
        </div>
        <div class="stat">
            <span class="label">'Perfect' Repos:&nbsp;</span>
            <span class="perfect-repos value">${data['perfect-repos']}</span>
        </div>
        <div class="stat">
            <span class="label">Followers:&nbsp;</span>
            <span class="followers value">${data['followers']}</span>
        </div>
        <div class="stat">
            <span class="label">Following:&nbsp;</span>
            <span class="following value">${data['following']}</span>
        </div>
        <div class="stat hide">
            <span class="label">Winner:&nbsp;</span>
            <span class="overall-winner value"></span>
        </div>
    </div>
  `
}
