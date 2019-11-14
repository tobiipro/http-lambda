/// <reference types="node" />
import http from 'http';
import { Context, Event } from './types';
export declare class IncomingMessage extends http.IncomingMessage {
    body: string | Buffer;
    ctx: Context;
    constructor(socket: any, e: Event, ctx: Context);
}
export default IncomingMessage;
