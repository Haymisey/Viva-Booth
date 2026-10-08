"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Booth, type LoadedTalk } from "@/components/booth/Booth";
import { PracticeRail, type TalkSummary } from "@/components/booth/PracticeRail";
import { authClient, useSession } from "@/lib/auth-client";
import type { Citation } from "@/lib/types";

function citationsFromSaved(raw: unknown): Citation[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row, i) => {
    const c = row as Record<string, unknown>;
    const status = c.status;
    return {
      id: typeof c.id === "string" ? c.id : `saved-${i}`,
      text: String(c.text ?? ""),
      status:
        status === "in_corpus" ||
        status === "elsewhere" ||
        status === "not_found" ||
        status === "pending" ||
        status === "unverified"
          ? status
          : "unverified",
      source: c.source === "manuscript" ? "manuscript" : "speech",
      hitTitle: typeof c.hitTitle === "string" ? c.hitTitle : undefined,
      closestTitle: typeof c.closestTitle === "string" ? c.closestTitle : undefined,
    };
  });
}

export function PracticeShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data } = useSession();
  const user = data?.user;
  const activeId = searchParams.get("s");

  const [talks, setTalks] = useState<TalkSummary[]>([]);
  const [loaded, setLoaded] = useState<LoadedTalk | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);

  const refreshTalks = useCallback(async () => {
    const res = await fetch("/api/sessions");
    if (!res.ok) return;
    const json = (await res.json()) as { ok?: boolean; sessions?: TalkSummary[] };
    if (json.ok && Array.isArray(json.sessions)) setTalks(json.sessions);
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    void refreshTalks();
    void (async () => {
      const res = await fetch("/api/settings/profile");
      const json = await res.json();
      if (json.ok) setProfile({ name: String(json.name || ""), email: String(json.email || "") });
    })();
  }, [user, refreshTalks]);

  useEffect(() => {
    if (!activeId || !user) {
      setLoaded(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/sessions/${activeId}`);
      const json = await res.json();
      if (cancelled || !json.ok || !json.session) return;
      const session = json.session as {
        id: string;
        transcript: string;
        seconds: number;
        debrief: string | null;
        citationsJson: string | null;
      };
      let citations: Citation[] = [];
      try {
        citations = citationsFromSaved(JSON.parse(session.citationsJson || "[]"));
      } catch {
        citations = [];
      }
      setLoaded({
        id: session.id,
        transcript: session.transcript,
        seconds: session.seconds,
        debrief: session.debrief ?? "",
        citations,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId, user]);

  const openNew = () => {
    setLoaded(null);
    router.replace("/practice");
  };

  const openTalk = (id: string) => {
    router.replace(`/practice?s=${id}`);
  };

  return (
    <div className="practice-shell">
      {user ? (
        <PracticeRail
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
          talks={talks}
          activeId={activeId}
          onNew={openNew}
          onSelect={openTalk}
          userName={profile?.name || user.name}
          userEmail={profile?.email || user.email}
          onSignOut={async () => {
            await authClient.signOut();
            router.replace("/practice");
            router.refresh();
          }}
        />
      ) : null}
      <div className="practice-main">
        <Booth
          signedIn={Boolean(user)}
          loadedTalk={activeId ? loaded : null}
          keepTalksLink={
            !user ? (
              <Link href="/auth/signin?callbackUrl=/practice" className="keep-talks">
                Sign in to keep talks
              </Link>
            ) : null
          }
          onNewPractice={openNew}
          onTalkSaved={(id) => {
            void refreshTalks();
            router.replace(`/practice?s=${id}`);
          }}
        />
      </div>
    </div>
  );
}
