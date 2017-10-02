'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});
exports.randomId = randomId;
exports.noBindEnv = noBindEnv;

var _crypto = require('crypto');

function randomId() {
   var len = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 17;

   return (0, _crypto.randomBytes)(len).toString('hex');
}

function noBindEnv(fn) {
   return fn;
}