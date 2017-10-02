# Binary Socket
Simple Binary Sockets for node & web, ready to use, builded on thoroughly tested modules, standards. Sockets are easy to integrate.

## Installation
```#bash

npm install binary-socket --save
```

## Server
```
import {SocketServer} from 'binary-socket';

const wss = new SocketServer({});

wss.on('connection', function connection (client) {
    client.on('stream', (stream, meta) => onStreamHandler({stream, meta, onStream, client}));
});
wss.on('error', err => console.error('SocketServer Error:', err));
```

## Client
```
import {SocketClient} from 'binary-socket';

const client = new SocketClient('ws://www.myhost.com/path');

client.on('open', () => {
     const stream = client.createStream({someKey: 'some value'});
});
client.on('error', err => console.error(err));
```

## Sharing Server with other sockets
```
const WS = require('ws');
const server = new WS.Server({server: httpServer, path});
const handleUpgrade = server.handleUpgrade.bind(server);
server.handleUpgrade = function upgradeRouter (req, ...params) {
    if (req.url === path) {
        return handleUpgrade (req, ...params);
    }
};
wss = new SocketServer({
    server
});
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
