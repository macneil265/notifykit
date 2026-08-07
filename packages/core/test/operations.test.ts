import { describe, expect, test, mock } from "bun:test";
import { sendTelegramMessage } from "../src/operations";

function mockFetchResponse(body: unknown, ok = true) {
  return mock(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(body),
    }),
  );
}

describe("sendTelegramMessage", () => {
  test("sends a message and returns the message id", async () => {
    globalThis.fetch = mockFetchResponse({
      ok: true,
      result: { message_id: 42 },
    }) as unknown as typeof fetch;

    const result = await sendTelegramMessage({
      botToken: "123:secret",
      chatId: "5823551811",
      message: "Hello",
    });

    expect(result).toEqual({ ok: true, chatId: "5823551811", messageId: 42 });
  });

  test("throws the telegram description when telegram reports failure", async () => {
    globalThis.fetch = mockFetchResponse(
      { ok: false, description: "chat not found" },
      true,
    ) as unknown as typeof fetch;

    await expect(
      sendTelegramMessage({ botToken: "123:secret", chatId: "999", message: "Hello" }),
    ).rejects.toThrow("chat not found");
  });

  test("throws when the http response is not ok", async () => {
    globalThis.fetch = mockFetchResponse(
      { ok: false, description: "Unauthorized" },
      false,
    ) as unknown as typeof fetch;

    await expect(
      sendTelegramMessage({ botToken: "123:secret", chatId: "5823551811", message: "Hello" }),
    ).rejects.toThrow("Unauthorized");
  });

  test("throws a generic error when no description is present", async () => {
    globalThis.fetch = mockFetchResponse({ ok: false }, true) as unknown as typeof fetch;

    await expect(
      sendTelegramMessage({ botToken: "123:secret", chatId: "5823551811", message: "Hello" }),
    ).rejects.toThrow("Telegram message failed to send");
  });

  test("rejects invalid input", async () => {
    await expect(
      sendTelegramMessage({ botToken: "", chatId: "5823551811", message: "Hello" }),
    ).rejects.toThrow();
    await expect(
      sendTelegramMessage({ botToken: "123:secret", chatId: "", message: "Hello" }),
    ).rejects.toThrow();
    await expect(
      sendTelegramMessage({ botToken: "123:secret", chatId: "5823551811", message: "" }),
    ).rejects.toThrow();
  });
});
