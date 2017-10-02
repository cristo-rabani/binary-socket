# Binary Socket

## Installation
```#bash

npm install binary-socket --save
```

## About
- Binary data is serialized according to [MessagePack](http://msgpack.org/) v5 specification.
  - Message format:
  
```
 [command, payload, streamId]
 
 New stream
 [ 'n'  , Meta , new streamId ]
 
 Data
 [ 'd'  , Data , streamId ]

 Pause
 [ 'p'  , null , streamId ]

 Resume
 [ 'r'  , null , streamId ]

 End
 [ 'e'  , null , streamId ]

 Close
 [ 'c'  , null , streamId ]
```
                
- Server Side Sockets works at the top of [ws package](https://github.com/websockets/ws) \(a Node.js WebSocket library)
