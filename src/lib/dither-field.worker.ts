// Draws the dithered field off the main thread, on each canvas the page hands
// over (DitherField.astro).
import { createField, type Message } from './dither-field';

let field: ReturnType<typeof createField> | undefined;

self.onmessage = (event: MessageEvent) => {
  const data = event.data;
  if (data.type === 'start') field = createField(data.path, data.scattered, data.reduce, () => self.postMessage({ type: 'drawn' }));
  else if (data.type === 'attach') {
    if (!field?.attach(data.canvas as OffscreenCanvas)) self.postMessage({ type: 'unavailable' });
  } else field?.send(data as Message);
};
