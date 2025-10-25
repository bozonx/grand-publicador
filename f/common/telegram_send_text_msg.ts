import * as wmill from "windmill-client"
import { Bot } from "grammy";

// fill the type, or use the +Resource type to get a type-safe reference to a resource
// type Postgresql = object

type Telegram = {
  token: string
}

interface InlineKeyboard {
  text: string,
  url?: string,
  callback_data?: string,
}

export async function main(
  auth: Telegram,
  chat_id: string,
  text: string,
  inlineKbd: InlineKeyboard[][],
) {
  const bot = new Bot(auth.token);

  const res = await bot.api.sendMessage(chat_id, text, {
    reply_markup: {
      inline_keyboard: inlineKbd as any
    }
  })

  // let x = await wmill.getVariable('u/user/foo')
  return res;
}
