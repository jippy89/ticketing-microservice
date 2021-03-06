import { Listener, OrderStatus, PaymentCreatedEvent, Subjects } from "@jiptickets/common";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";
import { QueueGroupNames } from './queue-group-names'

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
  queueGroupName = QueueGroupNames.OrderService;

  async onMessage(data: PaymentCreatedEvent['data'], msg: Message) {
    const order = await Order.findById(data.orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    order.set({
      status: OrderStatus.Complete
    });
    await order.save();

    // Technically you can add another publisher like `order:updated`
    // But it would be unnecessary especially for the tutorial and there
    // will be no other listeners for this event.

    msg.ack();
  }
}