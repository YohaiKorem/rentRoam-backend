import { Order } from '../../models/order.model.cjs'
import { dbService } from '../../services/db.service.cjs'

import { loggerService } from '../../services/logger.service.cjs'

import { ObjectId } from 'mongodb'

const asyncLocalStorage = require('../../services/als.service.cjs')

// async function query(id: string, filterBy = {}) {
//   console.log(id)

//   try {
//     const criteria = _buildCriteria(filterBy)
//     const collection = await dbService.getCollection('order')
//     var orders = await collection
//       .aggregate([
//         {
//           $match: criteria,
//         },
//         {
//           $lookup: {
//             from: 'user',
//             localField: 'buyerId', // Assuming 'buyerId' is the field in 'order' collection
//             foreignField: '_id',
//             as: 'buyerDetails',
//           },
//         },
//         {
//           $unwind: '$buyerDetails',
//         },
//         {
//           $lookup: {
//             from: 'stay', // Assuming there is a 'stay' collection
//             localField: 'stayId', // Assuming 'stayId' is the field in 'order' collection
//             foreignField: '_id',
//             as: 'stayDetails',
//           },
//         },
//         {
//           $unwind: '$stayDetails',
//         },
//         {
//           $project: {
//             _id: 1,
//             hostId: '$hostId', // Assuming 'hostId' is the field in 'order' collection
//             buyer: {
//               _id: '$buyerDetails._id',
//               fullname: '$buyerDetails.fullname', // Assuming 'fullname' is a field in 'user' collection
//               // Add other buyer details as needed
//             },
//             totalPrice: '$totalPrice', // Assuming 'totalPrice' is the field in 'order' collection
//             checkin: '$checkin', // Assuming 'checkin' is the field in 'order' collection
//             checkout: '$checkout', // Assuming 'checkout' is the field in 'order' collection
//             guests: '$guests', // Assuming 'guests' is the field in 'order' collection
//             stay: {
//               _id: '$stayDetails._id',
//               name: '$stayDetails.name', // Assuming 'name' is a field in 'stay' collection
//               price: '$stayDetails.price', // Assuming 'price' is a field in 'stay' collection
//               address: '$stayDetails.address', // Assuming 'address' is a field in 'stay' collection
//             },
//             msgs: '$msgs', // Assuming 'msgs' is the field in 'order' collection
//             status: '$status', // Assuming 'status' is the field in 'order' collection
//           },
//         },
//       ])
//       .toArray()

//     return orders.map((order) => {
//       // Convert MongoDB _id to string
//       order._id = order._id.toString()
//       order.buyer._id = order.buyer._id.toString()
//       order.stay._id = order.stay._id.toString()
//       return order
//     })
//   } catch (err) {
//     loggerService.error('cannot find orders', err)
//     throw err
//   }
// }

async function query(id: string, entityType: string) {
  let criteria: any = {}
  try {
    const collection = await dbService.getCollection('order')
    if (entityType === 'all')
      criteria = { $or: [{ hostId: id }, { 'buyer._id': id }] }
    if (entityType === 'host') criteria = { hostId: id }
    if (entityType === 'buyer') criteria = { 'buyer._id': id }
    const orders = await collection.find(criteria).toArray()
    return orders
  } catch (err) {
    loggerService.error(
      `cannot find orders for ${entityType} with id of ${id}`,
      err
    )
    throw err
  }
}

async function getById(id: string) {
  try {
    const collection = await dbService.getCollection('order')
    const order = await collection.findOne({ _id: new ObjectId(id) })
    return order
  } catch (err) {
    loggerService.error(`while finding order ${id}`, err)
    throw err
  }
}

async function update(order: Order) {
  try {
    const collection = await dbService.getCollection('order')
    const { _id, ...updateData } = order

    await collection.updateOne({ _id: new ObjectId(_id) }, { $set: updateData })
    const updatedOrder: Order = await collection.findOne({
      _id: new ObjectId(_id),
    })
    if (!updatedOrder) throw new Error('Order not found')
  } catch (err) {
    loggerService.error(`cannot update order ${order._id}`, err)
    throw err
  }
}

// async function remove(orderId) {
//   try {
//     const store = asyncLocalStorage.getStore()
//     const { loggedinUser } = store
//     const collection = await dbService.getCollection('order')
//     // remove only if user is owner/admin
//     const criteria = { _id: ObjectId(orderId) }
//     if (!loggedinUser.isAdmin) criteria.byUserId = ObjectId(loggedinUser._id)
//     const { deletedCount } = await collection.deleteOne(criteria)
//     return deletedCount
//   } catch (err) {
//     loggerService.error(`cannot remove order ${orderId}`, err)
//     throw err
//   }
// }

async function add(order: Order) {
  try {
    const collection = await dbService.getCollection('order')
    const newOrder: any = { ...order }
    newOrder._id = new ObjectId()
    const result = await collection.insertOne(newOrder)
    if (!result.acknowledged || !result.insertedId)
      throw new Error('Insertion failed')
    const savedOrder: Order = await collection.findOne({
      _id: result.insertedId,
    })

    return savedOrder
  } catch (err) {
    loggerService.error('cannot insert order', err)
    throw err
  }
}

function _buildCriteria(filterBy) {
  let criteria: { hostId: string }
  if (filterBy.hostId) criteria.hostId = filterBy.hostId
  return criteria
}

module.exports = {
  query,
  // remove,
  add,
  update,
  getById,
}
