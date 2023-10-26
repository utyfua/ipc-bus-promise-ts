import type { ChildProcess } from 'node:child_process'
import { ResultOrError } from "./handlePromiseWithResultOrError";

export type TimeoutType = number | null;

export interface MessageBase {
  namespace: string,
  rpcMessageId: string,
}

export interface MessageRequest<Payload = any> extends MessageBase {
  action: 'request';
  payload: Payload,
}

export interface MessageResponse extends MessageBase {
  action: 'response';
  payload: ResultOrError,
}

export type Message = MessageRequest | MessageResponse

export interface Transport<Message = any> {
  send(message: Message): void
  on(eventName: 'message', handler: (message: Message) => void): void
  on(eventName: 'close' | 'spawn', handler: () => void): void
  on(eventName: 'error', handler: (error: Error) => void): void
  off(eventName: 'message', handler: (message: Message) => void): void
  off(eventName: 'close' | 'spawn', handler: () => void): void
  off(eventName: 'error', handler: (error: Error) => void): void
}

export interface IpcBusOptions<Payload = any> {
  transport: Transport;
  namespace?: string;
  handler: (message: Payload) => Promise<any> | any;
  onUnhandledError?: (error: unknown) => void;
  requestTimeout?: TimeoutType;
}

export type ProcessIpcBusOptions<Payload = any> = Omit<IpcBusOptions<Payload>, 'transport'> & {
  process: NodeJS.Process | ChildProcess;
}
