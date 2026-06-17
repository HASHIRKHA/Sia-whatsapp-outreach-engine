import React from 'react';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, subtitle, action, icon }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        textAlign: 'center',
        gap: 10,
      }}
    >
      {icon && (
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          marginBottom: 4,
        }}>
          {icon}
        </div>
      )}
      {!icon && (
        <div style={{
          width: 40,
          height: 2,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 1,
          marginBottom: 8,
        }} />
      )}
      <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14 }}>{title}</div>
      {subtitle && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: 320, lineHeight: 1.6 }}>{subtitle}</div>
      )}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
