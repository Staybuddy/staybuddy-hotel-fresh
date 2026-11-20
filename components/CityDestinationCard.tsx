'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCityPhotoSync, getCityLandmark, DEFAULT_CITY_PHOTO, resolveParentCity } from '@/lib/cityPhotos';

interface CityDestinationCardProps {
  city: string;
  country?: string;
  hotels: number;
  index?: number;
  isLast?: boolean;
}

export default function CityDestinationCard({
  city,
  country = 'India',
  hotels,
  index = 0,
  isLast = false,
}: CityDestinationCardProps) {
  // Ensure we are working with the canonical parent city
  const canonicalCity = resolveParentCity(city);
  const [photoUrl, setPhotoUrl] = useState<string>(() => getCityPhotoSync(canonicalCity));
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Dynamic resolver: If photo is default fallback, query smart /api/city-photo
  useEffect(() => {
    let isMounted = true;
    const initial = getCityPhotoSync(canonicalCity);
    setPhotoUrl(initial);

    if (initial === DEFAULT_CITY_PHOTO) {
      fetch(`/api/city-photo?city=${encodeURIComponent(canonicalCity)}`)
        .then(res => res.json())
        .then(data => {
          if (isMounted && data?.success && data?.photo) {
            setPhotoUrl(data.photo);
          }
        })
        .catch(err => {
          console.warn(`Dynamic photo lookup error for ${canonicalCity}:`, err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [canonicalCity]);

  const landmark = getCityLandmark(canonicalCity);

  return (
    <Link
      href={`/hotels?city=${encodeURIComponent(canonicalCity)}`}
      onClick={() => {
        try {
          const saved = localStorage.getItem('staybuddy_last_search');
          const p = saved ? JSON.parse(saved) : {};
          p.location = canonicalCity;
          localStorage.setItem('staybuddy_last_search', JSON.stringify(p));
        } catch (_) {}
      }}
      className="city-dest-card-link"
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      style={{
        textDecoration: 'none',
        flexShrink: 0,
        scrollSnapAlign: 'start',
        display: 'block',
        marginRight: isLast ? '16px' : '0',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div
        className="city-dest-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          cursor: 'pointer',
          border: isHovered
            ? '2.5px solid #ff6b35'
            : '2px solid rgba(255, 255, 255, 0.18)',
          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease',
          transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
          boxShadow: isHovered
            ? '0 22px 45px -8px rgba(0, 0, 0, 0.5), 0 0 0 3px rgba(255, 107, 53, 0.45), 0 0 25px rgba(255, 107, 53, 0.25)'
            : '0 4px 14px rgba(0, 0, 0, 0.12)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 60}ms both`,
        }}
      >
        {/* 100% Full-bleed Ultra-Fast City Background Photo with Cinematic Zoom & Rich Saturation */}
        <img
          src={photoUrl}
          alt={`${canonicalCity} city travel destination`}
          className="city-dest-card-img"
          loading="eager"
          decoding="async"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onError={() => {
            if (photoUrl !== DEFAULT_CITY_PHOTO) {
              setPhotoUrl(DEFAULT_CITY_PHOTO);
            }
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            minHeight: '100%',
            maxHeight: '100%',
            maxWidth: 'none',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s ease',
            transform: isHovered ? 'scale(1.12) rotate(0.35deg)' : 'scale(1) rotate(0deg)',
            filter: isHovered ? 'saturate(1.18) contrast(1.06) brightness(1.03)' : 'saturate(1) contrast(1) brightness(1)',
            opacity: 1,
            zIndex: 1,
          }}
        />

        {/* Shimmer Light Reflection Sweep Beam */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '60%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
            transform: isHovered ? 'translateX(300%) skewX(-22deg)' : 'translateX(-160%) skewX(-22deg)',
            transition: isHovered ? 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* Minimal Bottom Vignette - Over 75% of the entire photo has ZERO overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.25) 22%, transparent 32%)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* Top-Right Badge: Live Verified Stays with Pulsing Green Indicator */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 3,
            background: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: isHovered ? '1.5px solid rgba(255, 107, 53, 0.85)' : '1px solid rgba(255, 255, 255, 0.35)',
            color: '#ffffff',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '9999px',
            letterSpacing: '0.02em',
            boxShadow: isHovered ? '0 4px 14px rgba(255, 107, 53, 0.45)' : '0 2px 6px rgba(0,0,0,0.3)',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isHovered ? 'scale(1.06)' : 'scale(1)',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <span className="sb-live-dot" />
          <span>{hotels} {hotels === 1 ? 'hotel' : 'hotels'}</span>
        </div>

        {/* Bottom Details Content - Sleek & Compact Floating Text */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 14px',
            zIndex: 3,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: '1.25rem',
              color: '#ffffff',
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 2px 8px rgba(0,0,0,0.95)',
              transition: 'transform 0.35s ease',
              transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
            }}
          >
            {canonicalCity}
          </div>

          <div
            style={{
              fontSize: '0.74rem',
              color: 'rgba(255, 255, 255, 0.95)',
              marginTop: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textShadow: '0 1px 4px rgba(0,0,0,0.95)',
            }}
          >
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                paddingRight: '6px',
                fontWeight: 500,
                transition: 'color 0.3s ease',
                color: isHovered ? '#ffedd5' : 'rgba(255, 255, 255, 0.95)',
              }}
            >
              {landmark}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isHovered ? '26px' : '20px',
                height: isHovered ? '26px' : '20px',
                borderRadius: '9999px',
                background: isHovered
                  ? 'linear-gradient(135deg, #ff7e47, #ea580c)'
                  : 'rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: isHovered ? '0.85rem' : '0.72rem',
                flexShrink: 0,
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isHovered ? 'translateX(3px) scale(1.08)' : 'translateX(0)',
                boxShadow: isHovered ? '0 4px 14px rgba(234, 88, 12, 0.7)' : 'none',
              }}
            >
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
