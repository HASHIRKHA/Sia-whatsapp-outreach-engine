import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--bg-accent)',
      color: '#000000',
      border: 'none',
    },
    danger: {
      background: 'transparent',
      color: '#ef4444',
      border: '1px solid #ef4444',
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-subtle)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: 'none',
    },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '4px 12px', fontSize: 12, height: 28 },
    md: { padding: '0 16px', fontSize: 13, height: 36 },
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 8,
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'opacity 0.15s, filter 0.15s',
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
        ...styles[variant],
        ...sizeStyles[size],
        ...style,
      }}
    >
      {loading && (
        <span
          style={{
            width: 14,
            height: 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
          }}
          className="spin"
        />
      )}
      {children}
    </button>
  );
}
