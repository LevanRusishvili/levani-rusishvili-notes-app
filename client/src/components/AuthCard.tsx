import type { ReactNode } from "react";
import { HashIcon, LogoMark, NotesIcon, SearchIcon } from "./icons";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const features = [
  { icon: <NotesIcon />, text: "Write and organize notes" },
  { icon: <HashIcon />, text: "Tag them any way you like" },
  { icon: <SearchIcon />, text: "Find anything in seconds" },
];

// Shared by login, sign up, forgot and reset password:
// a brand panel on large screens, and the form next to it.
export default function AuthCard({ title, subtitle, children }: Props) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-accent p-12 text-accent-fg lg:flex">
        <div className="relative flex items-center gap-3">
          <LogoMark inverted className="size-9" />
          <span className="text-lg font-bold tracking-tight">Notes</span>
        </div>

        <div className="relative">
          <p className="text-5xl leading-[1.1] font-bold tracking-tight">
            Your thoughts,
            <br />
            kept tidy.
          </p>
          <ul className="mt-10 space-y-4">
            {features.map((feature) => (
              <li
                key={feature.text}
                className="flex items-center gap-3 text-lg opacity-90"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-accent-fg/15">
                  {feature.icon}
                </span>
                {feature.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm opacity-70">
          Write it down. Find it later.
        </p>

        <div
          aria-hidden="true"
          className="absolute -right-28 -bottom-28 size-96 rounded-full bg-accent-fg/10"
        />
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-12 size-56 rounded-full bg-accent-fg/10"
        />
      </aside>

      <main className="grid place-items-center bg-bg p-6">
        <div className="animate-rise w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark className="size-8" />
            <span className="text-lg font-bold tracking-tight">Notes</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
