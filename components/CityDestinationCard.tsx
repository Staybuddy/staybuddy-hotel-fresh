'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCityPhotoSync, getCityLandmark, DEFAULT_CITY_PHOTO, resolveParentCity } from '@/lib/cityPhotos';

interface CityDestinationCardProps {
  city: string;
  country?: string;
  hotels: number;
  isLast?: boolean;
}

export default function CityDestinationCard({
  city,
  country = 'India',
  hotels,
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
      className="city-dest-card-link"
      style={{
        textDecoration: 'none',
        flexShrink: 0,
        scrollSnapAlign: 'start',
        display: 'block',
        marginRight: isLast ? '16px' : '0',
      }}
    >
      <div
        className="city-dest-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          cursor: 'pointer',
          border: isHovered
            ? '2px solid var(--brand-500, #ff6b35)'
            : '2px solid rgba(255, 255, 255, 0.15)',
          transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease, border-color 0.3s ease',
          transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
          boxShadow: isHovered
            ? '0 18px 36px -6px rgba(0, 0, 0, 0.35)'
            : '0 4px 14px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* 100% Full-bleed Ultra-Fast City Background Photo */}
        <img
          src={photoUrl}
          alt={`${canonicalCity} city travel destination`}
          loading="eager"
          decoding="async"
          onError={() => {
            if (photoUrl !== DEFAULT_CITY_PHOTO) {
              setPhotoUrl(DEFAULT_CITY_PHOTO);
            }
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
            transform: isHovered ? 'scale(1.06)' : 'scale(1)',
            opacity: 1,
            zIndex: 1,
          }}
        />

        {/* Minimal Bottom Vignette - Over 70% of the entire photo has ZERO overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.35) 22%, transparent 36%)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* Top-Right Badge: Verified Stays */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 3,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            color: '#ffffff',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: '9999px',
            letterSpacing: '0.02em',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          {hotels} {hotels === 1 ? 'hotel' : 'hotels'}
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
              }}
            >
              {landmark}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: isHovered ? 'var(--brand-500, #ff6b35)' : 'rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.72rem',
                flexShrink: 0,
                transition: 'all 0.3s ease',
                transform: isHovered ? 'translateX(2px) scale(1.1)' : 'translateX(0)',
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
