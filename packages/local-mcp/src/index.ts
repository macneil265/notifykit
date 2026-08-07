#!/usr/bin/env node

import { setDefaultResultOrder } from "node:dns";
import { setDefaultAutoSelectFamily } from "node:net";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { telegramMessageInputSchema, sendTelegramMessage } from "@signal_stack/notifykit-core";

setDefaultResultOrder("ipv4first");
setDefaultAutoSelectFamily(false);

const server = new McpServer({
  name: "notifykit-mcp",
  version: "0.0.3",
});

function getTelegramBotToken() {
  const Token = process.env.TELEGRAM_BOT_TOKEN;
  if (!Token) {
    throw new Error("TELEGRAM_BOT_TOKEN is required. Configure in your MCP client environment.");
  }
  return Token;
}

server.registerTool(
  "telegram",
  {
    title: "Telegram",
    description: "Send a Telegram message",
    inputSchema: telegramMessageInputSchema.shape,
  },
  async (input) => {
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
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
