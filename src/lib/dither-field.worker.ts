// Draws the dithered field off the main thread, on the canvas the page hands
// over (DitherField.astro).
import { startField, type Message } from './dither-field';

let send: ((message: Message) => void) | undefined;

self.onmessage = (event: MessageEvent) => {
  const data = event.data;
  if (data.type === 'start') {
    send = startField(data.canvas as OffscreenCanvas, data.path, data.reduce);
    if (!send) self.postMessage({ type: 'unavailable' });
    return;
  }
  send?.(data as Message);
};
