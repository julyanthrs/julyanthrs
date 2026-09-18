/**
 * Duotone portrait artwork used in the About collage.
 * Replace with a real photo by swapping this component for an <img>.
 */
export const Portrait = () => (
  <svg viewBox="0 0 160 200" className="h-full w-full" role="img" aria-label="Stylised portrait of Kai Moreno">
    <defs>
      <linearGradient id="portrait-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2a0717" />
        <stop offset="1" stopColor="#000" />
      </linearGradient>
      <linearGradient id="portrait-figure" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffb8d5" />
        <stop offset="1" stopColor="#ff2e88" />
      </linearGradient>
      <pattern id="portrait-scan" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="1" fill="rgba(0,0,0,0.35)" />
      </pattern>
    </defs>
    <rect width="160" height="200" fill="url(#portrait-bg)" />
    <circle cx="120" cy="46" r="30" fill="#ff2e88" opacity="0.18" />
    <path d="M80 44c16 0 26 13 26 30s-10 32-26 32-26-15-26-32 10-30 26-30Z" fill="url(#portrait-figure)" />
    <path d="M54 66c0-22 12-32 28-32 14 0 26 8 27 26-8-8-20-12-32-10-10 2-17 8-23 16Z" fill="#1a0510" />
    <path d="M22 200c4-44 28-70 58-70s54 26 58 70Z" fill="url(#portrait-figure)" opacity="0.92" />
    <rect width="160" height="200" fill="url(#portrait-scan)" />
  </svg>
);
