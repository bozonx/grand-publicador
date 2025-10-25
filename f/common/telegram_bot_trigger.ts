import * as wmill from "windmill-client"
import { Bot } from "grammy";

type Telegram = {
  token: string;
};

export async function main(auth: Telegram, webHookUrl: string) {
  const bot = new Bot(auth.token);
  const res = await bot.api.setWebhook(webHookUrl);

  // A common trigger script would follow this pattern:
  // 1. Get the last saved state
  const state = await wmill.getState()
  // 2. Get the actual state from the external service
  const newState = res
  // 3. Compare the two states and update the internal state
  await wmill.setState(newState)
  // 4. Return the new rows
  // return range from (state to newState)

  return [res]

  // In subsequent scripts, you may refer to each row/value returned by the trigger script using
  // 'flow_input.iter.value'
}
