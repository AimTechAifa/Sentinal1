"use client";

import { motion } from "framer-motion";
import { readinessColor } from "@/lib/palette";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function ReadinessGauge({ value, size = 160 }: { value: number; size?: number }) {
  const color = readinessColor(value);
  const data = [{ value }, { value: 100 - value }];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-50/50 to-brand-25/50 blur-sm" />
      <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={size * 0.35} outerRadius={size * 0.45} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
            <Cell fill={color} />
            <Cell fill="#E2E8F0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-gray-800 font-mono text-[10px] uppercase tracking-wider"
        >
          {value}%
        </motion.span>
        <span className="text-xs text-gray-500">Ready</span>
      </div>
    </motion.div>
  );
}
