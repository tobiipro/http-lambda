/// <reference types="node" />
import http from 'http';
import { Context, Event } from './types';
declare module 'http' {
    interface IncomingMessage {
        chunkedEncoding: boolean;
        _removedHeader: {
            [key: string]: boolean;
        };
    }
}
export declare class IncomingMessage extends http.IncomingMessage {
    body: string | Buffer;
    ctx: Context;
    constructor(socket: {
        destroy: (err?: Error) => void;
    }, e: Event, ctx: Context);
}
export default IncomingMessage;
