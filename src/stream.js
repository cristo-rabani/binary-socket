import {Stream} from 'stream';
import Msgpack5 from 'msgpack5';
export const msgpack = Msgpack5();
const ArrayBufferClass = typeof ArrayBuffer !== 'undefined' ? ArrayBuffer : () => {/*nop*/};

export class BinaryStream extends Stream {
    constructor (socket, id, create, meta) {
        super();

        this.id = id;
        this._socket = socket;

        this.writable = true;
        this.readable = true;
        this.paused = false;

        this._closed = false;
        this._ended = false;

        if (create) {
            // creating new one
            this._write('n', meta, this.id);
        }
    }

    _onDrain () {
        if (!this.paused) {
            this.emit('drain');
        }
    }

    _onClose () {
        // Emit close event
        if (this._closed) {
            return;
        }
        this.readable = false;
        this.writable = false;
        this._closed = true;
        this.emit('close');
    }

    _onError (error) {
        this.readable = false;
        this.writable = false;
        this.emit('error', error);
    }

    _onPause () {
        // Emit pause event
        this.paused = true;
        this.emit('pause');
    }

    _onResume () {
        // Emit resume event
        this.paused = false;
        this.emit('resume');
        this.emit('drain');
    }

    _write (cmd, data, _id) {
        if (this._socket.readyState !== this._socket.constructor.OPEN) {
            return false;
        }
        console.log(cmd, data, _id);
        const message = msgpack.encode([cmd, data, _id]).slice();
        return this._socket.send(message) !== false;
    }

    write (data) {
        if (this.writable) {
            if (data && data instanceof ArrayBufferClass) {
                data = Buffer.from(data);
            }
            const out = this._write('d', data, this.id);
            return !this.paused && out;
        }
        this.emit('error', new Error('Stream is not writable'));
        return false;
    }

    end () {
        this._ended = true;
        this.readable = false;
        this._write('e', null, this.id);
    }

    destroy () {
        this._onClose();
        this._write('c', null, this.id);
    }

    _onEnd () {
        if (this._ended) {
            return;
        }
        this._ended = true;
        this.readable = false;
        this.emit('end');
    }

    _onData (data) {
        // Dispatch
        this.emit('data', data);
    }

    pause () {
        this._onPause();
        this._write('p', null, this.id);
    }

    resume () {
        this._onResume();
        this._write('r', null, this.id);
    }
}


export default BinaryStream;
