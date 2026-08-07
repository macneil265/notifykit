---
name: notifykit
description: Use notifykit to send Telegram messages from agents through the NotifyKit MCP tool or CLI fallback. Use when a user asks to send a Telegram message, use NotifyKit, interact with the NotifyKit toolset, verify NotifyKit manually, or choose between NotifyKit MCP and CLI workflows.
---

# NotifyKit

NotifyKit lets an agent deliver a message to a user's Telegram chat. It exposes one operation — send a message to a Telegram chat — through two public interfaces:

1. **MCP server** (`@signal_stack/notifykit-mcp`) — the preferred path when the agent runs inside an MCP-configured client (ChatGPT, Claude.ai, Claude Code, opencode, and similar).
2. **CLI** (`@signal_stack/notifykit`) — fallback when no MCP server is configured, or when verifying NotifyKit manually.

## Setup

Both interfaces need a Telegram bot token and a target chat id.

**Bot token**: created in Telegram's @BotFather. Treat it as a secret — read it from MCP client configuration, environment variables, or secrets storage. Never hardcode it in skill files, documentation, or code.

**Chat id**: the numeric id of the Telegram chat that should receive messages. Obtain it from the user or from configuration the session already has. Never guess or invent one; sending to a wrong chat is the same as sending to nobody.

## MCP server

The `@signal_stack/notifykit-mcp` package provides a stdio MCP server exposing one tool:

**Tool:** `telegram` with two required arguments:
- `chatId` (string) — the recipient chat's numeric Telegram id
- `message` (string) — the text to send (max 4096 chars)

Configure it in the MCP client with the bot token available to the server process, for example with `TELEGRAM_BOT_TOKEN` as the environment variable. After configuration, call the `telegram` tool directly instead of falling back to a shell command.

## CLI

The `@signal_stack/notifykit` package provides the `notifykit` command. Prefer a globally installed `notifykit` binary — it needs no download and runs fast. To install it permanently:

```
npm i -g @signal_stack/notifykit
```

Configure the bot token once per machine:

```
notifykit init --telegram-bot-token <BOT_TOKEN>
```

Then send a message:

```
notifykit telegram <chatId> <message>
```

If `notifykit` is not installed globally, run it on the fly via `bunx @signal_stack/notifykit telegram <chatId> <message>` (or the `npx` equivalent). The first on-the-fly run downloads the package and can be slow — prefer the global install for repeated commands.

If the CLI returns `401 Unauthorized`, the stored token is invalid or revoked; re-run the `init` command with a valid token from @BotFather.

**Example 1:**
Input: `notifykit telegram 123456789 "Deploy finished"`
Output: `{"ok":true,"chatId":"123456789","messageId":21}`

**Example 2:**
Input: `notifykit telegram 999 "hello"` (invalid chat)
Output: non-zero exit code with an error message describing what failed.

## Choosing MCP vs CLI

| Situation | Use |
|---|---|
| Agent runs inside an MCP-configured client | MCP server (`telegram` tool) |
| MCP not configured or unavailable | CLI |
| Manually verifying that NotifyKit works | CLI |

## Verifying a send

A send succeeded when the result reports `ok: true` and includes a `messageId`, and the user confirms the message appears in Telegram. On failure, surface the error to the user so they can fix the inputs rather than retrying blindly.

## Interaction pattern

When the user asks to send a notification, follow this order:

1. Resolve the target: use the chat id already known in the session, or ask the user for theirs.
2. Choose the interface: MCP server first, CLI as fallback.
3. Send the message and report the `messageId` as confirmation.
4. Ask the user to confirm receipt in Telegram if the message did not visibly arrive.