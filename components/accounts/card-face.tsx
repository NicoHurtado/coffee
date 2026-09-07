"use client";
import { useState } from "react";
import type { CardArt } from "@/lib/finance/card-art";
import { CardChip, ContactlessIcon } from "./card-brand";
import { cn } from "@/lib/utils";

/**
 * The face of the real plastic, painted behind the account data: the issuer's
 * colors and wordmark, the gold chip and the contactless mark. If the user
 * pasted a photo of their actual card it is contained without distortion.
 *
 * Purely decorative and absolutely positioned — it never affects the size or
 * the layout of whatever card component renders it.
 */
export function CardFace({
  art,
  detail = "full",
  className,
}: {
  art: CardArt;
  /** "full" for the 160px card, "mini" for the 36×48 thumbnail. */
  detail?: "full" | "mini";
  className?: string;
}) {
  const isMini = detail === "mini";
  const [failedUrl, setFailedUrl] = useState<string>();
  const imageUrl = art.imageUrl !== failedUrl ? art.imageUrl : undefined;

  return (
    <div
      aria-hidden
      className={cn("coffee-card-art pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{ background: imageUrl ? "transparent" : art.background }}
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-pasted URL
        <img
          src={imageUrl}
          onError={() => setFailedUrl(imageUrl)}
          alt=""
          className="h-full w-full object-contain"
          loading="lazy"
        />
      )}

      {/* Legibility scrim so the balance stays readable over busy artwork. */}
      {!isMini && !imageUrl && <div
        className="absolute inset-0"
        style={{
          background:
            art.textTone === "light"
              ? "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.10) 45%, rgba(0,0,0,0.42) 100%)"
              : "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.34) 100%)",
        }}
      />}

      {!isMini && !imageUrl && (
        <>
          <div
            className="absolute left-5 flex -translate-y-1/2 items-center gap-2"
            style={{ top: "44%" }}
          >
            <CardChip className="h-5 w-7 opacity-90" />
            <ContactlessIcon
              className="h-3.5 w-3.5"
              style={{ color: art.wordmarkColor, opacity: 0.7 }}
            />
          </div>
          {art.wordmark && (
            <div
              className="absolute right-5 max-w-[45%] -translate-y-1/2 truncate text-sm font-semibold tracking-tight"
              style={{ top: "44%", color: art.wordmarkColor, opacity: 0.9 }}
            >
              {art.wordmark}
            </div>
          )}
        </>
      )}
    </div>
  );
}
