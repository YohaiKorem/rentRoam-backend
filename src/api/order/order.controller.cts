import { log } from 'console'
import { Order } from '../../models/order.model.cjs'
import { loggerService } from '../../services/logger.service.cjs'
const userService = require('../user/user.service.cjs')
const authService = require('../auth/auth.service.cjs')
const socketService = require('../../services/socket.service.cjs')
const orderService = require('./order.service.cjs')

async function getOrders(req, res) {
  const { id } = req.params
  try {
    let entityType: string
    if (req.path.includes('/host/')) entityType = 'host'
    else if (req.path.includes('/buyer/')) entityType = 'buyer'
    else entityType = 'all'

    const orders: Order[] = await orderService.query(id, entityType)
    res.send(orders)
  } catch (err) {
    loggerService.error('Cannot get orders', err)
    res.status(500).send({ err: 'Failed to get orders' })
  }
}
async function getOrderById(req, res) {
  const { id } = req.params
  try {
    const order: Order = await orderService.getById(id)
    res.json(order)
  } catch (err) {
    loggerService.error('Cannot get order', err)
    res.status(500).send({ err: `Failed to get order with id of ${id}` })
  }
}

async function deleteOrder(req, res) {
  try {
    const deletedCount = await orderService.remove(req.params.id)
    if (deletedCount === 1) {
      res.send({ msg: 'Deleted successfully' })
    } else {
      res.status(400).send({ err: 'Cannot remove order' })
    }
  } catch (err) {
    loggerService.error('Failed to delete order', err)
    res.status(500).send({ err: 'Failed to delete order' })
  }
}

async function updateOrder(req, res) {
  try {
    const order = req.body
    const updatedOrder = await orderService.update(order)
    return res.json(updatedOrder)
  } catch (err) {
    loggerService.error('Failed to update order', err)
    res.status(500).send({ err: 'Failed to update order' })
  }
}

async function addOrder(req, res) {
  try {
    const order = req.body
    const addedOrder = await orderService.add(order)
    res.json(addedOrder)
  } catch (err) {
    loggerService.error('Failed to add order', err)
    res.status(500).send({ err: 'Failed to add order' })
  }
}

async function addMsg(req, res) {
  const msg = req.body
  const { id } = req.params

  try {
    const updatedOrder = await orderService.addMsg(id, msg)
    return res.json(updatedOrder)
  } catch (err) {
    loggerService.error('Failed to update order', err)
    res.status(500).send({ err: 'Failed to update order' })
  }
}

// async function addOrder(req, res) {
//   var { loggedInUser } = req

//   try {
//     var order = req.body
//     order.byUserId = loggedInUser._id
//     order = await orderService.add(order)

//     // prepare the updated order for sending out
//     order.aboutUser = await userService.getById(order.aboutUserId)

//     loggedInUser = await userService.update(loggedInUser)
//     order.byUser = loggedInUser

//     // User info is saved also in the login-token, update it
//     const loginToken = authService.getLoginToken(loggedInUser)
//     res.cookie('loginToken', loginToken)

//     delete order.aboutUserId
//     delete order.byUserId

//     socketService.broadcast({
//       type: 'order-added',
//       data: order,
//       userId: loggedInUser._id,
//     })
//     socketService.emitToUser({
//       type: 'order-about-you',
//       data: order,
//       userId: order.aboutUser._id,
//     })

//     const fullUser = await userService.getById(loggedInUser._id)
//     socketService.emitTo({
//       type: 'user-updated',
//       data: fullUser,
//       label: fullUser._id,
//     })

//     res.send(order)
//   } catch (err) {
//     loggerService.error('Failed to add order', err)
//     res.status(500).send({ err: 'Failed to add order' })
//   }
// }

module.exports = {
  getOrders,
  deleteOrder,
  addOrder,
  getOrderById,
  updateOrder,
  addMsg,
}
