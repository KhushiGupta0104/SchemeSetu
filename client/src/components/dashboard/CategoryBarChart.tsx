import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Datum {
  label: string;
  count: number;
}

/**
 * Single-series horizontal bar chart (magnitude by category): one hue, no legend,
 * recessive axes, hover tooltip, plus a visually hidden table for screen readers.
 */
export function CategoryBarChart({ data, title, unit }: { data: Datum[]; title: string; unit: string }) {
  const height = Math.max(160, data.length * 34 + 16);
  return (
    <figure>
      <div style={{ height }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }} barCategoryGap={8}>
            <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" width={150} tick={{ fill: '#334155', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(8,127,140,0.06)' }}
              formatter={(v) => [`${v} ${unit}`, '']}
              separator=""
              contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 8px 24px -12px rgba(15,23,42,.25)', fontSize: 13 }}
              labelStyle={{ color: '#0F172A', fontWeight: 600 }}
            />
            <Bar dataKey="count" fill="#087F8C" radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
