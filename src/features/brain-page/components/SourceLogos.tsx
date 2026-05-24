/* Brand-style source marks. Compact, monogram-leaning so they sit calmly
 * against the warm-cream palette. Real-ish brand colors but tasteful — no
 * neon, no glow. Each logo is sized via `size` in pixels.
 */

type LogoProps = { size?: number };

export function GitHubLogo({ size = 22 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="GitHub">
      <circle cx="12" cy="12" r="11" fill="#1A1612" />
      <path
        d="M12 5.6c-3.5 0-6.4 2.9-6.4 6.4 0 2.8 1.8 5.2 4.4 6.1.3.06.4-.14.4-.3v-1.1c-1.8.4-2.2-.85-2.2-.85-.3-.75-.7-.95-.7-.95-.6-.4.04-.4.04-.4.6.04.95.65.95.65.55.95 1.45.7 1.8.5.05-.4.2-.7.4-.85-1.4-.16-2.9-.7-2.9-3.15 0-.7.25-1.25.65-1.7-.06-.16-.28-.8.06-1.65 0 0 .54-.17 1.75.65A6.1 6.1 0 0112 8.4c.55 0 1.1.07 1.6.22 1.2-.82 1.75-.65 1.75-.65.35.85.13 1.5.06 1.65.4.45.65 1 .65 1.7 0 2.46-1.5 3-2.9 3.16.22.2.42.55.42 1.1v1.65c0 .16.1.36.4.3 2.6-.9 4.4-3.3 4.4-6.1 0-3.5-2.9-6.4-6.4-6.4z"
        fill="#FAF8F5"
      />
    </svg>
  );
}

export function SlackLogo({ size = 22 }: LogoProps) {
  // Four-color hash, brand colors muted slightly
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Slack">
      <rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="#FAF8F5" stroke="rgba(26,22,18,0.08)" />
      <rect x="6" y="9" width="12" height="2" fill="#36C5F0" />
      <rect x="6" y="13" width="12" height="2" fill="#E01E5A" />
      <rect x="9" y="6" width="2" height="12" fill="#2EB67D" />
      <rect x="13" y="6" width="2" height="12" fill="#ECB22E" />
    </svg>
  );
}

export function NotionLogo({ size = 22 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Notion">
      <rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="#FAF8F5" stroke="rgba(26,22,18,0.08)" />
      <path
        d="M7 6.5h2.5l5 7v-7H17v11h-2.4l-5.1-7.1v7.1H7V6.5z"
        fill="#1A1612"
      />
    </svg>
  );
}

export function FigmaLogo({ size = 22 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Figma">
      <rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="#FAF8F5" stroke="rgba(26,22,18,0.08)" />
      <g transform="translate(7, 5)">
        <path d="M2.5 0h2.5v4H2.5a2 2 0 010-4z" fill="#F24E1E" />
        <path d="M5 4h2.5a2 2 0 110 4H5V4z" fill="#A259FF" />
        <path d="M5 8h2.5a2 2 0 110 4H5V8z" fill="#1ABCFE" />
        <path d="M5 0H7.5a2 2 0 110 4H5V0z" fill="#FF7262" />
        <path d="M2.5 8H5v4a2 2 0 11-2.5-4z" fill="#0ACF83" />
      </g>
    </svg>
  );
}

export function GoogleDriveLogo({ size = 22 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Google Drive">
      <rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="#FAF8F5" stroke="rgba(26,22,18,0.08)" />
      <g transform="translate(3, 4)">
        <path d="M6.5 0l5.5 9.6h-5L1.5 0h5z" fill="#4285F4" />
        <path d="M14 16.5l-2.7-4.7 5-9 2.7 4.7-5 9z" fill="#34A853" />
        <path d="M3.5 16.5l-2.7-4.7L6 2.1l2.7 4.7-5.2 9.7z" fill="#F4B400" />
        <path d="M3.5 16.5h10.5l2.7-4.7H6.2l-2.7 4.7z" fill="#1A73E8" opacity="0.7" />
      </g>
    </svg>
  );
}

