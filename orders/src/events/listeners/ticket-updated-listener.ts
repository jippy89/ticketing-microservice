import { Message } from 'node-nats-streaming'
import { Subjects, Listener, TicketUpdatedEvent } from '@jiptickets/common'
import { Ticket } from '../../models/ticket'
import { QueueGroupNames } from './queue-group-names'

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated
  queueGroupName = QueueGroupNames.OrderService

  async onMessage(data: TicketUpdatedEvent['data'], msg: Message) {
    const ticket = await Ticket.findByEvent(data)

    if (!ticket) {
      throw new Error('Ticket not found')
    }

    const { title, price } = data
    ticket.set({
      title,
      price
    })
    await ticket.save()

    msg.ack()
  }
}