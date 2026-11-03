import { api } from 'sdk';
import { ensureBotConfigured } from '../lib/setup.js';

export default async function (myChatMember) {
  // Ensure bot description and commands are registered when the bot is added/started
  await ensureBotConfigured();

  if (myChatMember?.chat?.id) {
    try {
      await api.setChatMenuButton({
        chat_id: myChatMember.chat.id,
        menu_button: {
          type: 'web_app',
          text: 'Open',
          web_app: { url: 'https://app8837501303.tgcloud.ai' },
        },
      });
    } catch {}
  }
}
