"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { GithubIcon } from "./icons";
import { SectionTitle } from "./Skills";
import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";

export default function Contact() {
  const { t } = useLang();
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up EmailJS or Resend
    setSent(true);
  };

  return (
    <section id="contact" className="py-24 px-6 bg-[#0d0d14]">
      <div className="max-w-4xl mx-auto">
        <SectionTitle label={t.contact.label} title={t.contact.title} />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-gray-400 mt-6 mb-16"
        >
          {t.contact.subtitle}
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            <h3 className="text-xl font-semibold text-white">{t.contact.infoTitle}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t.contact.infoBody}</p>

            <div className="flex flex-col gap-4">
              <a
                href="mailto:zepplin86@naver.com"
                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
              >
                <span className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-600/20 transition-colors">
                  <Mail size={18} />
                </span>
                <span className="text-sm">zepplin86@naver.com</span>
              </a>

              <a
                href="https://github.com/zepplin86"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
              >
                <span className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-600/20 transition-colors">
                  <GithubIcon size={18} />
                </span>
                <span className="text-sm">github.com/zepplin86</span>
              </a>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            {sent ? (
              <div className="card p-8 text-center">
                <p className="text-2xl mb-2">✓</p>
                <p className="text-white font-semibold">{t.contact.sentTitle}</p>
                <p className="text-gray-400 text-sm mt-2">{t.contact.sentBody}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">{t.contact.nameLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder={t.contact.namePlaceholder}
                    className="bg-[#12121a] border border-white/8 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/60 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">{t.contact.emailLabel}</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    className="bg-[#12121a] border border-white/8 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/60 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">{t.contact.messageLabel}</label>
                  <textarea
                    required
                    rows={5}
                    placeholder={t.contact.messagePlaceholder}
                    className="bg-[#12121a] border border-white/8 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/60 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="gradient-bg text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity mt-2"
                >
                  {t.contact.send}
                </button>
              </>
            )}
          </motion.form>
        </div>
      </div>
    </section>
  );
}
