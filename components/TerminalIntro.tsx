"use client";

import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/contexts/LanguageContext";

// 프론트 기술 먼저, 백엔드 기술은 뒤로
const TECHS = ["React.js", "Vue.js", "JavaScript", "TypeScript", "Next.js", "Nuxt.js", "React Native", "PHP Laravel", "Node.js"];

export default function TerminalIntro() {
  const { t, locale } = useLang();

  const phrases = useMemo(() => {
    const lead = locale === "ko" ? "저는 프론트엔드 개발자입니다." : "I'm a frontend developer.";
    const rest = TECHS.map((tech) => (locale === "ko" ? `저는 ${tech} 개발자입니다.` : `I'm a ${tech} developer.`));
    return [lead, ...rest];
  }, [locale]);

  const [idx, setIdx] = useState(0);
  const [sub, setSub] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[idx % phrases.length];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && sub === current) {
      timeout = setTimeout(() => setDeleting(true), 1600); // 완성 후 잠시 멈춤
    } else if (deleting && sub === "") {
      setDeleting(false);
      setIdx((i) => (i + 1) % phrases.length);
    } else {
      timeout = setTimeout(() => {
        setSub((s) => (deleting ? current.slice(0, s.length - 1) : current.slice(0, s.length + 1)));
      }, deleting ? 40 : 80);
    }
    return () => clearTimeout(timeout);
  }, [sub, deleting, idx, phrases]);

  const greeting = locale === "ko" ? "안녕하세요, 저는" : "Hi, I'm";
  const suffix = locale === "ko" ? "입니다." : ".";

  return (
    <div className="font-code text-left bg-[#0d0d14]/80 border border-white/10 rounded-xl p-5 md:p-7 max-w-2xl mx-auto shadow-2xl backdrop-blur-sm">
      {/* 터미널 헤더 */}
      <div className="flex items-center gap-1.5 mb-5">
        <span className="w-3 h-3 rounded-full bg-rose-500/80" />
        <span className="w-3 h-3 rounded-full bg-amber-500/80" />
        <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
        <span className="ml-2 text-[11px] text-gray-600">{t.hero.name} — portfolio</span>
      </div>

      {/* whoami */}
      <p className="text-xs md:text-sm text-gray-500">
        <span className="text-emerald-400">$</span> whoami
      </p>
      <p className="text-xl md:text-3xl text-gray-200 mt-1.5 mb-5 leading-snug">
        {greeting} <span className="gradient-text font-bold">{t.hero.name}</span>
        {suffix}
      </p>

      {/* 순환 타이핑 라인 */}
      <p className="text-base md:text-2xl text-gray-300 min-h-[1.6em]">
        <span className="text-emerald-400">$</span>{" "}
        <span>{sub}</span>
        <span className="inline-block w-[3px] md:w-[4px] h-[1.1em] -mb-[0.15em] ml-0.5 bg-cyan-400 animate-caret" />
      </p>
    </div>
  );
}
