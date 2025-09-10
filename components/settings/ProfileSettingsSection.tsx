"use client";

import * as React from "react";
import { useTalentAuthToken } from "@/hooks/useTalentAuthToken";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Uses API routes: GET /api/tags and GET/PUT /api/profile

type Props = {
  talentUuid?: string | null;
  initialProfile?: {
    display_name?: string | null;
    bio?: string | null;
    location?: string | null;
    tags?: string[] | null;
  } | null;
};

export function ProfileSettingsSection({ talentUuid, initialProfile }: Props) {
  const { token, ensureTalentAuthToken } = useTalentAuthToken();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [allTags, setAllTags] = React.useState<string[]>([]);

  const [displayName, setDisplayName] = React.useState<string>(
    initialProfile?.display_name || "",
  );
  const [bio, setBio] = React.useState<string>(initialProfile?.bio || "");
  const [location, setLocation] = React.useState<string>(
    initialProfile?.location || "",
  );
  // main_role and open_to not supported for now
  const [tags, setTags] = React.useState<string[]>(
    Array.isArray(initialProfile?.tags) ? (initialProfile?.tags as string[]).slice(0, 3) : [],
  );

  React.useEffect(() => {
    let cancelled = false;
    async function fetchTags() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tags`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const t: string[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.tags)
          ? data.tags
          : [];
        if (!cancelled) setAllTags(t);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load tags");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTags();
    return () => {
      cancelled = true;
    };
  }, []);

  // Optionally load current profile to prefill if not provided
  React.useEffect(() => {
    if (initialProfile || !talentUuid) return;
    let cancelled = false;
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/profile?uuid=${encodeURIComponent(String(talentUuid))}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data) return;
        setDisplayName(data.display_name || data.name || "");
        setBio(data.bio || "");
        setLocation(data.location || "");
        // main_role and open_to not supported
        const preTags: string[] = Array.isArray(data.tags) ? data.tags.slice(0, 3) : [];
        setTags(preTags);
      } catch {}
    }
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [initialProfile, talentUuid]);

  function toggleTag(tag: string) {
    setTags((prev) => {
      const has = prev.includes(tag);
      if (has) return prev.filter((t) => t !== tag);
      if (prev.length >= 3) return prev; // enforce max 3
      return [...prev, tag];
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Ensure auth token
      let t = token;
      if (!t) t = (await ensureTalentAuthToken()) || null;
      if (!t) throw new Error("Missing Talent auth token");

      const payload = {
        display_name: displayName?.trim() || null,
        bio: bio?.trim() || null,
        location: location?.trim() || null,
        tags: tags?.length ? tags.slice(0, 3) : [],
      } as const;

      const res = await fetch(`/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-talent-auth-token": String(t),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        try {
          const err = await res.json();
          throw new Error(String(err?.error || `HTTP ${res.status}`));
        } catch (e) {
          throw new Error(e instanceof Error ? e.message : `HTTP ${res.status}`);
        }
      }
      setSuccess("Profile updated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Display name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Bio</label>
          <Input
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short bio"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Location</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
          />
        </div>

        {/* main_role and open_to not supported for now */}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Tags (max 3)</label>
            <span className="text-[10px] text-muted-foreground">{tags.length}/3 selected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {loading ? (
              <span className="text-xs text-muted-foreground">Loading tags…</span>
            ) : (
              (allTags || []).map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 rounded border text-xs ${active ? 'bg-primary text-primary-foreground' : 'bg-background'} `}
                  >
                    {tag}
                  </button>
                );
              })
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-500">{error}</div>
      )}
      {success && (
        <div className="text-xs text-green-600">{success}</div>
      )}

      <Button className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Profile"}
      </Button>
    </div>
  );
}


