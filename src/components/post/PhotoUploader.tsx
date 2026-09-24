"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { PrivacyWarning } from "./PrivacyWarning";
import { BlurEditor } from "./BlurEditor";

const MAX_PHOTOS = 5;

export interface UploadedPhoto {
  dataUrl: string;
  file: File;
}

interface PhotoUploaderProps {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
}

type UIState = "idle" | "privacy-warning" | "blur-editor";

export function PhotoUploader({ photos, onChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uiState, setUiState] = useState<UIState>("idle");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingDataUrl, setPendingDataUrl] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPendingDataUrl(ev.target?.result as string);
      setPendingFile(file);
      setUiState("privacy-warning");
    };
    reader.readAsDataURL(file);
  }

  function handlePrivacyContinue() {
    setUiState("blur-editor");
  }

  function handlePrivacyCancel() {
    setPendingFile(null);
    setPendingDataUrl(null);
    setUiState("idle");
  }

  function handleBlurDone(blurredDataUrl: string) {
    if (!pendingFile) return;
    const blurredFile = dataUrlToFile(blurredDataUrl, pendingFile.name);
    onChange([...photos, { dataUrl: blurredDataUrl, file: blurredFile }]);
    setPendingFile(null);
    setPendingDataUrl(null);
    setUiState("idle");
  }

  function handleBlurSkip() {
    if (!pendingFile || !pendingDataUrl) return;
    onChange([...photos, { dataUrl: pendingDataUrl, file: pendingFile }]);
    setPendingFile(null);
    setPendingDataUrl(null);
    setUiState("idle");
  }

  function removePhoto(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  if (uiState === "privacy-warning") {
    return <PrivacyWarning onContinue={handlePrivacyContinue} onCancel={handlePrivacyCancel} />;
  }

  if (uiState === "blur-editor" && pendingDataUrl) {
    return <BlurEditor imageSrc={pendingDataUrl} onDone={handleBlurDone} onSkip={handleBlurSkip} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative aspect-square rounded-[var(--radius-sm)] overflow-hidden group">
            <Image src={p.dataUrl} alt={`Photo ${i + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-[var(--radius-sm)] border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:border-[var(--color-accent)]"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
          >
            <span className="text-xl">+</span>
            <span className="text-xs">Add photo</span>
          </button>
        )}
      </div>

      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {photos.length}/{MAX_PHOTOS} photos · You can blur sensitive areas before uploading.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bstr = atob(data);
  const arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) arr[i] = bstr.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}
