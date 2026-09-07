"use client";
import { useState } from "react";

/** Natural image ratio; neither a fixed height nor a covering layer. */
export function CardPhoto({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState<string>();
  if (failed === src) return <div className="rounded-xl border p-5 text-sm text-muted-foreground">Imagen no disponible</div>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- bundled artwork or a user-provided image
    <img src={src} alt={`Tarjeta ${name}`} onError={() => setFailed(src)}
      className="coffee-card-art block h-auto w-full rounded-xl" loading="lazy" />
  );
}
