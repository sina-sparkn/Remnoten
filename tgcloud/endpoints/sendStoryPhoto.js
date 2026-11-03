import { api, InputFile, EndpointError } from 'sdk';
import { getUserId } from '../lib/app_helpers.js';

function base64ToUint8Array(base64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const byteLength = (len * 3) >> 2;
  const bytes = new Uint8Array(byteLength);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const b1 = chars.indexOf(clean[i]);
    const b2 = chars.indexOf(clean[i + 1]);
    const b3 = chars.indexOf(clean[i + 2]);
    const b4 = chars.indexOf(clean[i + 3]);

    bytes[p++] = (b1 << 2) | (b2 >> 4);
    if (b3 !== -1 && clean[i + 2] !== '=') {
      bytes[p++] = ((b2 & 15) << 4) | (b3 >> 2);
    }
    if (b4 !== -1 && clean[i + 3] !== '=') {
      bytes[p++] = ((b3 & 3) << 6) | b4;
    }
  }
  return bytes.subarray(0, p);
}

export default async function (input, ctx) {
  const chatId = getUserId(ctx);
  const rawData = input?.imageData;
  if (!rawData || typeof rawData !== 'string') {
    throw new EndpointError('Image data required', { code: 'INVALID_DATA' });
  }

  // Extract base64 payload
  const base64 = rawData.replace(/^data:image\/\w+;base64,/, '');
  const bytes = base64ToUint8Array(base64);

  const streak = Number(input?.streak) || 0;
  const caption = streak > 0
    ? `🔥 *Remnoten Habit Streak: ${streak} days!*\n\n💡 Tap this photo, open the menu (•••), and choose *Save to Gallery*.`
    : `🎯 *Remnoten Progress Card*\n\n💡 Tap this photo, open the menu (•••), and choose *Save to Gallery*.`;

  await api.sendPhoto({
    chat_id: chatId,
    photo: new InputFile(bytes, 'remnoten-story.png', { type: 'image/png' }),
    caption,
    parse_mode: 'Markdown',
  });

  return { ok: true };
}
