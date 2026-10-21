import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

// Small stroke icons. They take their color from the text color (currentColor)
// and are hidden from screen readers: the text next to them already says the same thing.
function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const NotesIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6" />
    <path d="M9 17h4" />
  </Icon>
);

export const ArchiveIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
    <path d="M10 12h4" />
  </Icon>
);

export const UndoIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
  </Icon>
);

export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h9" />
    <path d="M17 7h3" />
    <circle cx="15" cy="7" r="2" />
    <path d="M4 17h3" />
    <path d="M11 17h9" />
    <circle cx="9" cy="17" r="2" />
  </Icon>
);

export const HashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 9h14" />
    <path d="M5 15h14" />
    <path d="M10 4 8 20" />
    <path d="M16 4l-2 16" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Icon>
);

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    <path d="M9 7V4h6v3" />
  </Icon>
);

export const LogoutIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Icon>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12 5 5L20 7" />
  </Icon>
);

// The app logo: a rounded square with a page and two lines of text on it
export function LogoMark({
  inverted = false,
  ...props
}: IconProps & { inverted?: boolean }) {
  const back = inverted ? "var(--accent-fg)" : "var(--accent)";
  const front = inverted ? "var(--accent)" : "var(--accent-fg)";
  return (
    <svg
      viewBox="0 0 32 32"
      width="32"
      height="32"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect width="32" height="32" rx="9" fill={back} />
      <path
        d="M10 9.5h8l4 4V22a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 9 22V11a1.5 1.5 0 0 1 1-1.5z"
        fill="none"
        stroke={front}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 17.5h7M12.5 20.5h4"
        stroke={front}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
