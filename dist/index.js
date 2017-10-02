'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SocketClient = exports.SocketServer = undefined;

var _SocketServer = require('./SocketServer.js');

var _SocketServer2 = _interopRequireDefault(_SocketServer);

var _SocketClient = require('./SocketClient');

var _SocketClient2 = _interopRequireDefault(_SocketClient);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.SocketServer = _SocketServer2.default;
exports.SocketClient = _SocketClient2.default;