"use client";

import { useLang } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="py-8 px-6 border-t border-white/5 text-center">
      <p className="text-sm text-gray-600">{t.footer}</p>
    </footer>
  );
}
