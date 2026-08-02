import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  telegramMessageInputSchema,
  sendTelegramMessage,
} from "notifykit-core";

export function getTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is required. Configure it in the server environment.",
    );
  }
  return token;
}

export function createNotifykitServer(): McpServer {
  const server = new McpServer({
    name: "notifykit-mcp",
    version: "0.0.0",
  });

  server.registerTool(
    "telegram",
    {
      title: "Telegram",
      description: "Send a Telegram message to a chat",
      inputSchema: telegramMessageInputSchema,
    },
    async (input) => {
      try {
        const result = await sendTelegramMessage({
          ...input,
          botToken: getTelegramBotToken(),
        });

        return {
          content: [
            {
              type: "text",
              text: `Sent Telegram message ${result.messageId} to chat ${result.chatId}`,
            },
          ],
          structuredContent: result,
        };
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to send Telegram message: ${detail}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  return server;
}