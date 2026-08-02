import { Hono } from "hono";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createNotifykitServer } from "notifykit-mcp/server";

const app = new Hono();

function isAuthorized(request: Request): boolean {
  const expected = process.env.NOTIFY_MCP_TOKEN;
  if (!expected) {
    return true;
  }
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

app.all("/mcp", async (c) => {
  if (!isAuthorized(c.req.raw)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const server = createNotifykitServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    const raw = await transport.handleRequest(c.req.raw);
    const body = await raw.arrayBuffer();
    await server.close();
    await transport.close();
    return new Response(body, {
      status: raw.status,
      headers: raw.headers,
    });
  } catch (error) {
    await server.close();
    await transport.close();
    console.error("MCP request failed:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.get("/health", (c) => c.json({ status: "ok" }));

app.notFound((c) => c.json({ error: "Not found" }, 404));

const hostname = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

console.error(`notifykit remote MCP listening on http://${hostname}:${port}/mcp`);

Bun.serve({
  hostname,
  port,
  fetch: app.fetch,
});