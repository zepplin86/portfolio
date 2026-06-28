"use client";

import { motion } from "framer-motion";
import { Mail, ArrowDown } from "lucide-react";
import { GithubIcon } from "./icons";
import { useLang } from "@/contexts/LanguageContext";
import TerminalIntro from "./TerminalIntro";

export default function Hero() {
  const { t } = useLang();

  return (
    <section
      id="about"
      className="min-h-screen flex flex-col items-center justify-center relative px-6 overflow-hidden"
    >
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <TerminalIntro />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12"
        >
          {t.hero.bio}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center gap-4 mb-16"
        >
          <a
            href="#projects"
            className="px-8 py-3 rounded-full gradient-bg text-white font-medium hover:opacity-90 transition-opacity"
          >
            {t.hero.viewProjects}
          </a>
          <a
            href="#contact"
            className="px-8 py-3 rounded-full border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
          >
            {t.hero.getInTouch}
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center justify-center gap-6"
        >
          <a
            href="https://github.com/zepplin86"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-white transition-colors"
          >
            <GithubIcon size={22} />
          </a>
          <a
            href="mailto:zepplin86@naver.com"
            className="text-gray-500 hover:text-white transition-colors"
          >
            <Mail size={22} />
          </a>
        </motion.div>
      </div>

      <motion.a
        href="#skills"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-10 text-gray-600 hover:text-gray-400 transition-colors animate-bounce"
      >
        <ArrowDown size={20} />
      </motion.a>
    </section>
  );
}
