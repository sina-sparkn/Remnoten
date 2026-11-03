import { getUserId } from '../lib/app_helpers.js';
import { setUserLanguage } from '../lib/settings.js';
import { normalizeLang } from '../lib/i18n.js';

export default async function (input, ctx) {
  const chatId = getUserId(ctx);
  const lang = normalizeLang(input?.lang);
  await setUserLanguage(chatId, lang);
  return { ok: true, lang };
}
