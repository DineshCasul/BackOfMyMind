"use client";

import { useDreams } from "@/context/DreamContext";
import Layout from "@/components/Layout";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsPage() {
  const { dreams } = useDreams();

  const dreamsPerDate = useMemo(() => {
    const counts: Record<string, number> = {};
    dreams.forEach((dream) => {
      counts[dream.date] = (counts[dream.date] || 0) + 1;
    });

    // Transform into array for recharts
    return Object.entries(counts).map(([date, count]) => ({
      date,
      count,
    }));
  }, [dreams]);

  return (
    <Layout>
      <h2 className="text-2xl font-semibold mb-4">📊 Analytics</h2>

      <div className="mb-6">
        <p>Total Dreams Recorded: <span className="font-bold">{dreams.length}</span></p>
      </div>

      {dreamsPerDate.length === 0 ? (
        <p className="text-gray-500">No dreams yet to show graph.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dreamsPerDate} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Layout>
  );
}
