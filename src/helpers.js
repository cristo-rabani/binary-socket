import {randomBytes} from 'crypto';

export function randomId (len = 17) {
    return randomBytes(len).toString('hex');
}

export function noBindEnv (fn) {
    return fn;
}
