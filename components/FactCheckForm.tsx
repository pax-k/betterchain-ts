"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  onSubmit: (
    mode: "url" | "image" | "text" | "pdf",
    payload: Record<string, unknown>
  ) => void;
  isLoading: boolean;
};

export function FactCheckForm({ onSubmit, isLoading }: Props) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit("url", { url: url.trim() });
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit("text", { text: text.trim() });
  };

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    onSubmit("image", { imageUrl: imageUrl.trim() });
  };

  const handlePdfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfUrl.trim()) return;
    onSubmit("pdf", { pdfUrl: pdfUrl.trim() });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "pdf"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }

      const { url: blobUrl } = await response.json();
      if (type === "image") {
        setImageUrl(blobUrl);
      } else {
        setPdfUrl(blobUrl);
        setPdfFileName(file.name);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Tabs defaultValue="text" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="text">Text</TabsTrigger>
        <TabsTrigger value="url">URL</TabsTrigger>
        <TabsTrigger value="image">Image</TabsTrigger>
        <TabsTrigger value="pdf">PDF</TabsTrigger>
      </TabsList>

      <TabsContent value="text">
        <form onSubmit={handleTextSubmit} className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter a claim or statement to fact-check..."
            className="w-full min-h-[120px] rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-y"
            maxLength={10000}
            disabled={isLoading}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">
              {text.length}/10,000
            </span>
            <Button type="submit" disabled={isLoading || !text.trim()}>
              {isLoading ? "Checking..." : "Check Facts"}
            </Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="url">
        <form onSubmit={handleUrlSubmit} className="space-y-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !url.trim()}>
              {isLoading ? "Checking..." : "Check Article"}
            </Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="image">
        <form onSubmit={handleImageSubmit} className="space-y-3">
          <div className="space-y-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL or upload below..."
              className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              disabled={isLoading}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted-foreground)]">or</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-[var(--primary)] hover:underline disabled:opacity-50"
                disabled={isLoading || isUploading}
              >
                {isUploading ? "Uploading..." : "Upload an image"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => handleFileUpload(e, "image")}
                className="hidden"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !imageUrl.trim()}>
              {isLoading ? "Checking..." : "Check Image"}
            </Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="pdf">
        <form onSubmit={handlePdfSubmit} className="space-y-3">
          <div className="space-y-2">
            {pdfFileName ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--muted)]">
                <span className="text-sm">📄 {pdfFileName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPdfUrl("");
                    setPdfFileName("");
                  }}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] ml-auto"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 px-3 py-8 border-2 border-dashed border-[var(--border)] rounded-md cursor-pointer hover:border-[var(--primary)] transition-colors"
                onClick={() => pdfInputRef.current?.click()}
              >
                <span className="text-2xl">📄</span>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {isUploading
                    ? "Uploading..."
                    : "Click to upload a PDF (max 10MB)"}
                </span>
              </div>
            )}
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFileUpload(e, "pdf")}
              className="hidden"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !pdfUrl.trim()}>
              {isLoading ? "Checking..." : "Check PDF"}
            </Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}
