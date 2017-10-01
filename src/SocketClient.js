import EventEmitter from 'events';
import BufferStreamReader from 'buffer-stream-reader';
import WebSocket from 'ws';
import {Buffer} from 'buffer';

import {BinaryStream, msgpack} from './stream';

export class SocketClient extends EventEmitter {
    constructor (socket, options = {}) {
        super();

        this._options = Object.assign({
            chunkSize: 40960,
            handleProtocols: false
        }, options);

        this.streams = {};

        if (typeof socket === 'string') {
            this._nextId = 0;
            this._socket = new WebSocket(socket);
        } else {
            // Use odd numbered ids for server originated streams
            this._nextId = 1;
            this._socket = socket;
        }

        this._socket.binaryType = 'arraybuffer';

        this._socket.on('open', () => this.emit('open'));

        this._socket.on('drain', () => {
            const ids = Object.keys(this.streams);
            for (let i = 0, ii = ids.length; i < ii; i++) {
                this.streams[ids[i]]._onDrain();
            }
        });
        this._socket.on('error', (error) => {
            const ids = Object.keys(this.streams);
            for (let i = 0, ii = ids.length; i < ii; i++) {
                this.streams[ids[i]]._onError(error);
            }
            this.emit('error', error);
        });
        this._socket.on('close', (code, message) => {
            const ids = Object.keys(this.streams);
            for (let i = 0, ii = ids.length; i < ii; i++) {
                this.streams[ids[i]]._onClose();
            }
            this.emit('close', code, message);
        });
        this._socket.on('message', (data) => {
            process.nextTick(() => {
                // Message format
                // [command, payload, bonus ]
                //
                // New stream
                // [ 'n'  , Meta , new streamId ]
                //
                //
                // Data
                // [ 'd'  , Data , streamId ]
                //
                //
                // Pause
                // [ 'p'  , null , streamId ]
                //
                //
                // Resume
                // [ 'r'  , null , streamId ]
                //
                //
                // End
                // [ 'e'  , null , streamId ]
                //
                //
                // Close
                // [ 'c'  , null , streamId ]
                //

                // data = data.data;

                try {
                    data = msgpack.decode(data);
                } catch (ex) {
                    return this.emit('error', new Error('Received broken data: ' + ex));
                }

                if (!(data instanceof Array)) {
                    return this.emit('error', new Error('Received data in bad structure'));
                }

                if (data.length !== 3) {
                    return this.emit('error', new Error('Structure has wrong part count: ' + data.length));
                }

                if (typeof data[0] !== 'string') {
                    return this.emit('error', new Error('Received data type is not a string: ' + data[0]));
                }

                const streamId = data[2];
                const binaryStream = this.streams[streamId];

                switch (data[0]) {
                    case 'n':
                        const meta = data[1];
                        const newBinaryStream = new BinaryStream(this._socket, streamId, false);
                        newBinaryStream.on('close', () => {
                            delete this.streams[streamId];
                        });
                        this.streams[streamId] = newBinaryStream;
                        this.emit('stream', newBinaryStream, meta);
                        break;
                    case 'd':
                        const payload = data[1];
                        if (binaryStream) {
                            binaryStream._onData(payload);
                        } else {
                            this.emit('error', new Error('Received `data` for unknown stream: ' + streamId));
                        }
                        break;
                    case 'p':
                        if (binaryStream) {
                            binaryStream._onPause();
                        } else {
                            this.emit('error', new Error('Received `pause` command for unknown stream: ' + streamId));
                        }
                        break;
                    case 'r':
                        if (binaryStream) {
                            binaryStream._onResume();
                        } else {
                            this.emit('error', new Error('Received `resume` command for unknown stream: ' + streamId));
                        }
                        break;
                    case 'e':
                        if (binaryStream) {
                            binaryStream._onEnd();
                        } else {
                            this.emit('error', new Error('Received `end` command for unknown stream: ' + streamId));
                        }
                        break;
                    case 'c':
                        if (binaryStream) {
                            binaryStream._onClose();
                        } else {
                            this.emit('error', new Error('Received `close` command for unknown stream: ' + streamId));
                        }
                        break;
                    default:
                        this.emit('error', new Error('Unrecognized command type received: ' + data[0]));
                }
            });
        });
    }

    send (data, meta){
        const stream = this.createStream(meta);
        if(data instanceof Stream) {
            data.pipe(stream);
        } else {
            if(Buffer.isBuffer(data)) {
                (new BufferStreamReader(data, {chunkSize: this._options.chunkSize})).pipe(stream);
            } else {
                stream.write(data);
            }
        }
        return stream;
    }

    createStream (meta){
        if(this._socket.readyState !== WebSocket.OPEN) {
            throw new Error('Client is not yet connected or gone');
        }
        const streamId = this._nextId;
        this._nextId += 2;
        const binaryStream = new BinaryStream(this._socket, streamId, true, meta);
        binaryStream.on('close', () => {
            delete this.streams[streamId];
        });
        this.streams[streamId] = binaryStream;
        return binaryStream;
    }

    close () {
        this._socket.close();
    }
}


export default SocketClient;
