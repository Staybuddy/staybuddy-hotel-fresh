'use client';

import React from 'react';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  light?: boolean;
  variant?: 'full' | 'horizontal' | 'icon' | 'app-icon' | 'stacked' | 'minimal';
  showTagline?: boolean;
  taglineText?: string;
  animated?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * StayBuddy Official Vector Icon Emblem
 * Consists of:
 * 1. Warm Gable Roof with Chimney (Home / Stay / Shelter)
 * 2. Precision Location Pin with 'S' Monogram (Destination / Discovery)
 * 3. Welcoming Smile Arc Cradle (Buddy / Hospitality / Trust)
 */
export function StayBuddyIconMark({
  size = 36,
  colorScheme = 'gradient',
  className = '',
}: {
  size?: number;
  colorScheme?: 'gradient' | 'white' | 'orange' | 'dark';
  className?: string;
}) {
  const gradientId = React.useId();
  const shadowId = React.useId();

  const isWhite = colorScheme === 'white';
  const isDark = colorScheme === 'dark';

  const primaryFill = isWhite
    ? '#ffffff'
    : isDark
    ? '#0f172a'
    : `url(#${gradientId}-orange)`;

  const pinFill = isWhite
    ? '#ffffff'
    : isDark
    ? '#0f172a'
    : `url(#${gradientId}-pin)`;

  const innerTextFill = isWhite ? '#ea580c' : '#ffffff';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="StayBuddy Logo Mark"
    >
      <defs>
        {/* Vibrant Sunset Orange Gradient */}
        <linearGradient id={`${gradientId}-orange`} x1="10" y1="15" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        {/* Pin Accent Gradient */}
        <linearGradient id={`${gradientId}-pin`} x1="30" y1="30" x2="70" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff7828" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>

        {/* Soft Drop Shadow */}
        <filter id={`${shadowId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#f97316" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Group with slight glow */}
      <g filter={colorScheme === 'gradient' ? `url(#${shadowId}-glow)` : undefined}>
        {/* Chimney */}
        <path
          d="M68 28.5V20C68 18.9 68.9 18 70 18H74C75.1 18 76 18.9 76 20V36.5"
          stroke={primaryFill}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Modern Roof Peak (Stay / Home) */}
        <path
          d="M17 48L46.8 20.8C48.6 19.2 51.4 19.2 53.2 20.8L83 48"
          stroke={primaryFill}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Location Pin (Destination) with 'S' monogram */}
        <g>
          {/* Pin Body */}
          <path
            d="M50 33C42.8 33 37 38.8 37 46C37 54.5 48.2 66.2 49.2 67.2C49.6 67.7 50.4 67.7 50.8 67.2C51.8 66.2 63 54.5 63 46C63 38.8 57.2 33 50 33Z"
            fill={pinFill}
          />

          {/* Letter 'S' Monogram inside Pin */}
          <text
            x="50"
            y="49.5"
            textAnchor="middle"
            fill={innerTextFill}
            fontSize="11.5"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            letterSpacing="-0.5px"
          >
            S
          </text>
        </g>

        {/* Friendly Hospitality Smile Arc Cradle (Buddy) */}
        <path
          d="M23 58C25 72.5 36.5 83 50 83C63.5 83 75 72.5 77 58"
          stroke={primaryFill}
          strokeWidth="6.5"
          strokeLinecap="round"
        />

        {/* Left Cheek Dimple Dot */}
        <circle cx="21.5" cy="53.5" r="3.2" fill={primaryFill} />

        {/* Right Cheek Dimple Dot */}
        <circle cx="78.5" cy="53.5" r="3.2" fill={primaryFill} />
      </g>
    </svg>
  );
}

/**
 * StayBuddy Official App Icon (Squircle Badge)
 */
