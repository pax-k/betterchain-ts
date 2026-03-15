import { describe, it, expect, vi } from "vitest";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(() => Promise.resolve({ url: "https://blob.test/file.jpg" })),
}));

import { POST } from "@/app/api/upload/route";

function makeFakeFile(name: string, type: string, size: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size, writable: false });
  return file;
}

function createRequest(file: File | null): Request {
  const formData = new FormData();
  if (file) formData.append("file", file);

  // Create a real request but override formData() to return our FormData
  // directly, avoiding the serialization/deserialization that loses custom size
  const req = new Request("http://localhost/api/upload", { method: "POST" });
  const originalFormData = formData;
  Object.defineProperty(req, "formData", {
    value: () => Promise.resolve(originalFormData),
  });
  return req;
}

describe("POST /api/upload", () => {
  it("returns 400 when no file is provided", async () => {
    const req = createRequest(null);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("No file provided");
  });

  it("returns 400 when image exceeds 5MB", async () => {
    const file = makeFakeFile("big.jpg", "image/jpeg", 6 * 1024 * 1024);
    const res = await POST(createRequest(file));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("File must be under 5MB");
  });

  it("returns 400 when PDF exceeds 10MB", async () => {
    const file = makeFakeFile("big.pdf", "application/pdf", 11 * 1024 * 1024);
    const res = await POST(createRequest(file));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("File must be under 10MB");
  });

  it("returns 400 for unsupported file type", async () => {
    const file = makeFakeFile("doc.txt", "text/plain", 100);
    const res = await POST(createRequest(file));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("supported");
  });

  it("returns 200 with URL for valid JPEG", async () => {
    const file = makeFakeFile("photo.jpg", "image/jpeg", 1024);
    const res = await POST(createRequest(file));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://blob.test/file.jpg");
  });

  it("returns 200 for valid PNG", async () => {
    const file = makeFakeFile("img.png", "image/png", 2048);
    const res = await POST(createRequest(file));
    expect(res.status).toBe(200);
  });

  it("accepts PDF under 10MB limit", async () => {
    const file = makeFakeFile("doc.pdf", "application/pdf", 9 * 1024 * 1024);
    const res = await POST(createRequest(file));
    expect(res.status).toBe(200);
  });
});
