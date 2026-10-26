'use client';

import React from 'react';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  light?: boolean;
  variant?: 'full' | 'horizontal' | 'icon' | 'app-icon' | 'stacked' | 'minimal';
  concept?: 'pin-roof' | 'fluid-s' | 'sun-horizon' | 'cradle';
  showTagline?: boolean;
  taglineText?: string;
  animated?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Concept A (The Minimalist Pin-Roof) - THE CLEAN WINNER
 * A bold, modern location pin with an architectural hotel roof, chimney, and doorway carved out.
 * Ultra-sharp, scalable, legible at 16px to 1000px.
 */
export function PinRoofMark({
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
    : `url(#${gradientId}-pin-grad)`;

  const innerColor = isWhite ? '#ea580c' : '#ffffff';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="StayBuddy Pin-Roof Mark"
    >
      <defs>
        <linearGradient id={`${gradientId}-pin-grad`} x1="16" y1="12" x2="84" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        <filter id={`${shadowId}-glow`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#f97316" floodOpacity="0.28" />
        </filter>
      </defs>

      <g filter={colorScheme === 'gradient' ? `url(#${shadowId}-glow)` : undefined}>
        {/* Outer Location Pin (Destination) */}
        <path
          d="M50 8C31.2 8 16 23.2 16 42C16 59.8 45.8 88.5 48.1 90.6C49.2 91.6 50.8 91.6 51.9 90.6C54.2 88.5 84 59.8 84 42C84 23.2 68.8 8 50 8Z"
          fill={primaryFill}
        />

        {/* Chimney */}
        <path
          d="M60 33V25.5C60 24.7 60.7 24 61.5 24H65.5C66.3 24 67 24.7 67 25.5V39"
          stroke={innerColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Architectural Hotel Roof (Stay) */}
        <path
          d="M31 46.5L47.9 30.5C49.1 29.4 50.9 29.4 52.1 30.5L69 46.5"
          stroke={innerColor}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* House Walls & Welcoming Arched Gateway */}
        <path
          d="M36 45V61C36 62.1 36.9 63 38 63H44.5V52.5C44.5 50.6 46.1 49 48 49H52C53.9 49 55.5 50.6 55.5 52.5V63H62C63.1 63 64 62.1 64 61V45"
          fill={innerColor}
        />
      </g>
    </svg>
  );
}

/**
 * Concept B (The Fluid S-Ribbon)
 * Continuous folded S ribbon with a friendly smiling arc.
 */
