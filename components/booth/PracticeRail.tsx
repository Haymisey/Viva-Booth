"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, PanelLeft, PanelLeftClose, Search, Settings, SquarePen, Trash2 } from "lucide-react";
import { Wordmark } from "@/components/viva/Wordmark";

export type TalkSummary = {
  id: string;
  title: string;
  seconds: number;
  createdAt: string;
};

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  talks: TalkSummary[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  userName?: string;
  userEmail?: string;
  onSignOut: () => void;
};

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initials(name: string, email?: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  const local = email?.split("@")[0]?.replace(/[^a-zA-Z0-9]/g, "") || "";
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local.length === 1) return local[0].toUpperCase();
  return "";
}

export function PracticeRail({
  collapsed,
  onToggle,
  talks,
  activeId,
  onNew,
  onSelect,
  onDelete,
  userName,
  userEmail,
  onSignOut,
}: Props) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = userName?.trim() || userEmail?.split("@")[0] || "";
  const letters = initials(userName ?? "", userEmail);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return talks;
    return talks.filter((talk) => talk.title.toLowerCase().includes(needle));
  }, [talks, query]);

  useEffect(() => {
    if (searchOpen && !collapsed) searchRef.current?.focus();
  }, [searchOpen, collapsed]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  return (
    <aside className={`practice-rail ${collapsed ? "collapsed" : ""}`}>
      <div className="practice-rail-head">
        {collapsed ? null : <Wordmark className="wordmark practice-rail-mark" />}
        <div className="practice-rail-tools">
          {collapsed ? null : (
            <button
              type="button"
              className="practice-icon-btn"
              aria-label="Search talks"
              onClick={() => {
                setSearchOpen(true);
                window.setTimeout(() => searchRef.current?.focus(), 0);
              }}
            >
              <Search size={16} />
            </button>
          )}
          <button type="button" className="practice-icon-btn" aria-label={collapsed ? "Open talks" : "Hide talks"} onClick={onToggle}>
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </div>

      <button type="button" className="practice-new" onClick={onNew} aria-label="New practice">
        <SquarePen size={16} />
        {collapsed ? null : "New practice"}
      </button>

      {collapsed || !searchOpen ? null : (
        <input
          ref={searchRef}
          className="practice-search"
          type="search"
          placeholder="Search talks"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setQuery("");
              setSearchOpen(false);
            }
          }}
        />
      )}

      {collapsed ? null : (
        <div className="practice-talks">
          {visible.length === 0 ? (
            <p className="practice-rail-empty">{talks.length === 0 ? "Talks you finish will live here." : "No talks match that search."}</p>
          ) : (
            visible.map((talk) => (
              <div key={talk.id} className={`practice-talk-row ${talk.id === activeId ? "active" : ""}`}>
                <button type="button" className="practice-talk" onClick={() => onSelect(talk.id)}>
                  {talk.title}
                  <span className="practice-talk-meta">{formatWhen(talk.createdAt)}</span>
                </button>
                <button
                  type="button"
                  className="practice-talk-delete"
                  aria-label={`Delete ${talk.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(talk.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <div className="practice-account" ref={menuRef}>
        <button
          type="button"
          className="practice-account-btn"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
        >
          <span className="practice-avatar">{letters}</span>
          {collapsed ? null : <span className="practice-account-name">{displayName}</span>}
        </button>
        {menuOpen ? (
          <div className="practice-account-menu" role="menu">
            <Link href="/settings" role="menuitem" className="practice-account-item" onClick={() => setMenuOpen(false)}>
              <Settings size={14} /> Settings
            </Link>
            <button type="button" role="menuitem" className="practice-account-item" onClick={onSignOut}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
