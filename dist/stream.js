'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BinaryStream = exports.msgpack = undefined;

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

var _stream = require('stream');

var _msgpack = require('msgpack5');

var _msgpack2 = _interopRequireDefault(_msgpack);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var msgpack = exports.msgpack = (0, _msgpack2.default)();
var ArrayBufferClass = typeof ArrayBuffer !== 'undefined' ? ArrayBuffer : function () {/*nop*/};

var BinaryStream = exports.BinaryStream = function (_Stream) {
    (0, _inherits3.default)(BinaryStream, _Stream);

    function BinaryStream(socket, id, create, meta) {
        (0, _classCallCheck3.default)(this, BinaryStream);

        var _this = (0, _possibleConstructorReturn3.default)(this, (BinaryStream.__proto__ || (0, _getPrototypeOf2.default)(BinaryStream)).call(this));

        _this.id = id;
        _this._socket = socket;

        _this.writable = true;
        _this.readable = true;
        _this.paused = false;

        _this._closed = false;
        _this._ended = false;

        if (create) {
            // creating new one
            _this._write('n', meta, _this.id);
        }
        return _this;
    }

    (0, _createClass3.default)(BinaryStream, [{
        key: '_onDrain',
        value: function _onDrain() {
            if (!this.paused) {
                this.emit('drain');
            }
        }
    }, {
        key: '_onClose',
        value: function _onClose() {
            // Emit close event
            if (this._closed) {
                return;
            }
            this.readable = false;
            this.writable = false;
            this._closed = true;
            this.emit('close');
        }
    }, {
        key: '_onError',
        value: function _onError(error) {
            this.readable = false;
            this.writable = false;
            this.emit('error', error);
        }
    }, {
        key: '_onPause',
        value: function _onPause() {
            // Emit pause event
            this.paused = true;
            this.emit('pause');
        }
    }, {
        key: '_onResume',
        value: function _onResume() {
            // Emit resume event
            this.paused = false;
            this.emit('resume');
            this.emit('drain');
        }
    }, {
        key: '_write',
        value: function _write(cmd, data, _id) {
            if (this._socket.readyState !== this._socket.constructor.OPEN) {
                return false;
            }
            var message = msgpack.encode([cmd, data, _id]).slice();
            return this._socket.send(message) !== false;
        }
    }, {
        key: 'write',
        value: function write(data) {
            if (this.writable) {
                if (data && data instanceof ArrayBufferClass) {
                    data = Buffer.from(data);
                }
                var out = this._write('d', data, this.id);
                return !this.paused && out;
            }
            this.emit('error', new Error('Stream is not writable'));
            return false;
        }
    }, {
        key: 'end',
        value: function end() {
            this._ended = true;
            this.readable = false;
            this._write('e', null, this.id);
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            this._onClose();
            this._write('c', null, this.id);
        }
    }, {
        key: '_onEnd',
        value: function _onEnd() {
            if (this._ended) {
                return;
            }
            this._ended = true;
            this.readable = false;
            this.emit('end');
        }
    }, {
        key: '_onData',
        value: function _onData(data) {
            // Dispatch
            this.emit('data', data);
        }
    }, {
        key: 'pause',
        value: function pause() {
            this._onPause();
            this._write('p', null, this.id);
        }
    }, {
        key: 'resume',
        value: function resume() {
            this._onResume();
            this._write('r', null, this.id);
        }
    }]);
    return BinaryStream;
}(_stream.Stream);

exports.default = BinaryStream;