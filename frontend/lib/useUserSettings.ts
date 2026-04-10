"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "./supabase";

export interface SavedSubtitleStyle {
  language?: "en" | "id";
  font?: string;
  bold?: boolean;
  italic?: boolean;
  textCase?: "none" | "uppercase" | "lowercase";
  letterSpacing?: number;
  alignment?: "left" | "center" | "right";
  fontSize?: number;
  marginV?: number;
  textColor?: string;
  hasOutline?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  hasShadow?: boolean;
  shadowSize?: number;
  shadowX?: number;
  shadowY?: number;
  shadowColor?: string;
  hasBg?: boolean;
  bgColor?: string;
  bgOpacity?: number;
}

export interface SavedProcessingSettings {
  contentType?: "retail" | "podcast";
  whisperVocab?: string;
}

interface UserSettingsRow {
  subtitle_style?: SavedSubtitleStyle | null;
  content_type?: "retail" | "podcast" | null;
  whisper_vocab?: string | null;
}

export function useUserSettings() {
  const [subtitleStyle, setSubtitleStyle] = useState<SavedSubtitleStyle | null>(null);
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
        .select("subtitle_style, content_type, whisper_vocab")
        .eq("user_id", user.id)
        .maybeSingle();

      const row = data as UserSettingsRow | null;

      if (row?.subtitle_style && Object.keys(row.subtitle_style).length > 0) {
        setSubtitleStyle(row.subtitle_style);
      }
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

  const saveSubtitleStyle = useCallback(async (style: SavedSubtitleStyle) => {
    setSaving(true);
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;

      await sb.from("user_settings").upsert(
        { user_id: user.id, subtitle_style: style },
        { onConflict: "user_id" }
      );
      setSubtitleStyle(style);
    } finally {
      setSaving(false);
    }
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
    subtitleStyle,
    processingSettings,
    saveSubtitleStyle,
    saveProcessingSettings,
    saving,
    loaded,
  };
}
