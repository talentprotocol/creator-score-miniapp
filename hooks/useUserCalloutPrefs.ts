import * as React from "react";

type CalloutPrefs = {
  dismissedIds: string[];
  permanentlyHiddenIds: string[];
};

type State = {
  data: CalloutPrefs | null;
  loading: boolean;
  error: string | null;
};

export function useUserCalloutPrefs(talentUuid: string | null | undefined) {
  const [state, setState] = React.useState<State>({
    data: null,
    loading: !!talentUuid,
    error: null,
  });

  const refresh = React.useCallback(async () => {
    if (!talentUuid) return;
    setState((s) => ({ ...s, loading: true }));
    try {
      const url = `/api/user-preferences?talent_uuid=${encodeURIComponent(talentUuid)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load prefs: ${res.status}`);
      const json = await res.json();
      const prefs: CalloutPrefs = json.callout_prefs ?? {
        dismissedIds: [],
        permanentlyHiddenIds: [],
      };
      setState({ data: prefs, loading: false, error: null });
    } catch (e) {
      setState({ data: null, loading: false, error: (e as Error).message });
    }
  }, [talentUuid]);

  React.useEffect(() => {
    if (!talentUuid) return;
    refresh();
  }, [talentUuid, refresh]);

  const addDismissedId = React.useCallback(
    async (id: string) => {
      if (!talentUuid) return;
      try {
        const res = await fetch(`/api/user-preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            talent_uuid: talentUuid,
            creator_category: null,
            add_dismissed_id: id,
          }),
        });
        if (!res.ok)
          throw new Error(`Failed to persist dismissed id: ${res.status}`);
        await refresh();
      } catch (e) {
        console.error(e);
      }
    },
    [talentUuid, refresh],
  );

  const addPermanentlyHiddenId = React.useCallback(
    async (id: string) => {
      if (!talentUuid) return;
      try {
        const res = await fetch(`/api/user-preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            talent_uuid: talentUuid,
            creator_category: null,
            add_permanently_hidden_id: id,
          }),
        });
        if (!res.ok)
          throw new Error(
            `Failed to persist permanently hidden id: ${res.status}`,
          );
        await refresh();
      } catch (e) {
        console.error(e);
      }
    },
    [talentUuid, refresh],
  );

  return {
    dismissedIds: state.data?.dismissedIds ?? [],
    permanentlyHiddenIds: state.data?.permanentlyHiddenIds ?? [],
    loading: state.loading,
    error: state.error,
    refresh,
    addDismissedId,
    addPermanentlyHiddenId,
  };
}
