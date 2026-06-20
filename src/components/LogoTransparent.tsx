"use client";

import { useEffect, useRef } from "react";

export default function LogoTransparent({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        // Eliminar píxeles casi blancos
        if (r > 210 && g > 210 && b > 210) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    };
    img.src = "/logo basico.jpeg";
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ filter: "drop-shadow(0 0 16px rgba(227,30,36,0.6))" }}
    />
  );
}
