import { User } from '../../models/user.model.cjs'
const authService = require('../auth/auth.service.cjs')

const userService = require('./user.service.cjs')
const { loggerService } = require('../../services/logger.service.cjs')

async function getUser(req, res) {
  try {
    const user = await userService.getById(req.params.id)
    res.send(user)
  } catch (err) {
    loggerService.error('Failed to get user', err)
    res.status(500).send({ err: 'Failed to get user' })
  }
}

async function getUsers(req, res) {
  try {
    const filterBy = {
      txt: req.query?.txt || '',
    }
    const users = await userService.query(filterBy)
    res.send(users)
  } catch (err) {
    loggerService.error('Failed to get users', err)
    res.status(500).send({ err: 'Failed to get users' })
  }
}

async function deleteUser(req, res) {
  try {
    await userService.remove(req.params.id)
    res.send({ msg: 'Deleted successfully' })
  } catch (err) {
    loggerService.error('Failed to delete user', err)
    res.status(500).send({ err: 'Failed to delete user' })
  }
}

async function updateUser(req, res) {
  try {
    const user = req.body
    const savedUser: User = await userService.update(user)
    const loginToken = authService.getLoginToken(savedUser)
    res.cookie('loginToken', loginToken)

    res.send(savedUser)
  } catch (err) {
    loggerService.error('Failed to update user', err)
    res.status(500).send({ err: 'Failed to update user' })
  }
}

module.exports = {
  getUser,
  getUsers,
  deleteUser,
  updateUser,
}
