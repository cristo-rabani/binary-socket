'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SocketClient = undefined;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _stream = require('stream');

var _bufferStreamReader = require('buffer-stream-reader');

var _bufferStreamReader2 = _interopRequireDefault(_bufferStreamReader);

var _buffer = require('buffer');

var _nextTick = require('next-tick-2');

var _nextTick2 = _interopRequireDefault(_nextTick);

var _helpers = require('./helpers');

var _stream2 = require('./stream');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SocketClient = exports.SocketClient = function (_EventEmitter) {
    (0, _inherits3.default)(SocketClient, _EventEmitter);

    function SocketClient(socket) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        (0, _classCallCheck3.default)(this, SocketClient);

        /*global Meteor*/
        var _this = (0, _possibleConstructorReturn3.default)(this, (SocketClient.__proto__ || (0, _getPrototypeOf2.default)(SocketClient)).call(this));

        _this._options = (0, _assign2.default)({
            chunkSize: 40960,
            handleProtocols: false,
            bindEnvironment: (typeof Meteor === 'undefined' ? 'undefined' : (0, _typeof3.default)(Meteor)) === 'object' && Meteor.bindEnvironment
        }, options);

        _this._bindEnvironment = options.bindEnvironment || _helpers.noBindEnv;

        _this.streams = {};

        if (typeof socket === 'string') {
            if (typeof process !== 'undefined' && process.versions && process.versions.node) {
                var _WebSocket = require('ws');
                _this._socket = new _WebSocket(socket);
            } else {
                if (typeof WebSocket === 'undefined') {
                    throw new Error('Missing WebSocket!');
                }
                _this._socket = new WebSocket(socket);
            }
        } else {
            // Use odd numbered ids for server originated streams
            _this._socket = socket;
        }

        _this._socket.binaryType = 'arraybuffer';

        if (!_this._socket.on && _this._socket.addEventListener) {
            _this._socket.on = _this._socket.addEventListener;
        }
        if (!_this._socket.on && _this._socket.attachEvent) {
            _this._socket.on = _this._socket.attachEvent;
        }

        _this._socket.on('open', function () {
            return _this.emit('open');
        });

        _this._socket.on('drain', function () {
            (0, _keys2.default)(_this.streams).forEach(function (key) {
                return _this.streams[key]._onDrain();
            });
        });
        _this._socket.on('error', function (error) {
            (0, _keys2.default)(_this.streams).forEach(function (key) {
                return _this.streams[key]._onError(error);
            });
            _this.emit('error', error);
        });
        _this._socket.on('close', function (code, message) {
            (0, _keys2.default)(_this.streams).forEach(function (key) {
                return _this.streams[key]._onClose();
            });
            _this.emit('close', code, message);
        });
        _this._socket.on('message', function (data) {
            if (data.data) {
                data = data.data;
            }
            (0, _nextTick2.default)(_this._bindEnvironment(function () {
                // Message format
                // [command, payload, streamId]
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

                try {
                    data = _stream2.msgpack.decode(data);
                } catch (ex) {
                    return _this.emit('error', new Error('Received broken data: ' + ex));
                }

                if (!(data instanceof Array)) {
                    return _this.emit('error', new Error('Received data in bad structure'));
                }

                if (data.length !== 3) {
                    return _this.emit('error', new Error('Structure has wrong part count: ' + data.length));
                }

                if (typeof data[0] !== 'string') {
                    return _this.emit('error', new Error('Received data type is not a string: ' + data[0]));
                }

                var streamId = data[2];
                var binaryStream = _this.streams[streamId];

                switch (data[0]) {
                    case 'n':
                        var meta = data[1];
                        var newBinaryStream = new _stream2.BinaryStream(_this._socket, streamId, false);
                        newBinaryStream.on('close', function () {
                            delete _this.streams[streamId];
                        });
                        _this.streams[streamId] = newBinaryStream;
                        _this.emit('stream', newBinaryStream, meta);
                        break;
                    case 'd':
                        var payload = data[1];
                        if (binaryStream) {
                            binaryStream._onData(payload);
                        } else {
                            _this.emit('error', new Error('Received `data` for unknown stream: ' + streamId));
                        }
                        break;
                    case 'p':
                        if (binaryStream) {
                            binaryStream._onPause();
                        } else {
                            _this.emit('error', new Error('Received `pause` command for unknown stream: ' + streamId));
                        }
                        break;
                    case 'r':
                        if (binaryStream) {
                            binaryStream._onResume();
                        } else {
                            _this.emit('error', new Error('Received `resume` command for unknown stream: ' + streamId));
                        }
                        break;
                    case 'e':
                        if (binaryStream) {
                            binaryStream._onEnd();
                        } else {
                            _this.emit('error', new Error('Received `end` command for unknown stream: ' + streamId));
                        }
                        break;
                    case 'c':
                        if (binaryStream) {
                            binaryStream._onClose();
                        } else {
                            _this.emit('error', new Error('Received `close` command for unknown stream: ' + streamId));
                        }
                        break;
                    default:
                        _this.emit('error', new Error('Unrecognized command type received: ' + data[0]));
                }
            }));
        });
        return _this;
    }

    (0, _createClass3.default)(SocketClient, [{
        key: 'send',
        value: function send(data, meta) {
            var stream = this.createStream(meta);
            if (data instanceof _stream.Stream) {
                data.pipe(stream);
            } else if (_buffer.Buffer.isBuffer(data)) {
                new _bufferStreamReader2.default(data, { chunkSize: this._options.chunkSize }).pipe(stream);
            } else {
                stream.write(data);
            }
            return stream;
        }
    }, {
        key: 'createStream',
        value: function createStream(meta) {
            var _this2 = this;

            if (this._socket.readyState !== WebSocket.OPEN) {
                throw new Error('Client is not yet connected or gone');
            }
            var streamId = (0, _helpers.randomId)(12);
            var binaryStream = new _stream2.BinaryStream(this._socket, streamId, true, meta);
            binaryStream.on('close', function () {
                delete _this2.streams[streamId];
            });
            this.streams[streamId] = binaryStream;
            return binaryStream;
        }
    }, {
        key: 'close',
        value: function close() {
            this._socket.close();
        }
    }]);
    return SocketClient;
}(_events2.default);

exports.default = SocketClient;