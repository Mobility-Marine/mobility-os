"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { es } from "./translations/es";
import { en } from "./translations/en";

export type Language = "es" | "en";

const TRANSLATIONS = { es, en };

const SETTING_KEY = "language";

let cachedLang: Language | null = null;
const listeners: Set<(lang: Language) => void> = new Set();

function notify(lang: Language) {
  cachedLang = lang;
  listeners.forEach((fn) => fn(lang));
}

export async function setLanguage(lang: Language, userId: string) {
  notify(lang);
  await supabase.from("user_settings").upsert({
    user_id:    userId,
    key:        SETTING_KEY,
    value:      lang,
    updated_at: new Date().toISOString(),
  } as any);
}

export async function loadLanguage(userId: string): Promise<Language> {
  if (cachedLang) return cachedLang;
  const { data } = await supabase
    .from("user_settings")
    .select("value")
    .eq("user_id", userId)
    .eq("key", SETTING_KEY)
    .maybeSingle() as any;
  const lang: Language = (data?.value === "en" ? "en" : "es");
  cachedLang = lang;
  return lang;
}

export function useTranslation() {
  const { user } = useAuth();
  const [lang, setLang] = useState<Language>(cachedLang ?? "es");

  useEffect(() => {
    if (!user) return;
    void loadLanguage(user.id).then(setLang);
    listeners.add(setLang);
    return () => { listeners.delete(setLang); };
  }, [user]);

  async function changeLanguage(next: Language) {
    if (!user) return;
    await setLanguage(next, user.id);
  }

  return {
    t:    TRANSLATIONS[lang],
    lang,
    changeLanguage,
  };
}
