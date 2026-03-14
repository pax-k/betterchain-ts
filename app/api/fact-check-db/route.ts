import { NextResponse } from "next/server";
import { Verdict } from "@/lib/types";

type StoredFactCheck = {
  id: string;
  mode: "url" | "image" | "text";
  input: string;
  verdict: Verdict;
  createdAt: string;
};

// In-memory store for v1 — replace with database in production
const store = new Map<string, StoredFactCheck>();

export async function GET() {
  const results = Array.from(store.values())
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 20);

  return NextResponse.json(results);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { mode, input, verdict } = body;

  if (!mode || !input || !verdict) {
    return NextResponse.json(
      { error: "mode, input, and verdict are required" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  const entry: StoredFactCheck = {
    id,
    mode,
    input,
    verdict,
    createdAt: new Date().toISOString(),
  };

  store.set(id, entry);

  return NextResponse.json(entry, { status: 201 });
}
