import { describe, it, expect } from "vitest";
import { createSSEStream } from "@/lib/stream";
import type { StreamEvent } from "@/lib/types";

async function consumeStream(response: Response): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

describe("createSSEStream", () => {
  it("sets correct headers", () => {
    const response = createSSEStream(async function* () {});
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
    expect(response.headers.get("Connection")).toBe("keep-alive");
  });

  it("sends only [DONE] for empty generator", async () => {
    const response = createSSEStream(async function* () {});
    const output = await consumeStream(response);
    expect(output).toBe("data: [DONE]\n\n");
  });

  it("formats a single event correctly", async () => {
    const event: StreamEvent = { type: "progress", step: "Testing..." };
    const response = createSSEStream(async function* () {
      yield event;
    });
    const output = await consumeStream(response);
    expect(output).toBe(
      `data: ${JSON.stringify(event)}\n\ndata: [DONE]\n\n`
    );
  });

  it("sends multiple events in order", async () => {
    const events: StreamEvent[] = [
      { type: "progress", step: "Step 1" },
      { type: "progress", step: "Step 2" },
    ];
    const response = createSSEStream(async function* () {
      for (const e of events) yield e;
    });
    const output = await consumeStream(response);
    const expected =
      events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("") +
      "data: [DONE]\n\n";
    expect(output).toBe(expected);
  });

  it("sends error event when generator throws", async () => {
    const response = createSSEStream(async function* () {
      throw new Error("boom");
    });
    const output = await consumeStream(response);
    expect(output).toContain('"type":"error"');
    expect(output).toContain('"message":"boom"');
    expect(output).not.toContain("[DONE]");
  });
});
