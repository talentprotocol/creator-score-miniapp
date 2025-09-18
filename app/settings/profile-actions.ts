'use server';

import { TalentApiClient } from "@/lib/talent-api-client";

export async function getTagsAction(): Promise<string[]> {
  const client = new TalentApiClient();
  const resp = await client.getTags();
  if (!resp.ok) return [];
  try {
    const data = await resp.json();
    // Accept either `{ tags: string[] }` or `string[]`
    if (Array.isArray(data)) return data as string[];
    if (Array.isArray(data?.tags)) return data.tags as string[];
    return [];
  } catch {
    return [];
  }
}

export async function getFullProfileAction(
  talentUuid: string,
): Promise<Record<string, unknown> | null> {
  if (!talentUuid) return null;
  const client = new TalentApiClient();
  const resp = await client.getProfile({ talent_protocol_id: talentUuid });
  if (!resp.ok) return null;
  try {
    const data = await resp.json();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function updateProfileAction(params: {
  token: string;
  data: {
    bio?: string | null;
    display_name?: string | null;
    location?: string | null;
    tags?: string[] | null;
  };
}): Promise<{ ok: boolean; error?: string }> {
  const token = params?.token || "";
  if (!token) return { ok: false, error: "Missing Talent auth token" };

  const client = new TalentApiClient({ userAuthToken: token });
  const resp = await client.updateProfile(params.data || {});
  if (resp.ok) return { ok: true };
  try {
    const err = await resp.json();
    return { ok: false, error: String(err?.error || 'Failed to update profile') };
  } catch {
    return { ok: false, error: 'Failed to update profile' };
  }
}


