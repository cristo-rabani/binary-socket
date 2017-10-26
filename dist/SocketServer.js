'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SocketServer = undefined;

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

var _SocketClient = require('./SocketClient');

var _SocketClient2 = _interopRequireDefault(_SocketClient);

var _helpers = require('./helpers');

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Binary Socket
 */
var SocketServer = exports.SocketServer = function (_EventEmitter) {
    (0, _inherits3.default)(SocketServer, _EventEmitter);

    function SocketServer() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        (0, _classCallCheck3.default)(this, SocketServer);

        /*global Meteor*/
        var _this = (0, _possibleConstructorReturn3.default)(this, (SocketServer.__proto__ || (0, _getPrototypeOf2.default)(SocketServer)).call(this));

        _this.clients = {};
        options = (0, _assign2.default)({
            host: '0.0.0.0',
            chunkSize: 40960,
            bindEnvironment: (typeof Meteor === 'undefined' ? 'undefined' : (0, _typeof3.default)(Meteor)) === 'object' && Meteor.bindEnvironment
        }, options);

        _this._bindEnvironment = options.bindEnvironment || _helpers.noBindEnv;
        var Server = require('ws').Server;
        if (options.server && options.server instanceof Server) {
            _this._server = options.server;
        } else {
            _this._server = new Server(options);
        }
        _this._options = options;

        _this._handleServerConnection = _this._bindEnvironment(function (socket) {
            var client = new _SocketClient2.default(socket, _this._options);
            client.id = (0, _helpers.randomId)();
            _this.clients[client.id] = client;
            client.on('close', function () {
                delete _this.clients[client.id];
            });
            _this.emit('connection', client);
        });

        _this._server.on('connection', _this._handleServerConnection);
        _this._server.on('error', function (error) {
            return _this.emit('error', error);
        });
        return _this;
    }

    (0, _createClass3.default)(SocketServer, [{
        key: 'close',
        value: function close(code, message) {
            this._server.close(code, message);
        }
    }]);
    return SocketServer;
}(_events2.default);

exports.default = SocketServer;