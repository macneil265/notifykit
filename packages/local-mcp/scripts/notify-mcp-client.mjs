import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "bun",
  args: ["run", "dev:local-mcp"],
  cwd: "/home/mackiee/Documents/applications/notifykit",
  env: { TELEGRAM_BOT_TOKEN: "TELEGRAM_BOT_TOKEN_ROTATED" },
});

const client = new Client({ name: "opencode-test", version: "1.0.0" });
await client.connect(transport);
const tools = await client.listTools();
console.log(
  "Available MCP tools:",
  tools.tools.map((t) => t.name),
);
const result = await client.callTool({
  name: "telegram",
  arguments: { chatId: "5823551811", message: "Hello from opencode local-mcp" },
});
console.log("RESULT:", JSON.stringify(result));
await client.close();
