// Draws a quote card: a passage from a post as an image to share, 1200 by 675
// (16:9, as Bluesky shows images), always in the light theme. The post's own
// dither field runs across the top, the quote is set large in the display
// face, and the post's title and the site sit underneath. Loaded only when
// someone first selects text in a post (see QuoteShare.astro).

const WIDTH = 1200;
const HEIGHT = 675;
const MARGIN = 80;
const INK = '#111111';
const MUTED = '#6b6b6b';
const GROUND = '#f9f9f9';
const FIELD = '#d4d4d4';
const DISPLAY = '"Bricolage Grotesque Variable", "Public Sans Variable", sans-serif';
const SANS = '"Public Sans Variable", sans-serif';

function image(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// The lines a text breaks into at a width, in the context's current font.
function lines(context: CanvasRenderingContext2D, text: string, width: number) {
  const result: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > width) {
      result.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) result.push(line);
  return result;
}

export async function quoteCard({ quote, title, slug }: { quote: string; title: string; slug: string }) {
  const canvas = Object.assign(document.createElement('canvas'), { width: WIDTH, height: HEIGHT });
  const context = canvas.getContext('2d')!;
  await Promise.all([
    document.fonts.load(`600 64px ${DISPLAY}`),
    document.fonts.load(`500 26px ${SANS}`),
    document.fonts.load(`400 22px ${SANS}`),
  ]);

  context.fillStyle = GROUND;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  // The post's field, tinted on a canvas of its own and laid across the top,
  // its dots kept square.
  try {
    const field = await image(`/field/${slug}.svg`);
    const tint = Object.assign(document.createElement('canvas'), { width: field.width, height: field.height });
    const tintContext = tint.getContext('2d')!;
    tintContext.drawImage(field, 0, 0);
    tintContext.globalCompositeOperation = 'source-in';
    tintContext.fillStyle = FIELD;
    tintContext.fillRect(0, 0, tint.width, tint.height);
    context.imageSmoothingEnabled = false;
    context.save();
    // The field closes posts upside down; on the card it hangs from the top.
    context.translate((WIDTH - field.width) / 2, field.height - 120);
    context.scale(1, -1);
    context.drawImage(tint, 0, 0);
    context.restore();
  } catch {
    // Without its field the card still reads.
  }

  // The quote, as large as fits between the field and the footer.
  const quoteTop = 150;
  const quoteBottom = HEIGHT - 170;
  const text = `“${quote}”`;
  let size = 64;
  let wrapped: string[] = [];
  for (; size >= 28; size -= 2) {
    context.font = `600 ${size}px ${DISPLAY}`;
    wrapped = lines(context, text, WIDTH - MARGIN * 2);
    if (wrapped.length * size * 1.2 <= quoteBottom - quoteTop) break;
  }
  context.fillStyle = INK;
  context.textBaseline = 'top';
  wrapped.forEach((line, index) => context.fillText(line, MARGIN, quoteTop + index * size * 1.2));

  // The post and the site, under a hairline.
  context.fillStyle = 'rgb(0 0 0 / 0.08)';
  context.fillRect(MARGIN, HEIGHT - 130, WIDTH - MARGIN * 2, 1);
  context.fillStyle = INK;
  context.font = `500 26px ${SANS}`;
  const [titleLine] = lines(context, title, WIDTH - MARGIN * 2 - 260);
  context.fillText(titleLine === title ? title : `${titleLine}…`, MARGIN, HEIGHT - 100);
  context.fillStyle = MUTED;
  context.font = `400 22px ${SANS}`;
  context.fillText('alilleybrinker.com', MARGIN, HEIGHT - 62);
  try {
    const face = await image('/image/andrew_lineart-transparent.png');
    context.drawImage(face, WIDTH - MARGIN - 84, HEIGHT - 110, 84, 84);
  } catch {
    // The face is a flourish.
  }

  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The card could not be drawn.'))), 'image/png'));
}
