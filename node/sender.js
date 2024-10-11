#!/opt/homebrew/bin/node
import amqp from "amqplib/callback_api.js";

amqp.connect("amqp://localhost", (err, conn) => {
  if (err) {
    throw err;
  }
  conn.createChannel((err, ch) => {
    const q = "hello";
    ch.assertQueue(q, { durable: false });
    const message = "Hello World!";
    ch.sendToQueue(q, Buffer.from(message));

    console.log(" [x] Sent 'Hello World!'");
  });
  setTimeout(() => {
    conn.close();
    process.exit(0);
  }, 500);
});
