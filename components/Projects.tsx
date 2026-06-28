"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Link from "next/link";
import { SectionTitle } from "./Skills";
import { useLang } from "@/contexts/LanguageContext";
import { companyOf, COMPANY_LABELS, type CompanyKey } from "@/lib/careerData";

const FILTER_COMPANIES: CompanyKey[] = ["catenoid", "karoom", "bobmc"];

// 카드 색상 (표시 순서 기준)
const cardStyles = [
  { gradient: "from-purple-600/20 to-blue-600/20", accent: "border-purple-500/30" },
  { gradient: "from-cyan-600/20 to-emerald-600/20", accent: "border-cyan-500/30" },
  { gradient: "from-emerald-600/20 to-yellow-600/20", accent: "border-emerald-500/30" },
  { gradient: "from-blue-600/20 to-purple-600/20", accent: "border-blue-500/30" },
  { gradient: "from-orange-600/20 to-rose-600/20", accent: "border-orange-500/30" },
  { gradient: "from-yellow-600/20 to-green-600/20", accent: "border-yellow-500/30" },
  { gradient: "from-green-600/20 to-cyan-600/20", accent: "border-green-500/30" },
  { gradient: "from-rose-600/20 to-purple-600/20", accent: "border-rose-500/30" },
  { gradient: "from-sky-600/20 to-indigo-600/20", accent: "border-sky-500/30" },
  { gradient: "from-pink-600/20 to-rose-600/20", accent: "border-pink-500/30" },
  { gradient: "from-indigo-600/20 to-cyan-600/20", accent: "border-indigo-500/30" },
  { gradient: "from-teal-600/20 to-emerald-600/20", accent: "border-teal-500/30" },
];

// 임팩트 순위 / 대표 지정 — translations 의 items 원본 인덱스 기준 (EN·KO 동일 순서)
// 0 bobmc-crm, 1 karoom-pdf, 2 payment, 3 google-i18n, 4 category-tree,
// 5 docker-env, 6 file-live, 7 cicd, 8 nginx-cache
// 순위: 1 nginx-cache, 2 category-tree, 3 payment, 4 cicd, 5 docker-env, 6 google-i18n, 7 file-live, 8 bobmc-crm, 9 karoom-pdf
const IMPACT = [8, 9, 3, 6, 2, 5, 7, 4, 1];
const FEATURED = new Set([2, 4, 7, 8]);

export default function Projects({
  featured = false,
  viewAllHref,
  companyFilter,
}: {
  featured?: boolean;
  viewAllHref?: string;
  companyFilter?: string;
}) {
  const { t, locale } = useLang();

  // 원본 인덱스 보존 → 임팩트순 정렬 → (featured면) 대표만 → (companyFilter면) 해당 회사만
  const ordered = t.projects.items
    .map((project, idx) => ({ project, idx, impact: IMPACT[idx] ?? 99, isFeatured: FEATURED.has(idx) }))
    .filter((p) => (featured ? p.isFeatured : true))
    .filter((p) => (!featured && companyFilter ? companyOf(p.project.detailLink) === companyFilter : true))
    .sort((a, b) => a.impact - b.impact);

  const showCompany = !featured; // 전체 목록에서만 회사 라벨/필터 노출

  return (
    <section id="projects" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label={t.projects.label} title={t.projects.title} />

        {/* 회사별 필터 칩 (전체 목록에서만) */}
        {showCompany && (
          <div className="flex flex-wrap items-center gap-2 mt-10">
            <FilterChip href="/projects" active={!companyFilter} label={locale === "ko" ? "전체" : "All"} />
            {FILTER_COMPANIES.map((c) => (
              <FilterChip
                key={c}
                href={`/projects?company=${c}`}
                active={companyFilter === c}
                label={COMPANY_LABELS[locale][c]}
              />
            ))}
          </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${showCompany ? "mt-8" : "mt-16"}`}>
          {ordered.map(({ project, impact }, i) => {
            const style = cardStyles[i % cardStyles.length];
            const ck = showCompany ? companyOf(project.detailLink) : null;
            const stars = impact <= 3 ? 3 : impact <= 6 ? 2 : 1; // 임팩트 구간 → 별 개수
            return (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.1 }}
                className={`card border ${style.accent} p-6 flex flex-col gap-4 bg-gradient-to-br ${style.gradient} hover:scale-[1.02] transition-transform duration-300`}
              >
                {showCompany && (
                  <div className="flex items-center justify-between gap-2">
                    {ck ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                        {COMPANY_LABELS[locale][ck]}
                      </span>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-0.5" title={`임팩트 ${stars}/3`}>
                      {Array.from({ length: stars }).map((_, s) => (
                        <Star key={s} size={14} className="fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-bold text-white leading-snug">{project.title}</h3>

                <p className="text-sm text-gray-400 leading-relaxed flex-1">{project.description}</p>

                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech) => (
                    <span key={tech} className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">
                      {tech}
                    </span>
                  ))}
                </div>

                {project.detailLink && (
                  <Link
                    href={project.detailLink}
                    className="mt-auto text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 group"
                  >
                    {locale === "ko" ? "자세히 보기" : "View Details"}
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>

        {ordered.length === 0 && (
          <p className="text-sm text-gray-600 text-center py-12">
            {locale === "ko" ? "해당 회사의 프로젝트가 없습니다." : "No projects for this company."}
          </p>
        )}

        {viewAllHref && (
          <div className="mt-12 flex justify-center">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-white/15 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-colors group"
            >
              {locale === "ko" ? "전체 프로젝트 보기" : "View all projects"}
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "border-purple-500/60 bg-purple-500/15 text-purple-200"
          : "border-white/10 text-gray-400 hover:border-white/25 hover:text-gray-200"
      }`}
    >
      {label}
    </Link>
  );
}
