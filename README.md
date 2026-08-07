# NotifyKit

Deliver notifications to a Telegram chat from an agent. One operation (send a message) through a shared core, exposed as a CLI, a local (stdio) MCP server, and a remote Cloudflare Workers MCP server.

## Packages

| Package | npm | Purpose |
|---|---|---|
| `@signal_stack/notifykit-core` | [npm](https://www.npmjs.com/package/@signal_stack/notifykit-core) | Shared schema + `sendTelegramMessage` logic |
| `@signal_stack/notifykit` | [npm](https://www.npmjs.com/package/@signal_stack/notifykit) | CLI (`notifykit telegram <chatId> <message>`) |
| `@signal_stack/notifykit-mcp` | [npm](https://www.npmjs.com/package/@signal_stack/notifykit-mcp) | Local stdio MCP server (`telegram` tool) |

## Requirements

- [Bun](https://bun.sh) for development
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- The numeric chat id of the chat that should receive messages

## CLI quickstart

Install globally:

```sh
npm i -g @signal_stack/notifykit
```

Configure the bot token once per machine:

```sh
notifykit init --telegram-bot-token <BOT_TOKEN>
```

Send a message:

```sh
notifykit telegram <chatId> <message>
# {"ok":true,"chatId":"123456789","messageId":21}
```

## Local MCP server

The `@signal_stack/notifykit-mcp` package is a stdio MCP server exposing one tool, `telegram`, with `chatId` and `message` arguments. Configure it in your MCP client with the bot token available to the server process:

```jsonc
{
  "mcpServers": {
    "notifykit": {
      "command": "npx",
      "args": ["-y", "@signal_stack/notifykit-mcp"],
      "env": { "TELEGRAM_BOT_TOKEN": "<BOT_TOKEN>" }
    }
  }
}
```

## Remote MCP server (Cloudflare Workers)

Source lives in `apps/remote-mcp`. It is a Hono-based MCP server that reads the bot token from the URL path and authenticates with Clerk OAuth (unless the token is listed in `NO_AUTH_BOT_TOKENS`).

Deploy:

```sh
bun run deploy:remote-mcp:cf   # wrangler deploy
```

Required Workers secrets / env:

- `CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `CLERK_SECRET_KEY` — Clerk secret key
- `NO_AUTH_BOT_TOKENS` — comma-separated bot tokens that bypass OAuth (optional)

## Development

```sh
bun install
bun run dev:cli            # run the CLI from source
bun run dev:local-mcp      # run the local MCP server from source
```

Quality gates:

```sh
bun run typecheck   # tsc --noEmit
bun run lint        # oxlint --deny-warnings
bun test            # unit tests (mocked fetch) + gated live smoke test
bun run build:core && bun run build:cli && bun run build:local-mcp
```

The live smoke test in `packages/core/test/integration.test.ts` is skipped unless `TELEGRAM_BOT_TOKEN` and `NOTIFYKIT_CHAT_ID` are set. Run it explicitly:

```sh
TELEGRAM_BOT_TOKEN=<BOT_TOKEN> NOTIFYKIT_CHAT_ID=<chatId> bun test
```

## Notes

- Bot tokens are secrets: never commit them. The CLI stores its token in `~/.config/notifykit/config.json` with mode `0o600`.
- The Node entrypoints force IPv4-first DNS resolution and disable happy-eyeballs (`setDefaultResultOrder("ipv4first")` + `setDefaultAutoSelectFamily(false)`) so `fetch` reliably falls back to IPv4 when the IPv6 route to `api.telegram.org` is unreachable or flaky.

## Skill

Agent-facing instructions live in `skills/notifykit/SKILL.md` — it is the reference for sending notifications via the MCP tool or CLI fallback.