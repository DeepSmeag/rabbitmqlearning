import amqp from "amqplib/callback_api.js";
import { v4 as uuidv4 } from "uuid";

const taskID = uuidv4();
console.log(`Task ID: ${taskID}`);
amqp.connect("amqp://localhost", (err, conn) => {
  if (err) {
    throw err;
  }
  conn.createChannel((err, ch) => {
    if (err) {
      throw err;
    }
    const exchange = "tasks_exchange";
    const routingKey = taskID;

    ch.assertExchange(exchange, "direct", { durable: true });

    console.log(` [x] Sent taskID ${routingKey} to server workers`);
    // Creating the queue to listen on
    ch.assertQueue("", { exclusive: true }, (err, q) => {
      if (err) throw err;
      ch.bindQueue(q.queue, exchange, routingKey);
      console.log(
        ` [*] Subscribed to ${routingKey} updates in queue ${q.queue}`
      );
      ch.consume(
        q.queue,
        (msg) => {
          const statusUpdate = msg.content.toString();
          console.log(` [x] Received taskID update: ${statusUpdate}`);
          if (statusUpdate === "FINISHED" || statusUpdate === "ERROR") {
            console.log(
              ` [x] Task ${routingKey} completed with status: ${statusUpdate}`
            );
            conn.close();
            process.exit(0);
          }
        },
        { noAck: true }
      );
    });
    setTimeout(() => {
      ch.publish(exchange, "worker_queue", Buffer.from(routingKey), {
        persistent: true,
      });
    }, 500);
  });
});
