#!/opt/homebrew/bin/node
import amqp from "amqplib/callback_api.js";
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: receive_logs_direct.js [info] [warning] [error]");
  process.exit(1);
}
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
    const exchange = "direct_logs";
    ch.prefetch(5); // let's say at most we can process 5 things so we tell the queue to skip this instance if it already has 5 things going on
    ch.assertExchange(exchange, "direct", { durable: true });
    ch.assertQueue("", { exclusive: true }, (err, q) => {
      if (err) {
        console.error(err);
        throw err;
      }
      for (const severity of args) {
        ch.bindQueue(q.queue, exchange, severity);
      }
      console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
      ch.consume(
        q.queue,
        (msg) => {
          const secs = msg.content.toString().split(".").length - 1;
          console.log(
            " [x] Received %s of severity [%s], working %d seconds",
            msg.content.toString(),
            msg.fields.routingKey,
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
