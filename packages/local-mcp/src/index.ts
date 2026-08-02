import { createNotifykitServer } from "./server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = createNotifykitServer();
const transport = new StdioServerTransport();
await server.connect(transport);