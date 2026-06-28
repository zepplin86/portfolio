"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SectionTitle } from "./Skills";
import { useLang } from "@/contexts/LanguageContext";

export default function Experience({
  compact = false,
  viewAllHref,
}: {
  compact?: boolean;
  viewAllHref?: string;
}) {
  const { t, locale } = useLang();

  return (
    <section id="experience" className="py-24 px-6 bg-[#0d0d14]">
      <div className="max-w-4xl mx-auto">
        <SectionTitle label={t.experience.label} title={t.experience.title} />

        <div className="mt-16 relative">
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-600 via-cyan-500 to-transparent md:-translate-x-px" />

          <div className={`flex flex-col ${compact ? "gap-6" : "gap-12"}`}>
            {t.experience.items.map((exp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className={`relative pl-8 md:pl-0 md:w-1/2 ${
                  i % 2 === 0 ? "md:pr-12 md:text-right md:self-start" : "md:pl-12 md:ml-auto"
                }`}
              >
                <div
                  className={`absolute top-2 w-3 h-3 rounded-full gradient-bg left-[-5px] md:left-auto ${
                    i % 2 === 0 ? "md:right-[-6px]" : "md:left-[-6px]"
                  }`}
                />

                <div className={`card transition-colors duration-300 ${compact ? "p-4" : "p-6"}`}>
                  <span className="text-xs text-gray-500 font-mono">{exp.period}</span>
                  <h3 className={`font-bold text-white mt-1 ${compact ? "text-base" : "text-lg"}`}>{exp.role}</h3>
                  <p className="text-purple-400 text-sm font-medium mb-2">{exp.company}</p>

                  {exp.summary && (
                    <p className={`text-sm leading-relaxed ${compact ? "text-gray-400" : "text-gray-300 mb-4"}`}>{exp.summary}</p>
                  )}

                  {!compact && (
                    <>
                      <ul className="space-y-2 mb-4">
                        {exp.description.map((item, j) => (
                          <li key={j} className="text-sm text-gray-400 flex gap-2">
                            <span className="text-cyan-500 shrink-0 mt-0.5">▸</span>
                            {item}
                          </li>
                        ))}
                      </ul>

                      <div className={`flex flex-wrap gap-2 ${i % 2 === 0 ? "md:justify-end" : ""}`}>
                        {exp.tech.map((tech) => (
                          <span key={tech} className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {viewAllHref && (
          <div className="mt-12 flex justify-center">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-white/15 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-colors group"
            >
              {locale === "ko" ? "경력 전체 보기" : "View full career"}
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
