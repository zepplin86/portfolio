"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SectionTitle } from "./Skills";
import { useLang } from "@/contexts/LanguageContext";
import { EXPERIENCE_KEYS, COMPANY_PROJECTS, COMPANY_LABELS } from "@/lib/careerData";

export default function CareerDetail() {
  const { t, locale } = useLang();

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionTitle label={t.experience.label} title={t.experience.title} />

        <div className="mt-14 flex flex-col gap-8">
          {t.experience.items.map((exp, i) => {
            const key = EXPERIENCE_KEYS[i];
            const projects = key ? COMPANY_PROJECTS[key] : [];
            const hasDetail = projects.some((p) => p.detailLink);
            const label = key ? COMPANY_LABELS[locale][key] : exp.company;

            return (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="card p-6 md:p-8 flex flex-col lg:flex-row gap-8"
              >
                {/* ── LEFT: 업무 서술 ── */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-500 font-mono">{exp.period}</span>
                  <h3 className="text-xl font-bold text-white mt-1">{exp.role}</h3>
                  <p className="text-purple-400 text-sm font-medium mb-4">{exp.company}</p>

                  {exp.summary && (
                    <p className="text-sm text-gray-300 leading-relaxed mb-3">{exp.summary}</p>
                  )}
                  {exp.approach && (
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">{exp.approach}</p>
                  )}

                  <ul className="space-y-2">
                    {exp.description.map((item, j) => (
                      <li key={j} className="text-sm text-gray-400 flex gap-2">
                        <span className="text-cyan-500 shrink-0 mt-0.5">▸</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {exp.tech.map((tech) => (
                      <span key={tech} className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ── RIGHT: 프로젝트 리스트 ── */}
                <div className="lg:w-72 shrink-0 lg:border-l border-t lg:border-t-0 border-white/10 pt-6 lg:pt-0 lg:pl-8 flex flex-col gap-4">
                  {hasDetail && (
                    <Link
                      href={`/projects?company=${key}`}
                      className="self-start inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-purple-500/40 text-purple-300 hover:bg-purple-500/10 transition-colors group"
                    >
                      {locale === "ko" ? `${label} 프로젝트 모아보기` : `View ${label} projects`}
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </Link>
                  )}

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-2.5">
                      {locale === "ko" ? "주요 프로젝트" : "Projects"}
                    </p>
                    {projects.length === 0 ? (
                      <p className="text-xs text-gray-600">
                        {locale === "ko" ? "등록된 프로젝트가 없습니다" : "No listed projects"}
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-2.5">
                        {projects.map((p) => {
                          const title = locale === "ko" ? p.ko : p.en;
                          return (
                            <li key={p.en} className="flex flex-col gap-0.5">
                              <span className="text-sm text-gray-300 leading-snug">{title}</span>
                              {p.detailLink ? (
                                <Link
                                  href={p.detailLink}
                                  className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1 group w-fit"
                                >
                                  {locale === "ko" ? "상세보기" : "View details"}
                                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                                </Link>
                              ) : (
                                <span className="text-[11px] text-gray-600">
                                  {locale === "ko" ? "상세 페이지 없음" : "No detail page"}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
