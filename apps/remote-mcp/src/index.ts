import { Context, Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createClerkClient } from "@clerk/backend";
import { generateClerkProtectedResourceMetadata } from "@clerk/mcp-tools/server";
import { sendTelegramMessage, telegramMessageInputSchema } from "@signal_stack/notifykit-core";

export interface Env {
  CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  NO_AUTH_BOT_TOKENS?: string;
}

interface ClerkState {
  publishableKey: string;
  client: ReturnType<typeof createClerkClient>;
}

let clerkState: ClerkState | undefined;

function getClerkState(env: Env): ClerkState {
  if (!clerkState) {
    const publishableKey = env.CLERK_PUBLISHABLE_KEY;
    const secretKey = env.CLERK_SECRET_KEY;
    if (!publishableKey || !secretKey) {
      throw new Error("CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY must be set");
    }
    clerkState = {
      publishableKey,
      client: createClerkClient({ publishableKey, secretKey }),
    };
  }
  return clerkState;
}

function createServer(botToken: string): McpServer {
  const server = new McpServer({
    name: "notifykit-mcp",
    version: "0.0.1",
  });

  server.registerTool(
    "telegram",
    {
      title: "Telegram",
      description: "Send a Telegram message to a chat",
      inputSchema: telegramMessageInputSchema.shape,
    },
    async (input) => {
      const result = await sendTelegramMessage({
        ...input,
        botToken,
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

  return server;
}

const app = new Hono<{ Bindings: Env }>();

function protectedResourceMetadataUrl(c: Context, botToken: string) {
  return new URL(`/.well-known/oauth-protected-resource/${botToken}/mcp`, c.req.url).toString();
}

function unauthorizedMcpResponse(c: Context, botToken: string) {
  c.header(
    "WWW-Authenticate",
    `Bearer resource_metadata="${protectedResourceMetadataUrl(c, botToken)}"`,
  );
  return c.json({ error: "Unauthorized" }, 401);
}

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

app.get("/.well-known/oauth-protected-resource/:botToken/mcp", (c) => {
  const { publishableKey } = getClerkState(c.env);
  return c.json(
    generateClerkProtectedResourceMetadata({
      publishableKey,
      resourceUrl: new URL(`/${c.req.param("botToken")}/mcp`, c.req.url).toString(),
    }),
  );
});

app.post("/:botToken/mcp", async (c) => {
  const botToken = c.req.param("botToken");
  const noAuthTokens = (c.env.NO_AUTH_BOT_TOKENS ?? "")
    .split(",")
    .map((t) => t.trim());

  if (!noAuthTokens.includes(botToken)) {
    const { client } = getClerkState(c.env);

    try {
      const requestState = await client.authenticateRequest(c.req.raw, {
        acceptsToken: "oauth_token",
      });

      if (!requestState.isAuthenticated) {
        return unauthorizedMcpResponse(c, botToken);
      }
    } catch {
      return unauthorizedMcpResponse(c, botToken);
    }
  }

  const server = createServer(botToken);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    return await transport.handleRequest(c.req.raw);
  } finally {
    await server.close();
  }
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

export default {
  fetch(request: Request, env: Env) {
    return app.fetch(request, env);
  },
};