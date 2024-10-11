#!/opt/homebrew/bin/node
import amqp from "amqplib/callback_api.js";

amqp.connect("amqp://localhost", (err, conn) => {
  if (err) {
    throw err;
  }
  conn.createChannel((err, ch) => {
    const q = "task_queue";
    const message = process.argv.slice(2).join(" ") || "Hello World!";
    ch.assertQueue(q, { durable: true });
    ch.sendToQueue(q, Buffer.from(message), { persistent: true });

    console.log(" [x] Sent '%s'", message);
  });
  setTimeout(() => {
    conn.close();
    process.exit(0);
  }, 500);
});
