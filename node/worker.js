#!/opt/homebrew/bin/node
import amqp from "amqplib/callback_api.js";

amqp.connect("amqp://localhost", (err, conn) => {
  if (err) {
    console.error(err);
    throw err;
  }
  conn.createChannel((err, ch) => {
    const q = "task_queue";
    ch.assertQueue(q, { durable: true });
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
    ch.consume(
      q,
      (msg) => {
        const secs = msg.content.toString().split(".").length - 1;
        console.log(
          " [x] Received %s, working %d seconds",
          msg.content.toString(),
          secs
        );
        setTimeout(() => {
          console.log(" [x] Done %s", msg.content.toString());
        }, secs * 1000);
      },
      { noAck: true }
    );
  });
});
