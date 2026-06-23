"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { SectionTitle } from "./Skills";
import { useLang } from "@/contexts/LanguageContext";

const projectMeta = [
  {
    live: null,
    gradient: "from-purple-600/20 to-blue-600/20",
    accent: "border-purple-500/30",
  },
  {
    live: null,
    gradient: "from-cyan-600/20 to-emerald-600/20",
    accent: "border-cyan-500/30",
  },
  {
    live: null,
    gradient: "from-emerald-600/20 to-yellow-600/20",
    accent: "border-emerald-500/30",
  },
  {
    live: null,
    gradient: "from-blue-600/20 to-purple-600/20",
    accent: "border-blue-500/30",
  },
  {
    live: null,
    gradient: "from-orange-600/20 to-rose-600/20",
    accent: "border-orange-500/30",
  },
];

export default function Projects() {
  const { t, locale } = useLang();

  return (
    <section id="projects" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label={t.projects.label} title={t.projects.title} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {t.projects.items.map((project, i) => {
            const meta = projectMeta[i];
            return (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`card border ${meta.accent} p-6 flex flex-col gap-4 bg-gradient-to-br ${meta.gradient} hover:scale-[1.02] transition-transform duration-300`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-white leading-snug">{project.title}</h3>
                  {meta.live && (
                    <a
                      href={meta.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-white transition-colors shrink-0 ml-2"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>

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
      </div>
    </section>
  );
}
