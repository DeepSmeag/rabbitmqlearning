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
