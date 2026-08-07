import { describe, expect, test } from "bun:test";
import { sendTelegramMessage } from "../src/operations";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.NOTIFYKIT_CHAT_ID;

const enabled = Boolean(botToken && chatId);

describe("sendTelegramMessage (live)", () => {
  test.skipIf(!enabled)(
    "sends a real message and gets a message id",
    async () => {
      const token = botToken as string;
      const id = chatId as string;

      const result = await sendTelegramMessage({
        botToken: token,
        chatId: id,
        message: "notifykit live smoke test",
      });

      expect(result.ok).toBe(true);
      expect(result.chatId).toBe(id);
      expect(typeof result.messageId).toBe("number");
    },
  );
});