export function FluidSRibbonMark({
  size = 36,
  colorScheme = 'gradient',
  className = '',
}: {
  size?: number;
  colorScheme?: 'gradient' | 'white' | 'orange' | 'dark';
  className?: string;
}) {
  const gradientId = React.useId();
  const isWhite = colorScheme === 'white';
  const isDark = colorScheme === 'dark';

  const fillOrange = isWhite ? '#ffffff' : isDark ? '#0f172a' : `url(#${gradientId}-s-grad)`;
  const fillAccent = isWhite ? '#fed7aa' : isDark ? '#334155' : '#fb923c';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="StayBuddy S-Ribbon Mark"
    >
      <defs>
        <linearGradient id={`${gradientId}-s-grad`} x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>

      {/* Top Loop */}
      <path
        d="M65 24C65 17.4 59.6 12 53 12H44C32.9 12 24 20.9 24 32C24 43.1 32.9 52 44 52H56C67.1 52 76 60.9 76 72C76 83.1 67.1 92 56 92H44C37.4 92 32 86.6 32 80"
        stroke={fillOrange}
        strokeWidth="13"
        strokeLinecap="round"
      />

      {/* Internal Smile Accent */}
      <path
        d="M42 66C46 70 54 70 58 66"
        stroke={fillAccent}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Concept C (The Rising Sun & Horizon)
 * Warm morning sun over a clean hotel roofline.
 */
export function SunHorizonMark({
  size = 36,
  colorScheme = 'gradient',
  className = '',
}: {
  size?: number;
  colorScheme?: 'gradient' | 'white' | 'orange' | 'dark';
  className?: string;
}) {
  const gradientId = React.useId();
  const isWhite = colorScheme === 'white';
  const isDark = colorScheme === 'dark';

  const primaryFill = isWhite ? '#ffffff' : isDark ? '#0f172a' : `url(#${gradientId}-sun-grad)`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="StayBuddy Sun Horizon Mark"
    >
      <defs>
        <linearGradient id={`${gradientId}-sun-grad`} x1="50" y1="10" x2="50" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>

      {/* Rising Sun */}
      <circle cx="50" cy="45" r="28" fill={primaryFill} opacity="0.9" />

      {/* Horizon Roofline */}
      <path
        d="M12 78C28 66 38 52 50 42C62 52 72 66 88 78"
        stroke={isWhite ? '#ea580c' : '#ffffff'}
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* Chimney */}
      <path
        d="M62 48V42H67V52"
        stroke={isWhite ? '#ea580c' : '#ffffff'}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Concept D (The Original Hospitality Cradle)
 */
export function CradleMark({
  size = 36,
  colorScheme = 'gradient',
  className = '',
}: {
  size?: number;
  colorScheme?: 'gradient' | 'white' | 'orange' | 'dark';
  className?: string;
}) {
  const gradientId = React.useId();
  const isWhite = colorScheme === 'white';
  const isDark = colorScheme === 'dark';

  const primaryFill = isWhite ? '#ffffff' : isDark ? '#0f172a' : `url(#${gradientId}-orange)`;
  const pinFill = isWhite ? '#ffffff' : isDark ? '#0f172a' : `url(#${gradientId}-pin)`;
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
      aria-label="StayBuddy Cradle Mark"
    >
      <defs>
        <linearGradient id={`${gradientId}-orange`} x1="10" y1="15" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id={`${gradientId}-pin`} x1="30" y1="30" x2="70" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff7828" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>

      <path d="M68 28.5V20C68 18.9 68.9 18 70 18H74C75.1 18 76 18.9 76 20V36.5" stroke={primaryFill} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 48L46.8 20.8C48.6 19.2 51.4 19.2 53.2 20.8L83 48" stroke={primaryFill} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 33C42.8 33 37 38.8 37 46C37 54.5 48.2 66.2 49.2 67.2C49.6 67.7 50.4 67.7 50.8 67.2C51.8 66.2 63 54.5 63 46C63 38.8 57.2 33 50 33Z" fill={pinFill} />
      <text x="50" y="49.5" textAnchor="middle" fill={innerTextFill} fontSize="11.5" fontFamily="system-ui, sans-serif" fontWeight="900">S</text>
      <path d="M23 58C25 72.5 36.5 83 50 83C63.5 83 75 72.5 77 58" stroke={primaryFill} strokeWidth="6.5" strokeLinecap="round" />
      <circle cx="21.5" cy="53.5" r="3.2" fill={primaryFill} />
      <circle cx="78.5" cy="53.5" r="3.2" fill={primaryFill} />
    </svg>
  );
}

/**
 * Dynamic StayBuddy Icon Mark
 * Renders the chosen concept mark (default: 'pin-roof')
 */
export function StayBuddyIconMark({
  size = 36,
  colorScheme = 'gradient',
  concept = 'pin-roof',
  className = '',
}: {
  size?: number;
  colorScheme?: 'gradient' | 'white' | 'orange' | 'dark';
  concept?: 'pin-roof' | 'fluid-s' | 'sun-horizon' | 'cradle';
  className?: string;
}) {
  switch (concept) {
    case 'fluid-s':
      return <FluidSRibbonMark size={size} colorScheme={colorScheme} className={className} />;
    case 'sun-horizon':
      return <SunHorizonMark size={size} colorScheme={colorScheme} className={className} />;
    case 'cradle':
      return <CradleMark size={size} colorScheme={colorScheme} className={className} />;
    case 'pin-roof':
    default:
      return <PinRoofMark size={size} colorScheme={colorScheme} className={className} />;
  }
}

/**
 * StayBuddy Official App Icon (Squircle Badge)
 */
export function StayBuddyAppIcon({
  size = 64,
  rounded = 16,
  concept = 'pin-roof',
  className = '',
}: {
  size?: number;
  rounded?: number;
  concept?: 'pin-roof' | 'fluid-s' | 'sun-horizon' | 'cradle';
  className?: string;
}) {
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
      <StayBuddyIconMark size={size * 0.72} colorScheme="white" concept={concept} />
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
  concept = 'pin-roof',
  showTagline = false,
  taglineText = 'HOTELS & STAYS',
  animated = false,
  className = '',
  style = {},
}: LogoProps) {
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
        concept={concept}
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
        concept={concept}
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

  // Variant: Stacked
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
            concept={concept}
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

  // Default: Horizontal Combination Mark
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
          concept={concept}
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
