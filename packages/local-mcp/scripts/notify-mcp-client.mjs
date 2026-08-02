import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.NOTIFYKIT_TEST_CHAT_ID;

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is required");
  process.exit(1);
}
if (!chatId) {
  console.error("NOTIFYKIT_TEST_CHAT_ID is required");
  process.exit(1);
}

const transport = new StdioClientTransport({
  command: "bun",
  args: ["run", "dev:local-mcp"],
  cwd: process.cwd(),
  env: { TELEGRAM_BOT_TOKEN: token },
});

const client = new Client({ name: "notifykit-test", version: "1.0.0" });
await client.connect(transport);
const tools = await client.listTools();
console.log("Available MCP tools:", tools.tools.map((t) => t.name));
const result = await client.callTool({
  name: "telegram",
  arguments: { chatId, message: "Hello from notifykit local-mcp" },
});
console.log("RESULT:", JSON.stringify(result));
await client.close();