export function StayBuddyAppIcon({
  size = 64,
  rounded = 16,
  className = '',
}: {
  size?: number;
  rounded?: number;
  className?: string;
}) {
  const gradId = React.useId();
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        background: `linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px -4px rgba(249, 115, 22, 0.4), 0 2px 6px rgba(0, 0, 0, 0.08)',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top subtle highlight gleam */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '45%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 100%)',
          pointerEvents: 'none',
        }}
      />
      <StayBuddyIconMark size={size * 0.76} colorScheme="white" />
    </div>
  );
}

/**
 * Main Flexible StayBuddy Logo Component
 */
export default function Logo({
  size = 'md',
  light = false,
  variant = 'horizontal',
  showTagline = false,
  taglineText = 'HOTELS & STAYS',
  animated = false,
  className = '',
  style = {},
}: LogoProps) {
  // Dimension mappings
  const dimensions = {
    xs: { icon: 20, font: '1rem', tag: '0.5rem', gap: 6 },
    sm: { icon: 26, font: '1.25rem', tag: '0.55rem', gap: 8 },
    md: { icon: 34, font: '1.65rem', tag: '0.62rem', gap: 10 },
    lg: { icon: 46, font: '2.3rem', tag: '0.75rem', gap: 14 },
    xl: { icon: 64, font: '3.2rem', tag: '0.95rem', gap: 18 },
  };

  const currentDim =
    typeof size === 'number'
      ? {
          icon: Math.round(size * 0.9),
          font: `${size * 0.95}px`,
          tag: `${Math.max(10, size * 0.32)}px`,
          gap: Math.round(size * 0.28),
        }
      : dimensions[size] || dimensions.md;

  const textColor = light ? '#ffffff' : '#0f172a';
  const tagColor = light ? '#cbd5e1' : '#64748b';

  // Variant: Just the vector Icon Mark
  if (variant === 'icon') {
    return (
      <StayBuddyIconMark
        size={currentDim.icon}
        colorScheme={light ? 'white' : 'gradient'}
        className={className}
      />
    );
  }

  // Variant: App Icon Squircle Badge
  if (variant === 'app-icon') {
    return (
      <StayBuddyAppIcon
        size={currentDim.icon * 1.3}
        rounded={Math.round(currentDim.icon * 0.35)}
        className={className}
      />
    );
  }

  // Variant: Minimal Wordmark Only
  if (variant === 'minimal') {
    return (
      <span
        className={className}
        style={{
          fontSize: currentDim.font,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          color: textColor,
          display: 'inline-flex',
          alignItems: 'baseline',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          ...style,
        }}
      >
        Stay<span style={{ color: '#f97316' }}>Buddy</span>
      </span>
    );
  }

  // Variant: Stacked (Emblem on top, Wordmark below)
  if (variant === 'stacked') {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: currentDim.gap * 0.6,
          textAlign: 'center',
          ...style,
        }}
      >
        <div style={{ transition: animated ? 'transform 0.25s ease' : undefined }}>
          <StayBuddyIconMark
            size={currentDim.icon * 1.35}
            colorScheme={light ? 'white' : 'gradient'}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span
            style={{
              fontSize: currentDim.font,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: textColor,
              lineHeight: 1.1,
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            }}
          >
            Stay<span style={{ color: '#f97316' }}>Buddy</span>
          </span>
          {(showTagline || variant === 'full') && (
            <span
              style={{
                fontSize: currentDim.tag,
                fontWeight: 700,
                letterSpacing: '0.22em',
                color: tagColor,
                marginTop: 3,
                textTransform: 'uppercase',
              }}
            >
              {taglineText}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default: Horizontal Combination Mark (Icon + Text)
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: currentDim.gap,
        textDecoration: 'none',
        lineHeight: 1,
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: animated ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
        }}
      >
        <StayBuddyIconMark
          size={currentDim.icon}
          colorScheme={light ? 'white' : 'gradient'}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: currentDim.font,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: textColor,
            display: 'inline-flex',
            alignItems: 'baseline',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            lineHeight: 1,
          }}
        >
          Stay<span style={{ color: '#f97316' }}>Buddy</span>
        </span>

        {(showTagline || variant === 'full') && (
          <span
            style={{
              fontSize: currentDim.tag,
              fontWeight: 800,
              letterSpacing: '0.2em',
              color: tagColor,
              marginTop: 4,
              textTransform: 'uppercase',
            }}
          >
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
}
