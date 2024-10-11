#!/opt/homebrew/bin/node
import amqp from "amqplib/callback_api.js";

amqp.connect("amqp://localhost", (err, conn) => {
  if (err) {
    console.error(err);
    throw err;
  }
  conn.createChannel((err, ch) => {
    if (err) {
      console.error(err);
      throw err;
    }
    const exchange = "logs";
    ch.prefetch(5); // let's say at most we can process 5 things so we tell the queue to skip this instance if it already has 5 things going on
    ch.assertExchange(exchange, "fanout", { durable: true });
    ch.assertQueue("", { exclusive: true }, (err, q) => {
      if (err) {
        console.error(err);
        throw err;
      }
      ch.bindQueue(q.queue, exchange, "");
      console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
      ch.consume(
        q.queue,
        (msg) => {
          const secs = msg.content.toString().split(".").length - 1;
          console.log(
            " [x] Received %s, working %d seconds",
            msg.content.toString(),
            secs
          );
          setTimeout(() => {
            console.log(" [x] Done %s", msg.content.toString());
            ch.ack(msg);
          }, secs * 1000);
        },
        { noAck: false }
      );
    });
  });
});
