#!/opt/homebrew/bin/node
import amqp from "amqplib/callback_api.js";

amqp.connect("amqp://localhost", (err, conn) => {
  if (err) {
    throw err;
  }
  conn.createChannel((err, ch) => {
    if (err) {
      console.error(err);
      throw err;
    }
    const exchange = "topic_logs";
    const args = process.argv.slice(2);
    const message = args.slice(1).join(" ") || "Hello World!";
    const key = args.length > 0 ? args[0] : "anonymous.info";

    ch.assertExchange(exchange, "topic", { durable: true });
    ch.publish(exchange, key, Buffer.from(message));

    console.log(" [x] Sent %s: '%s'", key, message);
  });
  setTimeout(() => {
    conn.close();
    process.exit(0);
  }, 500);
});
