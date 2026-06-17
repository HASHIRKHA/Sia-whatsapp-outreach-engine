'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { DashLayout } from '@/components/DashLayout';
import { apiFetch } from '@/lib/api';
import type { OverviewResponse } from '@/types/api';

const fetcher = (url: string) => apiFetch<OverviewResponse>(url);
type Period = '7d' | '14d' | '30d';

const IcMessages = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcReply = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
  </svg>
);
const IcFire = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 0 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);
const IcSessions = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/>
  </svg>
);

function GlassTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(12,12,12,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 14px', backdropFilter: 'blur(12px)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#25d366' }}>{payload[0]?.value ?? 0}</div>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, color, animClass }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string; animClass: string }) {
  return (
    <div className={`glass ${animClass}`} style={{ borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: `${color}08`, filter: 'blur(14px)' }} />
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}12`, border: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: 18 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.8px', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading, mutate } = useSWR<OverviewResponse>('/analytics/overview', fetcher, { refreshInterval: 30000 });
  const [period, setPeriod] = useState<Period>('7d');

  const periodDays = period === '7d' ? 7 : period === '14d' ? 14 : 30;
  const daily = data?.dailyMessages ?? [];
  const sliced = daily.slice(-periodDays);
  const totalMsgs = sliced.reduce((s, d) => s + d.count, 0);
  const sessions = data?.sessionPool ?? [];

  const totalSent = data?.totalSent ?? 0;
  const totalDelivered = data?.totalDelivered ?? 0;
  const totalRead = data?.totalRead ?? 0;
  const totalReplied = Math.round(totalSent * ((data?.replyRate ?? 0) / 100));

  const funnelData = [
    { label: 'Sent (all-time)', value: totalSent, color: '#60a5fa', est: false },
    { label: 'Delivered', value: totalDelivered, color: '#25d366', est: false },
    { label: 'Read', value: totalRead, color: '#4ade80', est: false },
    { label: 'Replied', value: totalReplied, color: '#86efac', est: false },
  ];

  if (isLoading) {
    return (
      <DashLayout title="Analytics" onRefresh={() => mutate()}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 14 }} />)}
        </div>
        <div className="skeleton" style={{ height: 240, borderRadius: 14, marginBottom: 18 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />
      </DashLayout>
    );
  }

  return (
    <DashLayout title="Analytics" onRefresh={() => mutate()}>
      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        <MetricCard icon={<IcMessages />} label="Messages today" value={(data?.messagesToday ?? 0).toLocaleString()} color="#60a5fa" animClass="anim-1" />
        <MetricCard icon={<IcReply />} label="Reply rate" value={`${data?.replyRate ?? 0}%`} color="#a78bfa" animClass="anim-2" />
        <MetricCard icon={<IcFire />} label="Hot replies" value={data?.hotReplies ?? 0} color="#25d366" animClass="anim-3" />
        <MetricCard icon={<IcSessions />} label="Active sessions" value={data?.activeSessions ?? 0} sub="sending now" color="#f59e0b" animClass="anim-4" />
      </div>

      {/* Volume chart */}
      <div className="glass anim-5" style={{ borderRadius: 14, padding: '20px 22px', marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Message Volume</div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px' }}>{totalMsgs.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>in last {periodDays} days</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['7d', '14d', '30d'] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                background: period === p ? 'rgba(37,211,102,0.15)' : 'rgba(255,255,255,0.04)',
                color: period === p ? '#25d366' : 'var(--text-muted)',
                border: period === p ? '1px solid rgba(37,211,102,0.2)' : '1px solid rgba(255,255,255,0.05)',
                borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: period === p ? 500 : 400,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}>{p}</button>
            ))}
          </div>
        </div>
        {sliced.length === 0 ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sliced} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="date" tick={{ fill: '#444', fontSize: 9 }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(37,211,102,0.04)' }}/>
              <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={28}>
                {sliced.map((_, i) => <Cell key={i} fill={i === sliced.length - 1 ? '#25d366' : 'rgba(37,211,102,0.35)'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Funnel */}
        <div className="glass anim-6" style={{ borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Delivery Funnel</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 20 }}>All-time delivery funnel — real data from WhatsApp receipts.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {funnelData.map((f) => {
              const pct = totalSent > 0 ? (f.value / totalSent) * 100 : 0;
              return (
                <div key={f.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
                    <span>{f.label}</span>
                    <span style={{ color: f.color, fontWeight: 500 }}>{f.value.toLocaleString()} · {pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: f.color, borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session perf */}
        <div className="glass" style={{ borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 20 }}>Session Performance</div>
          {sessions.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>No sessions</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(sessions.length * 44, 120)}>
              <BarChart layout="vertical" data={sessions} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis type="number" tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="label" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} width={80}/>
                <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(37,211,102,0.04)' }}/>
                <Bar dataKey="dailySent" fill="#25d366" radius={[0, 3, 3, 0]} maxBarSize={20} name="Sent today"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </DashLayout>
  );
}
