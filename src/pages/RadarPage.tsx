// src/pages/RadarPage.tsx
// Community Scam Radar: DEMO-labelled KPIs, weekly-by-type bar chart, 8-week
// trend line, 13 states + 3 federal territories, and trending scams.
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, AlertOctagon, Flame, MapPinned, Radar as RadarIcon, TrendingUp } from 'lucide-react';
import type { RadarData } from '../types';
import radarData from '../data/radarSample.json';
import { useI18n } from '../context/I18nProvider';
import { DemoBadge, Icon, PageHero } from '../components/common';

const data = radarData as RadarData;
const KPI_TONES = ['from-blue-600 to-indigo-700', 'from-fuchsia-600 to-purple-700', 'from-orange-500 to-rose-600', 'from-teal-500 to-cyan-700'];
const KPI_ICONS = [Activity, AlertOctagon, Flame, MapPinned];

export function RadarPage() {
  const { language } = useI18n();
  const L = (ms: string, en: string) => (language === 'en' ? en : ms);
  const maxState = Math.max(...data.states.map((s) => s.count), 1);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <PageHero icon={RadarIcon} tone="cyan" title={L('Radar Penipuan Komuniti', 'Community Scam Radar')} subtitle={data.updatedLabel}>
        <DemoBadge srDescription={data.updatedLabel} className="border-white/40 bg-white/20 text-white" />
      </PageHero>

      {/* KPIs */}
      <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.kpis.map((k, i) => (
          <div key={k.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${KPI_TONES[i % KPI_TONES.length]} p-4 text-white shadow-lift transition-transform hover:-translate-y-1`}>
            <Icon icon={KPI_ICONS[i % KPI_ICONS.length]} size={72} className="absolute -bottom-4 -right-4 text-white/15" />
            <Icon icon={KPI_ICONS[i % KPI_ICONS.length]} size={20} className="text-white/90" />
            <p className="mt-2 text-sm text-white/85">{k.label}</p>
            <p className="mt-0.5 text-2xl font-extrabold tracking-tight">{k.value}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="min-w-0 card p-4">
          <h2 className="text-lg font-semibold text-navy">{L('Laporan minggu ini mengikut jenis', 'This week by scam type')}</h2>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyByType} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="type" width={130} tick={{ fontSize: 12 }} />
                <Tooltip />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
                <Bar dataKey="count" fill="url(#barGrad)" radius={[0, 8, 8, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="min-w-0 card p-4">
          <h2 className="text-lg font-semibold text-navy">{L('Trend 8 minggu', '8-week trend')}</h2>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend8w}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#0891B2" strokeWidth={3} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* States */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-navy">{L('Negeri & Wilayah Persekutuan', 'States & Federal Territories')}</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {data.states.map((s) => {
            const pct = s.count / maxState;
            const tone = pct > 0.66 ? 'border-risk-scam/50 bg-risk-scam/10' : pct > 0.33 ? 'border-risk-suspicious/50 bg-risk-suspicious/10' : 'border-risk-safe/50 bg-risk-safe/10';
            return (
              <li key={s.name} className={`rounded-card border p-3 ${tone}`}>
                <p className="text-sm font-medium text-navy">
                  {s.name}
                  {s.isFederalTerritory ? <span className="ml-1 text-xs text-navy-mid">(WP)</span> : null}
                </p>
                <p className="text-lg font-bold text-navy">{s.count}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Trending */}
      <section className="mt-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
          <Icon icon={TrendingUp} /> {L('Sedang tular', 'Trending now')}
        </h2>
        <ul className="mt-3 space-y-2">
          {data.trendingNow.map((tr) => (
            <li key={tr.title} className="card p-3">
              <p className="font-medium text-navy">{tr.title}</p>
              <p className="text-sm text-navy-mid">{tr.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default RadarPage;


