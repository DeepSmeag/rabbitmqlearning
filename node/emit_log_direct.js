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
    const exchange = "direct_logs";
    const args = process.argv.slice(2);
    const message = args.slice(1).join(" ") || "Hello World!";
    const severity = args.length > 0 ? args[0] : "info";

    ch.assertExchange(exchange, "direct", { durable: true });
    ch.publish(exchange, severity, Buffer.from(message));

    console.log(" [x] Sent %s: '%s'", severity, message);
  });
  setTimeout(() => {
    conn.close();
    process.exit(0);
  }, 500);
});
