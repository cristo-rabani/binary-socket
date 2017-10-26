import SocketClient from './SocketClient';
import {randomId, noBindEnv} from './helpers';
import EventEmitter from 'events';

/**
 * Binary Socket
 */
export class SocketServer extends EventEmitter {
    clients = {};

    constructor (options = {}) {
        super();
        /*global Meteor*/
        options = Object.assign({
            host: '0.0.0.0',
            chunkSize: 40960,
            bindEnvironment: typeof Meteor === 'object' && Meteor.bindEnvironment
        }, options);

        this._bindEnvironment = options.bindEnvironment || noBindEnv;
        const Server = require('ws').Server;
        if (options.server && (options.server instanceof Server)) {
            this._server  = options.server;
        } else {
            this._server  = new Server(options);
        }
        this._options = options;

        this._handleServerConnection = this._bindEnvironment(socket => {
            const client = new SocketClient(socket, this._options);
            client.id = randomId();
            this.clients[client.id] = client;
            client.on('close', () => {
                delete this.clients[client.id];
            });
            this.emit('connection', client);
        });

        this._server.on('connection', this._handleServerConnection);
        this._server.on('error', error => this.emit('error', error));
    }

    close (code, message) {
        this._server.close(code, message);
    }
}


export default SocketServer;
