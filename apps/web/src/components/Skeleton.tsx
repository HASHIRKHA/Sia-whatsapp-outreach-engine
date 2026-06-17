import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, style }: SkeletonProps) {
  return (
    <span
      className="skeleton"
      style={{ display: 'block', width, height, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRows({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 12,
        padding: 18,
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <Skeleton height={20} width="60%" />
      <Skeleton height={36} width="40%" />
      <Skeleton height={14} width="80%" />
    </div>
  );
}
