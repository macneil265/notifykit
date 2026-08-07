import { describe, expect, test } from "bun:test";
import {
  telegramMessageInputSchema,
  telegramMessageOptionsSchema,
  telegramSendMessageRequestSchema,
  telegramSendMessageResponseSchema,
  telegramMessageOutputSchema,
} from "../src/schemas";

describe("telegramMessageInputSchema", () => {
  test("accepts valid input", () => {
    expect(
      telegramMessageInputSchema.parse({ chatId: "5823551811", message: "Hello" }),
    ).toEqual({ chatId: "5823551811", message: "Hello" });
  });

  test("rejects empty chatId and message", () => {
    expect(() => telegramMessageInputSchema.parse({ chatId: "", message: "Hi" })).toThrow();
    expect(() => telegramMessageInputSchema.parse({ chatId: "1", message: "" })).toThrow();
  });
});

describe("telegramMessageOptionsSchema", () => {
  test("accepts bot token", () => {
    expect(
      telegramMessageOptionsSchema.parse({
        botToken: "123:secret",
        chatId: "1",
        message: "Hi",
      }),
    ).toMatchObject({ botToken: "123:secret" });
  });

  test("rejects missing bot token", () => {
    expect(() =>
      telegramMessageOptionsSchema.parse({ chatId: "1", message: "Hi" }),
    ).toThrow();
  });
});

describe("telegramSendMessageRequestSchema", () => {
  test("maps to telegram request fields", () => {
    expect(
      telegramSendMessageRequestSchema.parse({ chat_id: "1", text: "Hi" }),
    ).toEqual({ chat_id: "1", text: "Hi" });
  });
});

describe("telegramSendMessageResponseSchema", () => {
  test("accepts a success response", () => {
    expect(
      telegramSendMessageResponseSchema.parse({ ok: true, result: { message_id: 7 } }),
    ).toEqual({ ok: true, result: { message_id: 7 } });
  });

  test("accepts an error response without result", () => {
    expect(
      telegramSendMessageResponseSchema.parse({ ok: false, description: "nope" }),
    ).toEqual({ ok: false, description: "nope" });
  });
});

describe("telegramMessageOutputSchema", () => {
  test("accepts a success output", () => {
    expect(
      telegramMessageOutputSchema.parse({ ok: true, chatId: "1", messageId: 7 }),
    ).toEqual({ ok: true, chatId: "1", messageId: 7 });
  });
});
