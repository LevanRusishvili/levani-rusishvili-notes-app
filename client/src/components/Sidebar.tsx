import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  ArchiveIcon,
  HashIcon,
  LogoMark,
  LogoutIcon,
  NotesIcon,
  SettingsIcon,
} from "./icons";

interface Props {
  tags: string[];
  counts: { all: number; archived: number };
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors max-md:shrink-0 max-md:rounded-full max-md:px-4 ${
    isActive
      ? "bg-accent-soft font-semibold text-accent"
      : "text-fg hover:bg-bg/70"
  }`;

function Item({
  to,
  end,
  icon,
  children,
  count,
}: {
  to: string;
  end?: boolean;
  icon: ReactNode;
  children: ReactNode;
  count?: number;
}) {
  return (
    <NavLink to={to} end={end} className={linkClass}>
      {icon}
      <span className="flex-1">{children}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-muted tabular-nums">{count}</span>
      )}
    </NavLink>
  );
}

export default function Sidebar({ tags, counts }: Props) {
  const { user, logout } = useAuth();

  return (
    <aside className="border-b border-line bg-surface md:flex md:w-64 md:shrink-0 md:flex-col md:overflow-y-auto md:border-r md:border-b-0">
      <nav
        aria-label="Main"
        className="flex items-center gap-1 p-2 md:flex-1 md:flex-col md:items-stretch md:p-4"
      >
        <div className="hidden items-center gap-3 px-2 pt-1 pb-6 md:flex">
          <LogoMark className="size-8" />
          <span className="text-lg font-bold tracking-tight">Notes</span>
        </div>

        {/* phone: this row scrolls sideways; desktop: a normal vertical list */}
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto md:flex-none md:flex-col md:overflow-visible">
          <Item to="/" end icon={<NotesIcon />} count={counts.all}>
            All Notes
          </Item>
          <Item to="/archived" icon={<ArchiveIcon />} count={counts.archived}>
            Archived Notes
          </Item>
          <Item to="/settings" icon={<SettingsIcon />}>
            Settings
          </Item>

          {tags.length > 0 && (
            <>
              <p className="hidden px-3 pt-6 pb-1 text-xs font-medium text-muted md:block">
                Tags
              </p>
              {tags.map((tag) => (
                <Item
                  key={tag}
                  to={`/tags/${encodeURIComponent(tag)}`}
                  icon={<HashIcon />}
                >
                  {tag}
                </Item>
              ))}
            </>
          )}
        </div>

        {/* phone: icon button that always stays visible next to the scrolling row */}
        <button
          type="button"
          className="btn btn-ghost shrink-0 md:hidden"
          aria-label="Log out"
          onClick={() => void logout()}
        >
          <LogoutIcon />
        </button>

        {/* desktop: account card pinned to the bottom */}
        {user && (
          <div className="mt-auto hidden border-t border-line pt-4 md:block">
            <div className="flex items-center gap-3 px-2">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-fg"
              >
                {user.email.charAt(0).toUpperCase()}
              </span>
              <p className="min-w-0 flex-1 truncate text-sm" title={user.email}>
                {user.email}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost mt-2 w-full justify-start"
              onClick={() => void logout()}
            >
              <LogoutIcon />
              Log out
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
}
