import {randomBytes} from 'crypto';

export function randomId (len = 32) {
    return randomBytes(len).toString('hex');
}
