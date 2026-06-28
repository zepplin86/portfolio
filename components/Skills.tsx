"use client";

import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";

const skillCategories = [
  {
    title: "Frontend",
    color: "from-purple-500 to-purple-700",
    skills: ["React.js", "React Native", "Vue.js", "Nuxt.js", "Next.js", "JavaScript", "TypeScript", "HTML/CSS"],
  },
  {
    title: "Backend",
    color: "from-cyan-500 to-cyan-700",
    skills: ["PHP Laravel", "PHP CodeIgniter", "Node.js"],
  },
  {
    title: "Database & Cloud",
    color: "from-blue-500 to-blue-700",
    skills: ["MySQL", "MariaDB", "AWS EC2", "AWS RDS", "AWS Route53"],
  },
  {
    title: "Tools & Others",
    color: "from-emerald-500 to-emerald-700",
    skills: ["TensorFlow", "Git", "Docker", "CentOS", "Ubuntu", "jQuery", "Ajax"],
  },
];

export default function Skills() {
  const { t } = useLang();

  return (
    <section id="skills" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label={t.skills.label} title={t.skills.title} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          {skillCategories.map((category, i) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="card p-6 transition-colors duration-300"
            >
              <div className={`inline-block text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${category.color} text-white mb-5`}>
                {category.title}
              </div>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-sm px-3 py-1.5 rounded-md bg-white/5 text-gray-300 hover:bg-white/10 transition-colors cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div className="text-center">
      <p className="text-sm text-gray-500 tracking-widest uppercase mb-3">{label}</p>
      <h2 className="text-4xl md:text-5xl font-bold gradient-text">{title}</h2>
    </div>
  );
}
