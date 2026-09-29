import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  light?: boolean;
}

export default function Logo({ size = 'md', light = false }: LogoProps) {
  const sizeMap = {
    sm: '1.1rem',
    md: '1.5rem',
    lg: '2.5rem',
    xl: '3.5rem',
  };

  return (
    <span style={{ 
      fontSize: sizeMap[size], 
      fontWeight: 900, 
      letterSpacing: '-0.02em', 
      color: light ? 'white' : 'var(--text-primary)',
      display: 'inline-flex',
      alignItems: 'baseline'
    }}>
      Stay<span style={{ color: 'var(--brand-500)' }}>Buddy</span>
    </span>
  );
}
