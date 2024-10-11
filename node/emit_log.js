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
    const exchange = "logs";
    const message = process.argv.slice(2).join(" ") || "Hello World!";
    ch.assertExchange(exchange, "fanout", { durable: true });
    ch.publish(exchange, "", Buffer.from(message));

    console.log(" [x] Sent '%s'", message);
  });
  setTimeout(() => {
    conn.close();
    process.exit(0);
  }, 500);
});
