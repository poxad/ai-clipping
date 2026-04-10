"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "./supabase";

export interface SavedProcessingSettings {
  contentType?: "retail" | "podcast";
  whisperVocab?: string;
}

interface UserSettingsRow {
  content_type?: "retail" | "podcast" | null;
  whisper_vocab?: string | null;
}

export function useUserSettings() {
  const [processingSettings, setProcessingSettings] = useState<SavedProcessingSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    async function load() {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        setLoaded(true);
        return;
      }

      const { data } = await sb.from("user_settings")
        .select("content_type, whisper_vocab")
        .eq("user_id", user.id)
        .maybeSingle();

      const row = data as UserSettingsRow | null;

      if (row?.content_type || row?.whisper_vocab !== undefined) {
        setProcessingSettings({
          contentType: row.content_type ?? undefined,
          whisperVocab: row.whisper_vocab ?? "",
        });
      }
      setLoaded(true);
    }
    void load();
  }, []);

  const saveProcessingSettings = useCallback(async (settings: SavedProcessingSettings) => {
    setSaving(true);
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;

      await sb.from("user_settings").upsert(
        {
          user_id: user.id,
          content_type: settings.contentType,
          whisper_vocab: settings.whisperVocab ?? "",
        },
        { onConflict: "user_id" }
      );
      setProcessingSettings(settings);
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    processingSettings,
    saveProcessingSettings,
    saving,
    loaded,
  };
}
