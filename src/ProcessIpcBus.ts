import { IpcBus } from "./IpcBus";
import { ProcessIpcBusOptions } from "./types";

export class ProcessIpcBus extends IpcBus {
  constructor(options: ProcessIpcBusOptions) {
    const process = options.process ?? global.process;
    if (!process.send)
      throw new Error('Unable to find process.send method. Please provide a valid process object.');

    super({
      ...options,
      // @ts-ignore we did check above that process has a send method
      transport: process,
    })
  }

  waitSpawn(): Promise<void> {
    return this.waitForEvent('spawn');
  }

  waitForEvent(eventName: 'close' | 'spawn'): Promise<void> {
    return new Promise((resolve, reject) => {
      const transport = this.options.transport
      function clean(next: (arg?: any) => void, arg?: any) {
        transport.off(eventName, onEvent)
        transport.off('error', onError)
        next(arg);
      }
      const onEvent = () => clean(resolve);
      const onError = (error: Error) => clean(reject, error);
      transport.on(eventName, onEvent)
      transport.on('error', onError)
    })
  }
}
