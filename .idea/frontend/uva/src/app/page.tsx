"use client";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

type FileKind = "image" | "pdf"|"png" | "jpg" | "jpeg" |"gif"|"txt";

const MAX_SIZE_MB = 15;
const ACCEPT_MIME = ["image/*", "application/pdf"];
//validation varibles
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileKind, setFileKind] = useState<FileKind | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const acceptAttr = useMemo(() => ["image/*", ".pdf"].join(","), []);

  const resetStatus = () => {
    setMessage("");
    setError("");
    setProgress(0);
  };
//validate file type fuction
  const validateFile = (file: File): string | null => {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const validType = isImage || isPdf;

    if (!validType) return "Only images and PDFs are allowed.";
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_SIZE_MB) return `File is too large. Max ${MAX_SIZE_MB}MB.`;
    return null;
  };

  const prepareFile = (f: File) => {
    resetStatus();
    const validation = validateFile(f);
    if (validation) {
      setError(validation);
      setFile(null);
      setPreviewUrl(null);
      setFileKind(null);
      return;
    }
    setFile(f);
    const kind: FileKind = f.type.startsWith("image/") ? "image" : "pdf";
    setFileKind(kind);
    if (kind === "image") {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) prepareFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) prepareFile(f);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    if (!file) {
      setError("Please choose a file first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      //send file too backend runnning on port 500
      const res = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (pe) => {
          if (!pe.total) return;
          const pct = Math.round((pe.loaded * 100) / pe.total);
          setProgress(pct);
        },
      });
      setMessage(res.data?.message || "Upload successful!");
    } catch (err: any) {
      const detail =
          err?.response?.data?.message ||
          err?.message ||
          "Upload failed. Please try again.";
      setError(detail);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <h1 className="text-3xl font-semibold tracking-tight">Universal Visual Assistant</h1>
          <p className="mt-2 text-gray-600">
            Upload an image or PDF. We’ll handle it and show you the result.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={[
                    "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition",
                    dragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400 bg-white",
                  ].join(" ")}
              >
                <input
                    type="file"
                    accept={acceptAttr}
                    onChange={handleFileChange}
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                    aria-label="File upload"
                />
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    {/* Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 15v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4M7 10l5-5 5 5M12 5v11"/>
                    </svg>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium text-blue-600">Click to choose</span> or drag & drop
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Images or PDF, up to {MAX_SIZE_MB}MB</p>
                </div>
              </label>

              {file && (
                  <div className="mt-4 flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
                    {fileKind === "image" && previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="h-16 w-16 rounded object-cover ring-1 ring-gray-200"
                        />
                    ) : (
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-gray-600">
                          {/* PDF icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
                          </svg>
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                          setFileKind(null);
                          resetStatus();
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Remove
                    </button>
                  </div>
              )}
            </div>

            {uploading && (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Uploading…</span>
                    <span className="text-sm font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded bg-gray-100">
                    <div
                        className="h-full bg-blue-600 transition-[width]"
                        style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
            )}

            {message && (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {message}
                </div>
            )}
            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
            )}

            <div className="flex items-center gap-3">
              <button
                  type="submit"
                  disabled={!file || uploading}
                  className={[
                    "inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    !file || uploading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700",
                  ].join(" ")}
              >
                {uploading ? "Uploading..." : "Upload File"}
              </button>
              <p className="text-xs text-gray-500">Allowed: images or PDFs</p>
            </div>
          </form>
        </div>
      </main>
  );
}