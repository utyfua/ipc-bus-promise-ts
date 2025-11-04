import { handlePromiseWithResultOrError, ResultOrError, unwrapResultOrError } from "./handlePromiseWithResultOrError";
import { IpcBusOptions, Message, TimeoutType, Transport } from "./types";

export class IpcBus<GlobalRequest = any, GlobalResponse = any> {
  private lastId = 0;
  private responseCallbacks: Record<string, (payload: ResultOrError) => void> = {};

  constructor(public options: IpcBusOptions) {
    this.options.namespace ??= 'ipc-bus';
    this.bindMethods();
    this.attachTransport(options.transport);
  }

  private bindMethods(): void {
    this.messageHandler = this.messageHandler.bind(this);
    this.close = this.close.bind(this);
  }

  private getNewId(): string {
    this.lastId = this.lastId > 1000 ? 0 : this.lastId + 1;
    return `${this.lastId}-${Date.now()}`;
  }

  private attachTransport(transport: Transport): void {
    transport.on('message', this.messageHandler);
    transport.on('close', this.close);
    transport.on('error', this.close);
  }

  private detachTransport(transport: Transport): void {
    transport.off('message', this.messageHandler);
    transport.off('close', this.close);
    transport.off('error', this.close);
  }

  private transportSend(message: Message): void {
    const cb = (error: Error | null | unknown) => {
      if (error !== null)
        this.options.onUnhandledError?.(error);
    }
    try {
      const result = this.options.transport.send(message, cb);
      if (result instanceof Promise) {
        result.catch(cb);
      }
    } catch (error) {
      cb(error);
    }
  }

  private async handleRequest(message: Message): Promise<void> {
    const responseMessage: Message = {
      namespace: this.options.namespace!,
      rpcMessageId: message.rpcMessageId,
      action: 'response',
      payload: await handlePromiseWithResultOrError(() => this.options.handler(message.payload))
    };

    this.transportSend(responseMessage);
  }

  private handleResponse(message: Message): void {
    const callback = this.responseCallbacks[message.rpcMessageId];
    callback?.(message.payload);
  }

  private async messageHandler(message: Message): Promise<void> {
    if (typeof message !== 'object' || message.namespace !== this.options.namespace) return;

    if (message.action === 'request') {
      await this.handleRequest(message);
    } else if (message.action === 'response') {
      this.handleResponse(message);
    }
  }

  private waitForResponse(rpcMessageId: string, timeout?: TimeoutType) {
    return new Promise<ResultOrError>((resolve, reject) => {
      this.responseCallbacks[rpcMessageId] = resolve;

      if (timeout) {
        setTimeout(() => {
          delete this.responseCallbacks[rpcMessageId];
          reject(new Error(`Timeout of ${timeout}ms exceeded for rpcMessageId ${rpcMessageId}`));
        }, timeout);
      }
    }) as Promise<ResultOrError>;
  }

  async request<Response = GlobalResponse>(
    payload: GlobalRequest,
    { timeout = this.options.requestTimeout }: { timeout?: TimeoutType } = {}
  ): Promise<Response> {
    const rpcMessageId = this.getNewId();
    const requestMessage: Message = {
      namespace: this.options.namespace!,
      rpcMessageId,
      action: 'request',
      payload
    };

    this.transportSend(requestMessage);

    const response = await this.waitForResponse(rpcMessageId, timeout);
    delete this.responseCallbacks[rpcMessageId];

    return unwrapResultOrError(response);
  }

  close(): void {
    this.detachTransport(this.options.transport);

    const responseCallbacks = this.responseCallbacks;
    this.responseCallbacks = {};
    Object.values(responseCallbacks)
      .forEach((callback) => callback({
        type: 'error',
        error: new Error('Destination was closed'),
      }))
  }
}
