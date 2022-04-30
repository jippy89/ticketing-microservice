import request from 'supertest'
import { app } from '../../app'
import { signup } from '../../test/auth-helper'
import mongoose from 'mongoose'
import { Order } from '../../models/order'
import { OrderStatus } from '@jiptickets/common'

it('returns a 404 error when the order does not exist', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', await signup())
    .send({
      token: 'asdf',
      orderId: mongoose.Types.ObjectId().toHexString()
    })
    .expect(404)
})

it('returns 401 when the user is not authenticated', async () => {
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 20,
    status: OrderStatus.Created
  })

  await request(app)
    .post('/api/payments')
    .send({
      token: 'asdf',
      orderId: order.id
    })
    .expect(401)
})

it('returns a 400 when purchasing a cancelled order', async () => {
  const userId = mongoose.Types.ObjectId().toHexString()
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId,
    version: 0,
    price: 20,
    status: OrderStatus.Cancelled
  })
  await order.save()

  await request(app)
    .post('/api/payments')
    .set('Cookie', await signup(userId))
    .send({
      token: 'asdf',
      orderId: order.id
    })
    .expect(400)
})

// it('returns a 401 when the user is not the owner of the order', async () => {
//   const user = await signup()
//   const order = Order.build({
//     id: mongoose.Types.ObjectId().toHexString(),
//     userId: mongoose.Types.ObjectId().toHexString(),
//     version: 0,
//     price: 20,
//     status: OrderStatus.Created
//   })

//   await request(app)
//     .post('/api/payments')
//     .set('Cookie', user)
//     .send({
//       token: 'asdf',
//       orderId: order.id
//     })
//     .expect(401)
// })