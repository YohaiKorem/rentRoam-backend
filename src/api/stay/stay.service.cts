import { dbService } from '../../services/db.service.cjs'
import { loggerService } from '../../services/logger.service.cjs'
import { utilService } from '../../services/util.service.cjs'
import { ObjectId } from 'mongodb'
import { Stay, StayFilter, SearchParam } from '../../models/stay.model.cjs'
export async function query(data) {
  const criteria = _buildCriteria(data)

  try {
    const collection = await dbService.getCollection('stay')
    const stays = await collection.find(criteria).toArray()

    const modifiedStays = stays.map((stay) => {
      stay.loc.lng = stay.loc.coordinates[0]
      stay.loc.lat = stay.loc.coordinates[1]
      delete stay.loc.type
      delete stay.loc.coordinates
      return stay
    })

    return modifiedStays
  } catch (err) {
    loggerService.error('cannot find stays', err)
    throw err
  }
}

export async function getById(stayId) {
  try {
    const collection = await dbService.getCollection('stay')
    const stay = collection.findOne({ _id: new ObjectId(stayId) })
    return stay
  } catch (err) {
    loggerService.error(`while finding stay ${stayId}`, err)
    throw err
  }
}

export async function remove(stayId) {
  try {
    const collection = await dbService.getCollection('stay')
    await collection.deleteOne({ _id: new ObjectId(stayId) })
  } catch (err) {
    loggerService.error(`cannot remove stay ${stayId}`, err)
    throw err
  }
}

export async function add(stay) {
  try {
    const collection = await dbService.getCollection('stay')
    await collection.insertOne(stay)
    return stay
  } catch (err) {
    loggerService.error('cannot insert stay', err)
    throw err
  }
}

export async function update(stay) {
  try {
    const stayToSave = new Stay(
      stay._id,
      stay.name,
      stay.type,
      stay.imgUrls,
      stay.price,
      stay.summary,
      stay.capacity,
      stay.amenities,
      stay.roomType,
      stay.host,
      stay.loc,
      stay.reviews,
      stay.likedByUsers,
      stay.labels,
      stay.equipment,
      stay.rate
    )

    const collection = await dbService.getCollection('stay')
    await collection.updateOne(
      { _id: new ObjectId(stay._id) },
      { $set: stayToSave }
    )
    return stay
  } catch (err) {
    loggerService.error(`cannot update stay ${stay._id}`, err)
    throw err
  }
}

export async function updateStayMsg(msg, stayId) {
  try {
    await removeStayMsg(stayId, msg.id)
    await addStayMsg(stayId, msg)
    return msg
  } catch (err) {
    console.log(err, `cannot update stay with msg ${msg}`)
    throw err
  }
}

export async function addStayMsg(stayId, msg) {
  try {
    if (!msg.id) msg.id = utilService.makeId()
    const collection = await dbService.getCollection('stay')
    await collection.updateOne(
      { _id: new ObjectId(stayId) },
      { $push: { msgs: msg } }
    )
    return msg
  } catch (err) {
    loggerService.error(`cannot add stay msg ${msg}`, err)
    throw err
  }
}

export async function removeStayMsg(stayId, msgId) {
  try {
    const collection = await dbService.getCollection('stay')
    await collection.updateOne(
      { _id: new ObjectId(stayId) },
      { $pull: { msgs: { id: msgId } } }
    )
    return msgId
  } catch (err) {
    loggerService.error(`cannot remove stay msg ${msgId}`, err)
    throw err
  }
}

function _buildCriteria(data: { filter: StayFilter; search: SearchParam }) {
  const { filter, search } = data

  const filterCriteria = _buildFilterCriteria(filter)
  const searchCriteria = _buildSearchCriteria(search)
  return {
    ...filterCriteria,
    ...searchCriteria,
  }
}

function _buildSearchCriteria(search: SearchParam) {
  const criteria = {}
  if (search.guests && +search.guests.adults) {
    let totalGuests = search.guests.adults + (search.guests.children || 0)
    criteria['capacity'] = { $gte: totalGuests }
  }
  console.log(search.location)

  if (search.location && search.location.name && search.location.coords) {
    const distanceLimitInMeters = 5000
    criteria['loc'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [search.location.coords.lng, search.location.coords.lat],
        },
        $maxDistance: distanceLimitInMeters,
      },
    }
  }
  return criteria
}

function _buildFilterCriteria(filter: StayFilter) {
  const criteria = {}

  if (filter.labels && filter.labels.length) {
    if (Array.isArray(filter.labels))
      criteria['$or'] = [
        { labels: filter.labels[0] },
        { type: filter.labels[0] },
      ]
    else criteria['$or'] = [{ labels: filter.labels }, { type: filter.labels }]
  }

  if (filter.equipment) {
    if (filter.equipment.bathNum) {
      criteria['equipment.bathNum'] = { $gte: filter.equipment.bathNum }
    }
    if (filter.equipment.bedsNum) {
      criteria['equipment.bedsNum'] = { $gte: filter.equipment.bedsNum }
    }
    if (filter.equipment.bedroomNum) {
      criteria['equipment.bedroomNum'] = { $gte: filter.equipment.bedroomNum }
    }
  }

  if (filter.amenities && filter.amenities.length) {
    if (!Array.isArray(filter.amenities)) filter.amenities = [filter.amenities]
    criteria['amenities'] = { $all: filter.amenities }
  }

  if (filter.superhost === true) {
    criteria['host.isSuperhost'] = true
  }

  if (Number(filter.maxPrice)) {
    criteria['price'] = { $lte: filter.maxPrice }
  }

  if (Number(filter.minPrice)) {
    criteria['price'] = criteria['price'] || {}
    criteria['price']['$gte'] = filter.minPrice
  }

  if (Object.keys(criteria).length === 0) return null

  return criteria
}

// export async function initData(entity) {
//   const entities = require(`../../../src/data/${entity}.json`)
//   // Convert string _id to ObjectId and update loc field
//   const entitiesWithObjectId = entities.map((entity) => {
//     if (entity._id && typeof entity._id === 'string') {
//       try {
//         entity._id = new ObjectId(entity._id)
//       } catch (error) {
//         entity._id = new ObjectId()
//       }
//     }

//     var newLoc = {
//       type: 'Point',
//       coordinates: [entity.loc.lng, entity.loc.lat],
//       country: entity.loc.country,
//       countryCode: entity.loc.countryCode,
//       city: entity.loc.city,
//       address: entity.loc.address,
//     }

//     entity.loc = newLoc
//     return entity
//   })

//   try {
//     const collection = await dbService.getCollection(entity)
//     await collection.insertMany(entitiesWithObjectId)
//     console.log('Inserted entities with ObjectId')

//     // Create a 2dsphere index on the loc field
//     await collection.createIndex({ loc: '2dsphere' })
//     console.log('2dsphere index created on loc field')
//   } catch (err) {
//     loggerService.error('Failed to insert entities or create index', err)
//   }
// }

module.exports = {
  remove,
  query,
  getById,
  add,
  update,
  updateStayMsg,
  addStayMsg,
  removeStayMsg,
  // initData,
}
