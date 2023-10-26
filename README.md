# ipc-bus-promise

IPC Bus Promise is a lightweight library for message-based inter-process communication with Promise support. 
It is designed to work across multiple environments, including React Native WebView and Node.js child processes.

## Installation
    
```bash
npm install ipc-bus-promise
```

or

```bash
yarn add ipc-bus-promise
```

## Usage

### React Native WebView

```typescript
import React, { useRef, useMemo } from 'react';
import { ReactNativeWebViewTransport, IpcBus } from 'ipc-bus-promise'
import { WebView } from 'react-native-webview';

export function MyWebView() {
  const webViewRef = useRef<WebView>(null);
  const transport = useMemo(() => new ReactNativeWebViewTransport({ webViewRef }), [webViewRef]);
  const bus = useMemo(() => new IpcBus({
    transport,
    handler(event) {
      console.log('handler', event);
      return { data: 'pong' }
    }
  }), [transport]);

  return <>
    <WebView
      // ...
      onMessage={transport.handleMessage}
      ref={webViewRef}
      // ...
    />
  </>
}
```


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
