import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isPdf = file.type === "application/pdf";
  const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;

  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File must be under ${isPdf ? "10MB" : "5MB"}` },
      { status: 400 }
    );
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, GIF images and PDF files are supported" },
      { status: 400 }
    );
  }

  const blob = await put(file.name, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
