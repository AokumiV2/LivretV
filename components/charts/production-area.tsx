"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ProductionAreaChart({ data }: { data: Array<{ date: string; mwh: number; revenueUSD: number }> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="mwh" stackId="1" stroke="#22c55e" fill="#86efac" />
          <Area type="monotone" dataKey="revenueUSD" stackId="2" stroke="#0ea5e9" fill="#7dd3fc" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
