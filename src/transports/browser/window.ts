import EventEmitter from "events";
import { Transport } from "../../types";

export interface BrowserWindowTransportOptions {
  window: Window;
  isReactNativeParentFrame?: boolean;
}

export class BrowserWindowTransport extends EventEmitter implements Transport {
  constructor(private options: BrowserWindowTransportOptions) {
    super();
    this.handleMessage = this.handleMessage.bind(this);

    const target = this.options.window;
    target.addEventListener('message', this.handleMessage);
  }
  send(message: any): void {
    const target = this.options.window;
    const messageString = JSON.stringify(message);

    if (this.options.isReactNativeParentFrame) {
      // @ts-ignore
      target.ReactNativeWebView?.postMessage(messageString);
    } else {
      target.postMessage(messageString, '*');
    }
  }
  handleMessage(event: MessageEvent): void {
    try {
      const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      this.emit('message', message);
    } catch (error) {
      this.emit('message-error', error, event);
    }
  }
  close(): void {
    const target = this.options.window;
    target.removeEventListener('message', this.handleMessage);
    this.emit('close');
  }
}
