import { TicketCreatedEvent } from "@jiptickets/common"
import { TicketCreatedListener } from "../ticket-created-listener"
import { natsWrapper } from "../../../nats-wrapper"
import mongoose from 'mongoose'
import { Message } from 'node-nats-streaming'
import { Ticket } from "../../../models/ticket"

const setup = async () => {
  // creates an instance of listener
  const listener = new TicketCreatedListener(natsWrapper.client)
  // create a fake data event
  const data: TicketCreatedEvent['data'] = {
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    title: 'concert',
    price: 10,
    userId: mongoose.Types.ObjectId().toHexString()
  }

  // create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  }

  return { listener, data, msg }
}

it('creates and saves a ticket', async () => {
  const { listener, data, msg } = await setup()
  // call the `onMessage` function with the data + object + message object
  await listener.onMessage(data, msg)
  // write assertions to make sure a ticket was created
  const ticket  = await Ticket.findById(data.id)

  expect(ticket).toBeDefined()
  expect(ticket!.title).toEqual(data.title)
  expect(ticket!.price).toEqual(data.price)
})

it('ack a message', async () => {
  // call the `onMessage` function with the data + object + message object
  // write assertions to make sure a ticket was created
})