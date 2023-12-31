const Cryptr = require('cryptr')
import { ObjectId } from 'mongodb'
import { User } from '../../models/user.model.cjs'
const bcrypt = require('bcrypt')
const userService = require('../user/user.service.cjs')
import { loggerService } from '../../services/logger.service.cjs'

const cryptr = new Cryptr(process.env.SESSION_SECRET || 'secret-puk-1234')

export async function login(username, password) {
  loggerService.debug(`auth.service - login with username: ${username}`)

  const user = await userService.getByUsername(username)
  if (!user) return Promise.reject('Invalid username or password')
  // TODO: un-comment for real login

  const match = await bcrypt.compare(password, user.password)
  if (!match) return Promise.reject('Invalid username or password')

  delete user.password
  return user
}

export async function signup(username, password, fullname, imgUrl = null) {
  const saltRounds = 10

  loggerService.debug(
    `auth.service - signup with username: ${username}, fullname: ${fullname}`
  )
  if (!username || !password || !fullname)
    return Promise.reject('fullname, username and password are required!')

  const hash = await bcrypt.hash(password, saltRounds)
  return userService.add({ username, password: hash, fullname, imgUrl })
}

export function getLoginToken(user: User) {
  const userInfo = {
    _id: user._id,
    fullname: user.fullname,
    isOwner: user.isOwner,
  }
  return cryptr.encrypt(JSON.stringify(userInfo))
}

async function signupFromSocial(socialUser) {
  if (socialUser.provider === 'FACEBOOK')
    socialUser.response = JSON.parse(socialUser.response)
  return await userService.addFromSocial(socialUser)
}

export function validateToken(loginToken) {
  try {
    const json = cryptr.decrypt(loginToken)
    const loggedInUser = JSON.parse(json)
    return loggedInUser
  } catch (err) {
    console.log(err, 'Invalid login token')
  }
  return null
}

module.exports = {
  signup,
  login,
  getLoginToken,
  validateToken,
  signupFromSocial,
}
