import request from 'supertest'
import { app } from '../../app'
import mongoose from 'mongoose'
import { signup } from '../../test/auth-helper'
import { natsWrapper } from '../../nats-wrapper'
import { Ticket } from '../../models/ticket'

it('returns 404 if the provided id does not exist', async () => {
  const id = mongoose.Types.ObjectId().toHexString()

  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', await signup())
    .send({
      title: 'Iron Man',
      price: 90
    })
    .expect(404)
})

it('returns 401 if the user is not authenticated', async () => {
  const id = mongoose.Types.ObjectId().toHexString()

  await request(app)
    .put(`/api/tickets/${id}`)
    .send({
      title: 'Iron Man',
      price: 90
    })
    .expect(401)
})

it('returns 404 if the user does not own the ticket', async () => {
  const response = await request(app)
    .post(`/api/tickets`)
    .set('Cookie', await signup())
    .send({
      title: 'Abcdef',
      price: 90
    })

  expect(typeof response.body.id).toBe('string')
  expect(response.body.title).toBe('Abcdef')
  expect(response.body.price).toBe(90)

  await request(app)
    .put('/api/tickets/' + response.body.id)
    .set('Cookie', await signup())
    .send({
      title: 'Fedcba',
      price: 100
    })
    .expect(401)
})

describe('Request body validation', () => {
  
  it('returns 400 if the title is invalid', async () => {
    const cookie = await signup()
    const response = await request(app)
      .post(`/api/tickets`)
      .set('Cookie', cookie)
      .send({
        title: 'Abcdef',
        price: 90
      })

    await request(app)
      .put(`/api/tickets/${response.body.id}`)
      .set('Cookie', cookie)
      .send({
        title: '',
        price: 90
      })
      .expect(400)
  })
  
  it('returns 400 if the price is invalid', async () => {
    const cookie = await signup()
    const response = await request(app)
      .post(`/api/tickets`)
      .set('Cookie', cookie)
      .send({
        title: 'Abcdef',
        price: 90
      })
    
    await request(app)
      .put(`/api/tickets/${response.body.id}`)
      .set('Cookie', cookie)
      .send({
        title: 'Updated',
        price: -90
      })
      .expect(400)
  })
})

it('Updates the ticket with valid inputs', async () => {
  const cookie = await signup()
  const postResponse = await request(app)
    .post(`/api/tickets`)
    .set('Cookie', cookie)
    .send({
      title: 'Abcdef',
      price: 90
    })
  
  const putResponse = await request(app)
    .put(`/api/tickets/${postResponse.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'Updated',
      price: 100
    })
    .expect(200)

  expect(putResponse.body.title).toBe('Updated')
  expect(putResponse.body.price).toBe(100)
})

it('Publishes an event once ticket has been created', async () => {
  const cookie = await signup()
  const postResponse = await request(app)
    .post(`/api/tickets`)
    .set('Cookie', cookie)
    .send({
      title: 'Abcdef',
      price: 90
    })
  
  const putResponse = await request(app)
    .put(`/api/tickets/${postResponse.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'Updated',
      price: 100
    })
    .expect(200)

  expect(natsWrapper.client.publish).toHaveBeenCalled()
})

it('Rejects updates if ticket is reserved', async () => {
  const cookie = await signup()
  const postResponse = await request(app)
    .post(`/api/tickets`)
    .set('Cookie', cookie)
    .send({
      title: 'Abcdef',
      price: 90
    })

  const ticket = await Ticket.findById(postResponse.body.id)
  ticket!.set({ orderId: mongoose.Types.ObjectId().toHexString() })
  await ticket!.save()
  
  const putResponse = await request(app)
    .put(`/api/tickets/${postResponse.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'Updated',
      price: 100
    })
    .expect(400)
})