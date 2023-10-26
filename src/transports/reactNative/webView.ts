import EventEmitter from "events";
import { Transport } from "../../types";

export interface ReactNativeWebViewTransportOptions {
  webViewRef: {
    current?: {
      postMessage: (message: string) => void;
      injectJavaScript: (script: string) => void;
    } | null;
  };
  useJavaScriptInjection?: boolean;
}

export class ReactNativeWebViewTransport extends EventEmitter implements Transport {
  constructor(private options: ReactNativeWebViewTransportOptions) {
    super();
    this.handleMessage = this.handleMessage.bind(this);
  }
  send(message: any): void {
    const target = this.options.webViewRef.current;
    if (!target) throw new Error('WebView is not ready');

    const messageString = JSON.stringify(message);

    if (this.options.useJavaScriptInjection) {
      target.injectJavaScript(`window.postMessage(${messageString}, '*');`);
    } else {
      target.postMessage(messageString);
    }
  }
  handleMessage(event: { nativeEvent: { data: string } }): void {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      this.emit('message', message);
    } catch (error) {
      this.emit('message-error', error, event);
    }
  }
  close(): void {
    this.emit('close');
  }
}