export function LinearLogo({ size = 22 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Linear">
      <rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="#5E6AD2" />
      <path
        d="M5 11.6L11.6 5a9 9 0 014.5 1.2L6.2 16.1A9 9 0 015 11.6zm0 2.3L13.9 5a9 9 0 015.2 5.2L10.5 19a9 9 0 01-5.5-5.1zm2.3 5.5L19.4 7.3a9 9 0 011 4.7c0 5-4 9-9 9-1.8 0-3.4-.5-4.8-1.3z"
        fill="#FAF8F5"
      />
    </svg>
  );
}

export function GmailLogo({ size = 22 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Gmail">
      <rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="#FAF8F5" stroke="rgba(26,22,18,0.08)" />
      <path d="M4 7v10h2.5V11l5.5 4 5.5-4v6H20V7l-8 5.8L4 7z" fill="#EA4335" />
    </svg>
  );
}

export function VSCodeLogo({ size = 22 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="VS Code">
      <rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="#0078D4" />
      <path
        d="M16.5 4.5L9 11.5 5.5 8.7 4 9.7l4 3.3-4 3.3 1.5 1 3.5-2.8L16.5 19.5l2.5-1.3V5.8l-2.5-1.3zm0 3l-4.5 4 4.5 4v-8z"
        fill="#FAF8F5"
      />
    </svg>
  );
}

export function CursorLogo({ size = 22 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Cursor">
      <rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="#1A1612" />
      <path d="M7 5l9 5.2-3.8 1.2-1.2 3.8L7 5z" fill="#FAF8F5" />
    </svg>
  );
}

export function AntigravityLogo({ size = 22 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Antigravity">
      <rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="#2D4A3E" />
      <path d="M12 5l5.5 11h-3L12 11l-2.5 5h-3L12 5z" fill="#FAF8F5" />
      <circle cx="12" cy="18" r="1.5" fill="#FAF8F5" />
    </svg>
  );
}

export function FirefliesLogo({ size = 22 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Fireflies">
      <rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="#FAF8F5" stroke="rgba(26,22,18,0.08)" />
      <circle cx="8" cy="9" r="1.6" fill="#C28840" />
      <circle cx="14" cy="8" r="1" fill="#C28840" opacity="0.6" />
      <circle cx="16" cy="14" r="1.4" fill="#C28840" />
      <circle cx="10" cy="15" r="1" fill="#C28840" opacity="0.6" />
      <circle cx="12" cy="11" r="0.7" fill="#C28840" opacity="0.5" />
    </svg>
  );
}

export function ManualUploadLogo({ size = 22 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Manual">
      <rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="#FAF8F5" stroke="rgba(26,22,18,0.18)" strokeDasharray="2 2" />
      <path d="M12 6v10m-4-4l4-4 4 4" stroke="#8A7E6F" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type SourceLogoId =
  | "github"
  | "slack"
  | "notion"
  | "figma"
  | "gdrive"
  | "linear"
  | "gmail"
  | "vscode"
  | "cursor"
  | "antigravity"
  | "fireflies"
  | "manual";

export function SourceLogo({ id, size = 22 }: { id: string; size?: number }) {
  switch (id as SourceLogoId) {
    case "github": return <GitHubLogo size={size} />;
    case "slack": return <SlackLogo size={size} />;
    case "notion": return <NotionLogo size={size} />;
    case "figma": return <FigmaLogo size={size} />;
    case "gdrive": return <GoogleDriveLogo size={size} />;
    case "linear": return <LinearLogo size={size} />;
    case "gmail": return <GmailLogo size={size} />;
    case "vscode": return <VSCodeLogo size={size} />;
    case "cursor": return <CursorLogo size={size} />;
    case "antigravity": return <AntigravityLogo size={size} />;
    case "fireflies": return <FirefliesLogo size={size} />;
    case "manual": return <ManualUploadLogo size={size} />;
    default:
      return <ManualUploadLogo size={size} />;
  }
}
