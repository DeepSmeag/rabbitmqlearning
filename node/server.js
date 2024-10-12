#!/opt/homebrew/bin/node
import amqp from "amqplib/callback_api.js";

amqp.connect("amqp://localhost", (err, conn) => {
  if (err) throw err;

  conn.createChannel((err, ch) => {
    if (err) throw err;

    const exchange = "tasks_exchange";
    ch.assertExchange(exchange, "direct", { durable: true });

    // Ensure a durable worker queue to receive task requests
    ch.assertQueue("worker_queue", { durable: true }, (err, q) => {
      if (err) throw err;
      ch.bindQueue(q.queue, exchange, "worker_queue");
      ch.consume(q.queue, (msg) => {
        // Acknowledge the message (task is being processed)
        ch.ack(msg);
        const taskID = msg.content.toString();
        console.log(`[x] Received task ID ${taskID}`);

        // Simulate sending status updates as the task progresses
        const sendStatusUpdate = (status) => {
          ch.publish(exchange, taskID, Buffer.from(status));
          console.log(`[x] Sent status update: ${status}`);
        };

        // Simulate task execution
        console.log(`Sending WAITING for ${taskID}`);
        sendStatusUpdate("WAITING");

        setTimeout(() => {
          console.log(`Sending IN PROGRESS for ${taskID}`);
          sendStatusUpdate("IN PROGRESS");

          // Simulate a 3-5 second delay
          const delay = Math.floor(Math.random() * 3000) + 3000;
          setTimeout(() => {
            const finalStatus = Math.random() > 0.5 ? "FINISHED" : "ERROR";
            console.log(`Sending ${finalStatus} for ${taskID}`);
            sendStatusUpdate(finalStatus);
          }, delay);
        }, 1000);
      });
    });
    // bind the worker queue to the exchange

    console.log("[*] Waiting for tasks. To exit press CTRL+C");
  });
});
