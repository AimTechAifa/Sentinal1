"use client";

import { motion } from "framer-motion";
import { MagicCard } from "@/components/ui/magic-card";
import { DotPattern } from "@/components/ui/dot-pattern";
import { Database, GitBranch, LayoutDashboard, MessageSquare, Plug, Sparkles } from "lucide-react";

const nodes = [
  { label: "Connectors", icon: Plug, color: "from-slate-500 to-gray-600" },
  { label: "Release Record", icon: Database, color: "from-brand-500 to-indigo-600" },
  { label: "13 AI Agents", icon: Sparkles, color: "from-brand-400 to-blue-500" },
  { label: "Dashboard & Chat", icon: LayoutDashboard, color: "from-cyan-500 to-teal-500" },
];

export function ArchitectureDiagram() {
  return (
    <MagicCard gradient="from-gray-200 via-brand-50 to-brand-100" className="mb-2">
      <div className="relative p-6 overflow-hidden">
        <DotPattern opacity={0.3} />
        <h3 className="relative font-semibold text-gray-800 mb-5 text-sm flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-brand-500" /> Agent architecture
        </h3>
        <div className="relative flex flex-col md:flex-row items-center justify-center gap-3 md:gap-2">
          {nodes.map((node, i) => (
            <div key={node.label} className="flex items-center gap-2 md:gap-2">
              <motion.div
                className={`flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br ${node.color} text-white shadow-md text-xs font-semibold`}
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 3 + i * 0.5, delay: i * 0.2 }}
              >
                <node.icon className="w-4 h-4 shrink-0" />
                {node.label}
              </motion.div>
              {i < nodes.length - 1 && (
                <motion.span
                  className="hidden md:inline text-brand-400 text-lg"
                  animate={{ opacity: [0.3, 1, 0.3], x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
                >
                  →
                </motion.span>
              )}
            </div>
          ))}
        </div>
        <p className="relative text-center text-xs text-gray-500 mt-5 flex items-center justify-center gap-1">
          <MessageSquare className="w-3 h-3" /> Agents read and annotate only — never act directly on systems
        </p>
      </div>
    </MagicCard>
  );
}
