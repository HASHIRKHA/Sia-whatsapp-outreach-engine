'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { apiFetch } from '@/lib/api';

/* ── SVG icon set ───────────────────────────────────────────── */
const Icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  sessions: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/>
    </svg>
  ),
  campaigns: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  contacts: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  templates: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  ),
  replies: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  analytics: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  search: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  live: (
    <svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor">
      <circle cx="4" cy="4" r="4"/>
    </svg>
  ),
};

const MAIN_NAV = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' as const },
  { href: '/sessions', label: 'Sessions', icon: 'sessions' as const },
  { href: '/campaigns', label: 'Campaigns', icon: 'campaigns' as const },
  { href: '/contacts', label: 'Contacts', icon: 'contacts' as const },
];

const FEATURE_NAV = [
  { href: '/templates', label: 'Templates', icon: 'templates' as const },
  { href: '/replies', label: 'Replies', icon: 'replies' as const },
  { href: '/analytics', label: 'Analytics', icon: 'analytics' as const },
  { href: '/settings', label: 'Settings', icon: 'settings' as const },
];

interface DryRunResponse { dryRun: boolean }

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: dryRunData } = useSWR<DryRunResponse>(
    '/settings/dry-run',
    (url: string) => apiFetch<DryRunResponse>(url),
    { refreshInterval: 30000 },
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setCollapsed(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const dryRun = dryRunData?.dryRun ?? true;
  const width = collapsed ? 60 : 220;

  return (
    <aside
      style={{
        width,
        minWidth: width,
        height: '100vh',
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        padding: collapsed ? '20px 0' : '18px 12px',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 24,
          padding: collapsed ? '0 16px' : '4px 8px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #25d366 0%, #1aad54 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          flexShrink: 0,
          color: '#000',
          boxShadow: '0 2px 12px rgba(37,211,102,0.3)',
        }}>
          N
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>NEXUS</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Outreach Engine</div>
          </div>
        )}
      </div>

      {/* Search bar */}
      {!collapsed && (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            gap: 8,
            marginBottom: 22,
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
        >
          <span style={{ color: 'var(--text-muted)', display: 'flex' }}>{Icons.search}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12, flex: 1 }}>Search...</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 4 }}>⌘K</span>
        </div>
      )}

      {/* Main nav */}
      <NavSection label="MAIN" collapsed={collapsed}>
        {MAIN_NAV.map((item) => (
          <NavItem key={item.href} {...item} active={pathname === item.href} collapsed={collapsed} />
        ))}
      </NavSection>

      <NavSection label="FEATURES" collapsed={collapsed}>
        {FEATURE_NAV.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={pathname.startsWith(item.href)}
            collapsed={collapsed}
          />
        ))}
      </NavSection>

      <div style={{ flex: 1 }} />

      {/* Mode indicator */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${dryRun ? 'rgba(245,158,11,0.2)' : 'rgba(37,211,102,0.15)'}`,
        borderRadius: 8,
        padding: collapsed ? '10px 0' : '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 8,
      }}>
        <span style={{ color: dryRun ? 'var(--warning)' : 'var(--bg-accent)', display: 'flex', flexShrink: 0 }}>{Icons.live}</span>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: dryRun ? 'var(--warning)' : 'var(--bg-accent)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              {dryRun ? 'Dry Run' : 'Live Mode'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
              {dryRun ? 'Logging only' : 'Sending active'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavSection({ label, children, collapsed }: { label: string; children: React.ReactNode; collapsed: boolean }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {!collapsed && (
        <div style={{
          fontSize: 9,
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          padding: '0 8px',
          marginBottom: 4,
        }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{children}</div>
    </div>
  );
}

function NavItem({ href, label, icon, active, collapsed }: {
  href: string; label: string; icon: keyof typeof Icons; active: boolean; collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '9px 0' : '8px 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 7,
        textDecoration: 'none',
        color: active ? '#fff' : 'var(--text-secondary)',
        background: active ? 'rgba(37,211,102,0.1)' : 'transparent',
        border: active ? '1px solid rgba(37,211,102,0.12)' : '1px solid transparent',
        transition: 'all 0.15s',
        fontSize: 13,
        fontWeight: active ? 500 : 400,
      }}
    >
      <span style={{ color: active ? 'var(--bg-accent)' : 'var(--text-muted)', display: 'flex', flexShrink: 0, transition: 'color 0.15s' }}>
        {Icons[icon]}
      </span>
      {!collapsed && label}
    </Link>
  );
}
