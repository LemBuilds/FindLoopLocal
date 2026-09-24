"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";

interface BlurEditorProps {
  imageSrc: string;
  onDone: (blurredDataUrl: string) => void;
  onSkip: () => void;
}

interface Rect { x: number; y: number; w: number; h: number }

export function BlurEditor({ imageSrc, onDone, onSkip }: BlurEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [drawing, setDrawing] = useState<Rect | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  const drawCanvas = useCallback(
    (img: HTMLImageElement, rectList: Rect[], active?: Rect) => {
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      if (!canvas || !overlay) return;

      const maxW = canvas.parentElement?.clientWidth ?? 400;
      const scale = Math.min(maxW / img.naturalWidth, 400 / img.naturalHeight);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      overlay.width = canvas.width;
      overlay.height = canvas.height;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      for (const r of rectList) {
        applyBlur(ctx, r, canvas.width, canvas.height);
      }

      const octx = overlay.getContext("2d")!;
      octx.clearRect(0, 0, overlay.width, overlay.height);

      if (active) {
        octx.strokeStyle = "var(--color-accent, #F4A44A)";
        octx.lineWidth = 2;
        octx.setLineDash([4, 2]);
        octx.strokeRect(
          active.x * canvas.width,
          active.y * canvas.height,
          active.w * canvas.width,
          active.h * canvas.height
        );
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      drawCanvas(img, []);
    };
    img.src = imageSrc;
  }, [imageSrc, drawCanvas]);

  function applyBlur(ctx: CanvasRenderingContext2D, r: Rect, w: number, h: number) {
    const px = Math.round(r.x * w);
    const py = Math.round(r.y * h);
    const pw = Math.max(1, Math.round(r.w * w));
    const ph = Math.max(1, Math.round(r.h * h));
    const PIXEL_SIZE = Math.max(8, Math.floor(Math.min(pw, ph) / 10));

    for (let y = py; y < py + ph; y += PIXEL_SIZE) {
      for (let x = px; x < px + pw; x += PIXEL_SIZE) {
        const d = ctx.getImageData(x, y, 1, 1).data;
        ctx.fillStyle = `rgb(${d[0]},${d[1]},${d[2]})`;
        ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(px, py, pw, ph);
  }

  function getRelativePos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }

  function handlePointerDown(e: React.MouseEvent | React.TouchEvent) {
    const canvas = overlayRef.current;
    if (!canvas || !imgRef.current) return;
    const pos = getRelativePos(e, canvas);
    setStartPos(pos);
    setDrawing({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }

  function handlePointerMove(e: React.MouseEvent | React.TouchEvent) {
    if (!startPos || !imgRef.current) return;
    const canvas = overlayRef.current;
    if (!canvas) return;
    const pos = getRelativePos(e, canvas);
    const active = {
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y),
    };
    setDrawing(active);
    drawCanvas(imgRef.current, rects, active);
  }

  function handlePointerUp() {
    if (!drawing || drawing.w < 0.02 || drawing.h < 0.02) {
      setDrawing(null);
      setStartPos(null);
      return;
    }
    const next = [...rects, drawing];
    setRects(next);
    setDrawing(null);
    setStartPos(null);
    if (imgRef.current) drawCanvas(imgRef.current, next);
  }

  function handleDone() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onDone(canvas.toDataURL("image/jpeg", 0.88));
  }

  function handleUndo() {
    const next = rects.slice(0, -1);
    setRects(next);
    if (imgRef.current) drawCanvas(imgRef.current, next);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
        Drag to blur any sensitive area. Changes are applied client-side — original never leaves your device unblurred.
      </p>

      <div className="relative rounded-[var(--radius-md)] overflow-hidden select-none" style={{ background: "#111" }}>
        <canvas ref={canvasRef} className="block w-full" />
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={handleUndo} disabled={rects.length === 0}>
          Undo
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip
        </Button>
        <Button variant="primary" size="sm" onClick={handleDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
