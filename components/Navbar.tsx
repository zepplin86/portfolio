"use client";

import { useState, useEffect, useRef } from "react";
import { useLang } from "@/contexts/LanguageContext";
import type { Locale } from "@/lib/translations";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
];

export default function Navbar() {
  const { t, locale, setLocale } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: t.nav.about, href: "/" },
    { label: t.nav.skills, href: "/#skills" },
    { label: t.nav.experience, href: "/career" },
    { label: t.nav.projects, href: "/projects" },
    { label: t.nav.contact, href: "/#contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
        <div className="flex-1 flex items-center">
          <a href="/" className="gradient-text font-bold text-xl tracking-wider">JY.</a>
        </div>

        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex-1 flex items-center justify-end gap-3">
        <div className="hidden md:flex items-center gap-3">
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-white/15 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
            >
              {LOCALES.find((l) => l.value === locale)?.label}
              <svg className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-28 rounded-lg bg-[#1a1a26] border border-white/10 shadow-xl overflow-hidden">
                {LOCALES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => { setLocale(l.value); setLangOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                      locale === l.value
                        ? "text-white bg-white/8"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <a
            href="/#contact"
            className="text-sm px-4 py-2 rounded-full gradient-bg text-white font-medium hover:opacity-90 transition-opacity"
          >
            {t.nav.cta}
          </a>
        </div>

        <div className="md:hidden flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-white/15 text-gray-400 hover:text-white transition-colors"
            >
              {LOCALES.find((l) => l.value === locale)?.label}
              <svg className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-28 rounded-lg bg-[#1a1a26] border border-white/10 shadow-xl overflow-hidden z-50">
                {LOCALES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => { setLocale(l.value); setLangOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                      locale === l.value
                        ? "text-white bg-white/8"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={`block h-0.5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
              <span className={`block h-0.5 bg-current transition-all ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
            </div>
          </button>
        </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#12121a] border-t border-white/5 px-6 py-4">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
