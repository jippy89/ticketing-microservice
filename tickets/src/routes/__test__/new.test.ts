import request from 'supertest'
import { app } from '../../app'
import { Ticket } from '../../models/ticket'
import { signup } from '../../test/auth-helper'
import { natsWrapper } from '../../nats-wrapper'

it('has a route handler listening to /api/tickets for post requests', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .send({})

  expect(response.status).not.toEqual(404)
})

it('can only be accessed if the user is signed in', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .send({})

  expect(response.status).toBe(401)
})

it('returns status other than 401 if user signed in', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', await signup())
    .send({})

  expect(response.status).not.toEqual(401)
})

describe('Request body validation', () => {
  it('returns an error if invalid title is provided', async () => {
    await request(app)
      .post('/api/tickets')
      .set('Cookie', await signup())
      .send({
        title: '',
        price: 99
      })
      .expect(400)
    
    const response = await request(app)
      .post('/api/tickets')
      .set('Cookie', await signup())
      .send({
        price: 99
      })
      .expect(400)
  })
  
  it('returns an error if invalid price is provided', async () => {
    await request(app)
      .post('/api/tickets')
      .set('Cookie', await signup())
      .send({
        title: 'Lorem',
        price: -99
      })
      .expect(400)
    
    const response = await request(app)
      .post('/api/tickets')
      .set('Cookie', await signup())
      .send({
        title: 'Lorem'
      })
      .expect(400)
  })

  it('creates a ticket with valid inputs', async () => {
    let tickets = await Ticket.find({})
    expect(tickets.length).toBe(0)

    const title = 'Lorem'

    await request(app)
      .post('/api/tickets')
      .set('Cookie', await signup())
      .send({
        title: title,
        price: 99
      })
      .expect(201)

    tickets = await Ticket.find({})
    expect(tickets.length).toBe(1)
    expect(tickets[0].title).toBe(title)
    expect(tickets[0].price).toBe(99)
  })

  it('Publishes an event once ticket has been created', async () => {
    const title = 'Lorem'

    await request(app)
      .post('/api/tickets')
      .set('Cookie', await signup())
      .send({
        title: title,
        price: 99
      })
      .expect(201)
    
    expect(natsWrapper.client.publish).toHaveBeenCalled()
  })
})