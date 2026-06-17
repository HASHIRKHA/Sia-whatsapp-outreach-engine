import React from 'react';

type BadgeVariant =
  | 'online'
  | 'offline'
  | 'connecting'
  | 'banned'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'replied'
  | 'failed'
  | 'queued'
  | 'draft'
  | 'running'
  | 'paused'
  | 'done'
  | 'hot'
  | 'warm'
  | 'cold'
  | 'negative'
  | 'cloud'
  | 'ws'
  | 'marketing'
  | 'utility'
  | 'auth'
  | 'service';

const STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  online: { bg: '#1a3d28', color: '#25d366' },
  offline: { bg: '#2a2a2a', color: '#666666' },
  connecting: { bg: '#3d3010', color: '#f59e0b' },
  banned: { bg: '#3d1a1a', color: '#ef4444' },
  sent: { bg: '#1a2d3d', color: '#60a5fa' },
  delivered: { bg: '#1a3d2d', color: '#25d366' },
  read: { bg: '#1a3d1a', color: '#4ade80' },
  replied: { bg: '#1a2d1a', color: '#86efac' },
  failed: { bg: '#3d1a1a', color: '#ef4444' },
  queued: { bg: '#2a2a2a', color: '#888888' },
  draft: { bg: '#2a2a2a', color: '#888888' },
  running: { bg: '#1a3d28', color: '#25d366' },
  paused: { bg: '#3d3010', color: '#f59e0b' },
  done: { bg: '#1a2d3d', color: '#60a5fa' },
  hot: { bg: '#1a3d28', color: '#25d366' },
  warm: { bg: '#3d3010', color: '#f59e0b' },
  cold: { bg: '#2a2a2a', color: '#888888' },
  negative: { bg: '#3d1a1a', color: '#ef4444' },
  cloud: { bg: '#1a2d3d', color: '#60a5fa' },
  ws: { bg: '#2a1a3d', color: '#a78bfa' },
  marketing: { bg: '#1a3d28', color: '#25d366' },
  utility: { bg: '#1a2d3d', color: '#60a5fa' },
  auth: { bg: '#3d3010', color: '#f59e0b' },
  service: { bg: '#2a2a2a', color: '#888888' },
};

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export function Badge({ variant, children, dot, size = 'md' }: BadgeProps) {
  const { bg, color } = STYLES[variant] ?? STYLES.offline;
  const px = size === 'sm' ? '6px' : '8px';
  const py = size === 'sm' ? '2px' : '3px';
  const fs = size === 'sm' ? '10px' : '11px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: bg,
        color,
        borderRadius: 20,
        padding: `${py} ${px}`,
        fontSize: fs,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        letterSpacing: '0.2px',
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
            display: 'inline-block',
            flexShrink: 0,
            ...(variant === 'online' ? { animation: 'pulse-green 1.5s ease-in-out infinite' } : {}),
          }}
        />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase() as BadgeVariant;
  const labels: Record<string, string> = {
    online: 'ONLINE',
    offline: 'OFFLINE',
    connecting: 'CONNECTING',
    banned: 'BANNED',
    sent: 'SENT',
    delivered: 'DELIVERED',
    read: 'READ',
    replied: 'REPLIED',
    failed: 'FAILED',
    queued: 'QUEUED',
    draft: 'DRAFT',
    running: 'RUNNING',
    paused: 'PAUSED',
    done: 'DONE',
  };
  return (
    <Badge variant={s} dot={['online', 'connecting'].includes(s)}>
      {labels[s] ?? status.toUpperCase()}
    </Badge>
  );
}
