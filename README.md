Project to learn rabbitmq's behaviour and configuration

Working with the idea of horizontal scaling in mind

### This branch covers the following scenario:

- the "client" sends a request with an id to the queue, which directs it to any of the available "servers"; this is the worker-scenario, we simulate the idea of triggering a long-running task on the server
- after sending the request, the client starts consuming (listening to) = subscribes to a queue with the task's id
- upon receiving the task request, the server simulates a long-running task for a few seconds (3-5); during this time, it sends updates to the queue in the following way:
  - upon receiving the request, it immediately calls its worker function
  - the worker function sends an update with status "WAITING"
  - then it waits just 1s and then sends another "IN PROGRESS"; this is to simulate getting ready to perform a bigger task and then starting it
  - then it waits for 3-5s (random choice); at the end it has a 50/50 chance of sending a final update of "FINISHED" or "ERROR"
- upon receiving a final update (FINISHED/ERROR), the client disconnects from the queue, thus destroying it and clearing it

To achieve these scenarios, we have 2 techniques from rabbitmq we're choosing: publishing to a worker-oriented queue that distributes the requests, and a pubsub situation based on "direct" exchange; there is no need for topic exchanges, since each id should be unique

The configuration works in a distributed system environment, since we do not depend on the number of client and server instances; the distribution is as uniform as possible with the round-robin strategy as a starting point and limitations are a concern starting at around 32000 concurrent clients, when the default limits of RabbitMQ would limit the number of queues [(here)](https://stackoverflow.com/questions/22989833/rabbitmq-how-many-queues-can-rabbitmq-handle-on-a-single-server), but this number can be modified and scaling the RabbitMQ system itself is a solution.

## Links/References

- RabbitMQ's [tutorials](https://www.rabbitmq.com/tutorials/tutorial-one-javascript)
- RabbitMQ's [docs](https://www.rabbitmq.com/docs) - to a lesser extent
- amqplib's [docs](https://amqp-node.github.io/amqplib/) - where I found out there's a promise-based API as well

### Notes / Considerations

- it is advised by the RabbitMQ team and package contributors to use a single channel per thread or per way of communication; JS is single-threaded, but we have bi-directional communication between the instances and the queue; it would be recommended to create separate channels for each situation; to do this, the Promise-based API (amqplib) would be more intuitive (imo)
  - this channel separation advice is given as RabbitMQ can throttle publishers, leading to a bottleneck in consumers as well; so maintaining a separate channel for each usage of the connection is the recommended practice
  - I'm not doing this here, since it's a simple example, though I wanted to mention it
- message-related mechanisms to keep in mind:
  - publishing to an exchange means we want to decouple the specific queue from the publisher as much as possible; we choose the routing key and the service handles the rest; on the server side, we do bind a queue to the exchange but unless we specify the routing key, messages will be dropped
  - client-sent taskID is kept in queue persistently until handled; this is because the queue with the right routing key exists and keeps existing (worker_queue with routingKey=worker_queue)
  - server-sent updates are not kept persistently; each client's listening queue gets deleted upon disconnecting, so the rabbitmq services knows to drop unroutable messages
- due to rabbitmq's default round-robin message dispersion strategy, we know that multiple instances of the "backend" will receive requests; multiple "client" instances will as well receive their messages; as such, the system can be scaled; next step would be a distributed queue system, when a single rabbitmq instance is not enough; that would require a huge user-base
  - an alternate approach (since we would be bound mainly by number of queues, not necessarily number of messages) could apply in a specific case: if the client (user) is assigned a server instance which then sends the task to a separate worker instance (another server, a microservice); in this case, we have a controllable number of servers and worker instances; instead of creating queues per taskID, we could create queues per server instance, and the server instance would then handle the taskID updates with an internal routing/update mechanism; this would allow for a more controlled number of queues, but would require more complexity on the server itself;
  - such situations with intermediary servers arise especially in microservice architectures;
  - another example of a situation would be a fullstack web framework which handles both client-side and server-side; doing long-running tasks on it might not be ideal, since it could pottentially stall client requests and lead to a bad experience; in this case, opting for a separate instance service to offload the processing to would be better, and we arrive at the same situation as above
