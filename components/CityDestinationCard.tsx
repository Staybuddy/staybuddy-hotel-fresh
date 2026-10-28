'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCityPhotoSync, getCityLandmark, DEFAULT_CITY_PHOTO } from '@/lib/cityPhotos';

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
  const [photoUrl, setPhotoUrl] = useState<string>(() => getCityPhotoSync(city));
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Smart dynamic resolver: If photo is default fallback, asynchronously fetch real photo
  useEffect(() => {
    let isMounted = true;
    const initial = getCityPhotoSync(city);
    setPhotoUrl(initial);

    // If city is not in the hardcoded curated list, query our smart /api/city-photo endpoint
    if (initial === DEFAULT_CITY_PHOTO) {
      fetch(`/api/city-photo?city=${encodeURIComponent(city)}`)
        .then(res => res.json())
        .then(data => {
          if (isMounted && data?.success && data?.photo) {
            setPhotoUrl(data.photo);
          }
        })
        .catch(err => {
          console.warn(`Could not resolve photo for ${city}:`, err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [city]);

  const landmark = getCityLandmark(city);

  return (
    <Link
      href={`/hotels?city=${encodeURIComponent(city)}`}
      style={{
        textDecoration: 'none',
        flexShrink: 0,
        scrollSnapAlign: 'start',
        display: 'block',
        width: 182,
        marginRight: isLast ? '16px' : '0',
      }}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: 'var(--surface, #ffffff)',
          borderRadius: '16px',
          border: isHovered ? '2px solid var(--brand-500, #ff6b35)' : '2px solid var(--border, #e2e8f0)',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          cursor: 'pointer',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHovered ? '0 12px 24px -4px rgba(0,0,0,0.12)' : '0 2px 6px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Real City Image Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '118px',
            overflow: 'hidden',
            backgroundColor: '#e2e8f0',
          }}
        >
          {/* Skeleton placeholder while image loads */}
          {!imgLoaded && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          )}

          {/* Actual Real Image */}
          <img
            src={photoUrl}
            alt={`${city} city travel destination`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              // Safety fallback if external image fails
              if (photoUrl !== DEFAULT_CITY_PHOTO) {
                setPhotoUrl(DEFAULT_CITY_PHOTO);
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.45s ease, opacity 0.3s ease',
              transform: isHovered ? 'scale(1.08)' : 'scale(1)',
              opacity: imgLoaded ? 1 : 0.4,
            }}
          />

          {/* Hotel Count Pill on Image */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(15, 23, 42, 0.72)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '9999px',
              letterSpacing: '0.02em',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {hotels} hotels
          </div>
        </div>

        {/* Card Details */}
        <div style={{ padding: '10px 12px 12px 12px', textAlign: 'left' }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: '1.02rem',
              color: 'var(--text-primary, #0f172a)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.25,
            }}
          >
            {city}
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted, #64748b)',
              marginTop: '3px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{landmark}</span>
            <span
              style={{
                color: isHovered ? 'var(--brand-600, #ea580c)' : 'var(--text-muted, #94a3b8)',
                fontWeight: 700,
                fontSize: '0.85rem',
                transition: 'transform 0.2s ease, color 0.2s ease',
                transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
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
