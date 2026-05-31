"use client";
import type { CardNetwork } from "@/lib/types";

export function VisaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <text
        x="0"
        y="19"
        fontFamily="Helvetica, Arial, sans-serif"
        fontSize="22"
        fontWeight="900"
        fontStyle="italic"
        fill="currentColor"
        letterSpacing="-0.5"
      >
        VISA
      </text>
    </svg>
  );
}

export function MastercardLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 30" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="15" r="11" fill="#EB001B" />
      <circle cx="30" cy="15" r="11" fill="#F79E1B" />
      <path
        d="M24 7.4a11 11 0 0 1 0 15.2 11 11 0 0 1 0-15.2Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

export function AmexLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="56" height="24" rx="3" fill="#1F72CD" />
      <text
        x="28"
        y="11"
        textAnchor="middle"
        fontFamily="Helvetica, Arial, sans-serif"
        fontSize="6.5"
        fontWeight="900"
        fill="#fff"
        letterSpacing="0.4"
      >
        AMERICAN
      </text>
      <text
        x="28"
        y="19"
        textAnchor="middle"
        fontFamily="Helvetica, Arial, sans-serif"
        fontSize="6.5"
        fontWeight="900"
        fill="#fff"
        letterSpacing="0.4"
      >
        EXPRESS
      </text>
    </svg>
  );
}

export function GenericCardLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 18" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="56" height="18" rx="3" fill="currentColor" opacity="0.25" />
      <text
        x="28"
        y="13"
        textAnchor="middle"
        fontFamily="Helvetica, Arial, sans-serif"
        fontSize="9"
        fontWeight="700"
        fill="currentColor"
      >
        CARD
      </text>
    </svg>
  );
}

export function CardBrandLogo({
  network,
  className,
}: {
  network?: CardNetwork;
  className?: string;
}) {
  switch (network) {
    case "visa":
      return <VisaLogo className={className} />;
    case "mastercard":
      return <MastercardLogo className={className} />;
    case "amex":
      return <AmexLogo className={className} />;
    default:
      return <GenericCardLogo className={className} />;
  }
}

export function CardChip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chip-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#F5E1A4" />
          <stop offset="100%" stopColor="#B8902C" />
        </linearGradient>
      </defs>
      <rect width="32" height="24" rx="4" fill="url(#chip-gradient)" />
      <path
        d="M4 8h8M4 12h8M4 16h8M20 8h8M20 12h8M20 16h8M12 4v16M20 4v16"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

export function ContactlessIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 8c2 2 2 6 0 8M10 6c3 3 3 9 0 12M14 4c4 4 4 12 0 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
