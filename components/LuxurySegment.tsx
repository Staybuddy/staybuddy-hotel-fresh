'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

export interface LuxeHotel {
  id: string;
  name: string;
  city: string;
  state?: string;
  starRating: number;
  startingPrice: number;
  originalPrice: number;
  images: string[];
  photo: string;
  badge: string;
  category: 'Palaces & Heritage' | 'Private Pool Villas' | 'Beachfront Sanctuaries' | 'Mountain Retreats' | 'City Mansions';
  amenities: string[];
  privileges: string[];
  rating: number;
  reviewsCount: number;
  description: string;
  isDbHotel?: boolean;
}

// Curated luxury flagship hotels from StayBuddy Luxe Collection
const CURATED_LUXE_HOTELS: LuxeHotel[] = [
  {
    id: 'luxe-udaipur-palace',
    name: 'The Grand Imperial Lake Palace & Suites',
    city: 'Udaipur',
    state: 'Rajasthan',
    starRating: 5,
    startingPrice: 24999,
    originalPrice: 34500,
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    ],
    photo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    badge: '👑 Royal Heritage Palace',
    category: 'Palaces & Heritage',
    amenities: ['Private Royal Butler', 'Heated Lakeview Infinity Pool', 'Royal Boat Arrival', 'Jiva Signature Spa', 'Rooftop Fine Dining'],
    privileges: [
      'Complimentary Royal High Tea & Welcome Champagne',
      'Chef-Curated 5-Course Artisan Breakfast',
      '24/7 Dedicated Palace Butler & VIP Concierge',
      'Complimentary Chauffeur Airport Limousine Pick & Drop',
      'Guaranteed Early 10 AM Check-In & Late 4 PM Check-Out',
    ],
    rating: 4.96,
    reviewsCount: 342,
    description: 'An iconic floating white marble marvel on Lake Pichola. Immerse yourself in the majestic grandeur of Rajasthan royals with personal butlers, handcrafted gold-leaf ceilings, and sunset champagne cruises.',
  },
  {
    id: 'luxe-goa-azure-villas',
    name: 'The Azure Bay Cliffside Pool Villas',
    city: 'North Goa',
    state: 'Goa',
    starRating: 5,
    startingPrice: 18499,
    originalPrice: 26000,
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    ],
    photo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    badge: '🏊 Private Infinity Pool Villa',
    category: 'Private Pool Villas',
    amenities: ['Private Plunge Pool', 'Direct Private Beach Access', 'Sunset Yacht Charter', 'Open-Air Jacuzzi', 'Beachfront Cabana'],
    privileges: [
      'Daily Floating Champagne Breakfast in Private Pool',
      'Complimentary Sunset Yacht Cruise with Hors d’oeuvres',
      'Personal Villa Host & On-Demand Mixologist',
      'Couple Beachfront Aromatherapy Spa Session',
      'Premium Airport Luxury Sedan Transfers Included',
    ],
    rating: 4.94,
    reviewsCount: 289,
    description: 'Ultra-exclusive private cliffside villas perched over the Arabian Sea. Featuring private plunge pools, private beachfront sundecks, and bespoke seafood barbeque dinners prepared by personal chefs.',
  },
  {
    id: 'luxe-himalayan-sanctuary',
    name: 'The Himalayan Cedar Glass Sanctuary & Spa',
    city: 'Shimla',
    state: 'Himachal Pradesh',
    starRating: 5,
    startingPrice: 21999,
    originalPrice: 29800,
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    ],
    photo: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    badge: '⛰️ Alpine Luxury Retreat',
    category: 'Mountain Retreats',
    amenities: ['Heated Cedarwood Jacuzzi', 'Starlit Astronomical Observatory', 'Forest Trek Butler', 'Indoor Heated Pool', 'Fireplace Suites'],
    privileges: [
      'Complimentary Fine Wine & Artisan Cheese on Arrival',
      'Heated Panoramic Glass Dining with Mountain Views',
      'Complimentary 60-Minute Herbal Cedar Spa Massage',
      'Night Sky Telescope Session with Master Astronomer',
      'Dedicated 4x4 Luxury Luxury SUV Chauffeur',
    ],
    rating: 4.98,
    reviewsCount: 215,
    description: 'Nestled amidst 8,000 ft virgin deodar pine forests. Experience breathtaking snow-capped mountain vistas, floor-to-ceiling heated glass rooms, and private cedar jacuzzis under the Himalayan stars.',
  },
  {
    id: 'luxe-kerala-backwaters',
    name: 'The Serene Backwaters Teakwood Royal Estate',
    city: 'Kumarakom',
    state: 'Kerala',
    starRating: 5,
    startingPrice: 19499,
    originalPrice: 27500,
    images: [
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    ],
    photo: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    badge: '🌴 Emerald Waters Haven',
    category: 'Beachfront Sanctuaries',
    amenities: ['Private Teakwood Speedboat', 'Authentic Ayurvedic Doctors', 'Floating Water Villa', 'Plunge Pool', 'Lotus Pond Courtyard'],
    privileges: [
      'Private Speedboat Airport Transfer via Vembanad Lake',
      'Unlimited Authentic Ayurvedic Doctor Consultations',
      'Sunset Shikara Cruise with Fresh Coconut Water & Delicacies',
      'Traditional Kerala Royal Sadya Fine Dining Feast',
      'Late Check-out until 5 PM Guaranteed',
    ],
    rating: 4.95,
    reviewsCount: 198,
    description: 'An architectural heritage wonder constructed from 200-year-old preserved teakwood. Floating luxury villas atop shimmering emerald waters with personal speedboats and world-renowned Ayurvedic healing.',
  },
  {
    id: 'luxe-ritz-manor-bengaluru',
    name: 'The Imperial Ritz Heritage Manor & Gardens',
    city: 'Bengaluru',
    state: 'Karnataka',
    starRating: 5,
    startingPrice: 16999,
    originalPrice: 23500,
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1561501900-3701fa6a0864?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    ],
    photo: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    badge: '🏛️ Colonial Presidential Estate',
    category: 'City Mansions',
    amenities: ['Rolls-Royce Chauffeur', 'Single Malt & Cigar Lounge', 'Olympic Swimming Pool', 'Michelin Star Chef', 'Tennis Pavilion'],
    privileges: [
      'Rolls-Royce Ghost VIP Airport Pick & Drop',
      'Access to Executive Presidential Club Lounge',
      'Complimentary French Champagne & Caviar Tasting',
      'Dedicated 24/7 Diplomatic Butler',
      'Guaranteed Suite Upgrade (Subject to availability)',
    ],
    rating: 4.92,
    reviewsCount: 412,
    description: 'The epitome of classical British and colonial royalty spanning 12 acres of manicured botanical gardens. Features antique chandeliers, private walk-in wine cellars, and diplomatic white-glove service.',
  },
];

export default function LuxurySegment({
  dbHotels = [],
  checkIn = '',
  checkOut = '',
}: {
  dbHotels?: any[];
  checkIn?: string;
  checkOut?: string;
}) {
  const [activeCategory, setActiveCategory] = useState<string>('All Luxe Stays');
  const [selectedHotel, setSelectedHotel] = useState<LuxeHotel | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Merge real onboarded luxury database hotels (when present) with our curated luxury collection
  const allLuxuryHotels: LuxeHotel[] = useMemo(() => {
    const dbLuxeList: LuxeHotel[] = (dbHotels || [])
      .filter((h: any) => {
        const star = Number(h.starRating) || 0;
        const cat = (h.category || '').toLowerCase();
        return star >= 5 || cat === 'luxury';
      })
      .map((h: any) => {
        const images: string[] = Array.isArray(h.images) ? h.images.filter(Boolean) : [];
        const photo = images[0] || h.photo || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600';
        const price = Number(h.startingPrice) || 18999;
        return {
          id: h._id || h.id || 'db-luxe',
          name: h.name || 'StayBuddy Luxe Property',
          city: h.city || 'India',
          state: h.state || '',
          starRating: 5,
          startingPrice: price,
          originalPrice: Math.round(price * 1.35),
          images: images.length > 0 ? images : [photo],
          photo,
          badge: '👑 StayBuddy Luxe Verified',
          category: 'Palaces & Heritage' as const,
          amenities: Array.isArray(h.amenities) && h.amenities.length > 0
            ? h.amenities
            : ['Royal Butler Service', 'Infinity Pool', 'Fine Dining', 'Luxury Spa', 'Valet Parking'],
          privileges: [
            'Complimentary Welcome High Tea & Gourmet Refreshments',
            'Chef-Curated Artisan Breakfast Included',
            '24/7 Dedicated Butler & VIP Concierge Service',
            'Complimentary Airport / Transit Assistance',
            'Guaranteed Early Check-in & Late Checkout (subject to availability)',
          ],
          rating: Number(h.avgRating) || 4.9,
          reviewsCount: Number(h.totalReviews) || 120,
          description: h.description || 'A verified flagship luxury property on StayBuddy offering royal hospitality, bespoke suites, and supreme comfort.',
          isDbHotel: true,
        };
      });

    // Curated list + any newly onboarded DB luxury hotels at the top
    return [...dbLuxeList, ...CURATED_LUXE_HOTELS];
  }, [dbHotels]);

  // Filter by category
  const filteredHotels = useMemo(() => {
    if (activeCategory === 'All Luxe Stays') return allLuxuryHotels;
    return allLuxuryHotels.filter(h => h.category === activeCategory);
  }, [activeCategory, allLuxuryHotels]);

  const handleOpenHotel = (hotel: LuxeHotel) => {
    setSelectedHotel(hotel);
    setActivePhotoIndex(0);
  };

  const handleCloseModal = () => {
    setSelectedHotel(null);
  };

  const categories = [
    'All Luxe Stays',
    'Palaces & Heritage',
    'Private Pool Villas',
    'Beachfront Sanctuaries',
    'Mountain Retreats',
    'City Mansions',
  ];

  return (
    <>
      <style>{`
        .luxe-section-wrapper {
          background: radial-gradient(circle at 50% 0%, #171d2b 0%, #0c1017 60%, #06080d 100%);
          border-top: 1.5px solid rgba(245, 158, 11, 0.35);
          border-bottom: 1.5px solid rgba(245, 158, 11, 0.35);
          padding: 48px 0 54px;
          position: relative;
          overflow: hidden;
          color: #f8fafc;
          margin: 32px 0;
        }

        .luxe-gold-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(0, 0, 0, 0) 70%);
          top: -150px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .luxe-gold-glow-left {
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(217, 119, 6, 0.08) 0%, rgba(0, 0, 0, 0) 70%);
          bottom: -100px;
          left: -50px;
          pointer-events: none;
        }

        .luxe-badge-crest {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.12) 100%);
          border: 1px solid rgba(251, 191, 36, 0.5);
          color: #fef3c7;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 6px 16px;
          border-radius: 999px;
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.2);
        }

        .luxe-tabs-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding: 6px 2px 14px;
        }
        .luxe-tabs-bar::-webkit-scrollbar {
          display: none;
        }

        .luxe-tab-btn {
          flex: 0 0 auto;
          background: rgba(255, 255, 255, 0.05);
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 8px 18px;
          border-radius: 30px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          letter-spacing: 0.02em;
        }
        .luxe-tab-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f8fafc;
          border-color: rgba(245, 158, 11, 0.4);
        }
        .luxe-tab-btn.active {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #0f172a;
          border-color: #fde68a;
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
          font-weight: 800;
        }

        .luxe-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          margin-top: 24px;
        }

        .luxe-card {
          background: linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%);
          border: 1.5px solid rgba(245, 158, 11, 0.32);
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
          position: relative;
        }
        .luxe-card:hover {
          transform: translateY(-6px);
          border-color: #fbbf24;
          box-shadow: 0 24px 50px rgba(245, 158, 11, 0.25);
        }

        .luxe-card-image-box {
          position: relative;
          height: 230px;
          width: 100%;
          overflow: hidden;
          background: #020617;
        }
        .luxe-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .luxe-card:hover .luxe-card-image {
          transform: scale(1.08);
        }

        .luxe-privileges-strip {
          background: rgba(245, 158, 11, 0.08);
          border-top: 1px dashed rgba(245, 158, 11, 0.28);
          border-bottom: 1px dashed rgba(245, 158, 11, 0.28);
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: #fde68a;
          font-weight: 700;
        }

        .luxe-reserve-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #0f172a;
          border: none;
          font-weight: 800;
          font-size: 0.88rem;
          padding: 12px 18px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35);
        }
        .luxe-reserve-btn:hover {
          filter: brightness(1.1);
          transform: scale(1.02);
        }

        @keyframes luxeModalPop {
          from { opacity: 0; transform: scale(0.94) translateY(24px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .luxe-modal-container {
          animation: luxeModalPop 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (max-width: 768px) {
          .luxe-section-wrapper {
            padding: 36px 0 42px;
          }
          .luxe-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .luxe-card-image-box {
            height: 200px;
          }
        }
      `}</style>

      <section className="luxe-section-wrapper">
        <div className="luxe-gold-glow" />
        <div className="luxe-gold-glow-left" />

        <div className="container" style={{ position: 'relative', zIndex: 3 }}>
          {/* Top Title & Regal Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 28 }}>
            <div className="luxe-badge-crest">
              <span>👑</span>
              <span>StayBuddy Luxe • The Ultra-Luxury Collection</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
              fontWeight: 900,
              color: '#ffffff',
              margin: '14px 0 8px',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              Unrivaled Luxury, Palatial Stays & Private Sanctuaries
            </h2>

            <p style={{
              color: '#cbd5e1',
              fontSize: 'clamp(0.88rem, 1.8vw, 1.05rem)',
              maxWidth: 780,
              margin: 0,
              lineHeight: 1.6
            }}>
              Discover India&apos;s most celebrated 5-star heritage palaces, secluded cliffside infinity pool villas, and mountain retreats. Every stay includes <strong style={{ color: '#fbbf24' }}>StayBuddy VIP Privileges</strong>, personal butlers, and bespoke concierge hospitality.
            </p>
          </div>

          {/* Luxe Privileges Pillars Banner */}
          <div style={{
            background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.16) 50%, rgba(245, 158, 11, 0.08) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 16,
            padding: '14px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: 'inset 0 0 24px rgba(245, 158, 11, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.3rem' }}>🍾</span>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fef3c7' }}>Welcome High Tea & Champagne</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Complimentary on arrival</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.3rem' }}>🍳</span>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fef3c7' }}>Artisan Chef Breakfast</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Daily lavish buffet included</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.3rem' }}>🛎️</span>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fef3c7' }}>Dedicated 24/7 Butler</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Personalized white-glove service</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.3rem' }}>⏰</span>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fef3c7' }}>Flexible Early & Late Checkout</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Relax without rush</div>
              </div>
            </div>
          </div>

          {/* Luxe Category Filter Bar */}
          <div className="luxe-tabs-bar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`luxe-tab-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Luxury Hotels Showcase Grid */}
          <div className="luxe-grid">
            {filteredHotels.map((hotel) => (
              <div
                key={hotel.id}
                className="luxe-card"
                onClick={() => handleOpenHotel(hotel)}
                style={{ cursor: 'pointer' }}
              >
                {/* Image Area */}
                <div className="luxe-card-image-box">
                  <img
                    src={hotel.photo}
                    alt={hotel.name}
                    className="luxe-card-image"
                  />

                  {/* Top Badges */}
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    right: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 4
                  }}>
                    <span style={{
                      background: 'rgba(15, 23, 42, 0.88)',
                      backdropFilter: 'blur(6px)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <span>★ 5.0</span>
                      <span style={{ color: '#f8fafc' }}>({hotel.reviewsCount})</span>
                    </span>

                    <span style={{
                      background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                      color: '#ffffff',
                      border: '1px solid #fde68a',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                    }}>
                      {hotel.badge}
                    </span>
                  </div>

                  {/* Gradient Overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15, 23, 42, 0.75) 100%)'
                  }} />

                  {/* City Location */}
                  <div style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 14,
                    color: '#f8fafc',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    zIndex: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span>📍</span>
                    <span>{hotel.city}{hotel.state ? `, ${hotel.state}` : ''}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div style={{ padding: '18px 20px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: '0 0 8px 0',
                    lineHeight: 1.35
                  }}>
                    {hotel.name}
                  </h3>

                  <p style={{
                    fontSize: '0.82rem',
                    color: '#94a3b8',
                    margin: '0 0 14px 0',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {hotel.description}
                  </p>

                  {/* Key Amenities Tags */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {hotel.amenities.slice(0, 3).map((a, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#e2e8f0',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 600
                        }}
                      >
                        ✓ {a}
                      </span>
                    ))}
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    {/* Luxe Privilege Strip */}
                    <div className="luxe-privileges-strip" style={{ borderRadius: 8, marginBottom: 14 }}>
                      <span>✨</span>
                      <span>StayBuddy Luxe VIP Inclusions: Butler • Breakfast • High Tea</span>
                    </div>

                    {/* Price and CTA */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                          Starting from
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
                            ₹{hotel.startingPrice.toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: '#64748b', textDecoration: 'line-through' }}>
                            ₹{hotel.originalPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700 }}>
                          + ₹0 Booking Fee • Instant VIP Confirmation
                        </div>
                      </div>

                      <button
                        type="button"
                        className="luxe-reserve-btn"
                        style={{ width: 'auto', padding: '10px 18px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenHotel(hotel);
                        }}
                      >
                        <span>Explore Luxe</span>
                        <span>›</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Explore All Luxe Button */}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link
              href="/hotels?category=luxury&minRating=5"
              style={{ textDecoration: 'none' }}
            >
              <button
                type="button"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1.5px solid rgba(245, 158, 11, 0.5)',
                  color: '#fde68a',
                  padding: '12px 28px',
                  borderRadius: 30,
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  letterSpacing: '0.04em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                  e.currentTarget.style.color = '#0f172a';
                  e.currentTarget.style.borderColor = '#fbbf24';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.color = '#fde68a';
                  e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)';
                }}
              >
                <span>👑 View All Luxury Stays & Palaces on StayBuddy</span>
                <span>→</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== LUXURY HOTEL INTERACTIVE SHOWCASE MODAL ===== */}
      {selectedHotel && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(2, 6, 23, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto'
        }}>
          {/* Backdrop click to close */}
          <div
            style={{ position: 'absolute', inset: 0 }}
            onClick={handleCloseModal}
          />

          <div
            className="luxe-modal-container"
            style={{
              position: 'relative',
              background: '#0f172a',
              borderRadius: 28,
              maxWidth: 720,
              width: '100%',
              maxHeight: '94vh',
              overflowY: 'auto',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8)',
              border: '1.5px solid rgba(245, 158, 11, 0.5)',
              zIndex: 10,
              color: '#f8fafc'
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#ffffff',
                border: '1.5px solid rgba(245, 158, 11, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                cursor: 'pointer',
                zIndex: 20,
                backdropFilter: 'blur(4px)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)'
              }}
            >
              ✕
            </button>

            {/* Gallery Image Banner */}
            <div style={{ position: 'relative', height: 300, width: '100%', overflow: 'hidden', background: '#020617' }}>
              <img
                src={selectedHotel.images[activePhotoIndex] || selectedHotel.photo}
                alt={selectedHotel.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.3s ease' }}
              />

              {/* Prev / Next photo buttons if multiple */}
              {selectedHotel.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex(prev => (prev > 0 ? prev - 1 : selectedHotel.images.length - 1));
                    }}
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(15, 23, 42, 0.75)',
                      color: 'white',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex(prev => (prev < selectedHotel.images.length - 1 ? prev + 1 : 0));
                    }}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(15, 23, 42, 0.75)',
                      color: 'white',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ›
                  </button>
                </>
              )}

              {/* Photo Indicator */}
              <div style={{
                position: 'absolute',
                bottom: 14,
                left: 14,
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#fbbf24',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                📷 Photo {activePhotoIndex + 1} of {selectedHotel.images.length}
              </div>

              {/* Regal Crest Badge */}
              <div style={{
                position: 'absolute',
                top: 16,
                left: 16,
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: '0.75rem',
                fontWeight: 800,
                border: '1px solid #fde68a'
              }}>
                {selectedHotel.badge}
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px 28px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ffffff', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                    {selectedHotel.name}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📍 {selectedHotel.city}{selectedHotel.state ? `, ${selectedHotel.state}` : ''}</span>
                    <span>•</span>
                    <span>★ {selectedHotel.rating} ({selectedHotel.reviewsCount} Luxury Guest Reviews)</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Exclusive Luxe Rate</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
                    ₹{selectedHotel.startingPrice.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>/night + applicable luxury tax</div>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, margin: '16px 0' }}>
                {selectedHotel.description}
              </p>

              {/* VIP Privileges Section */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%)',
                border: '1.5px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 16,
                padding: '16px 18px',
                marginBottom: 20
              }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  color: '#fbbf24',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span>👑</span>
                  <span>Included StayBuddy Luxe VIP Privileges:</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
                  {selectedHotel.privileges.map((priv, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.8rem', color: '#fef3c7' }}>
                      <span style={{ color: '#34d399', fontWeight: 900 }}>✓</span>
                      <span>{priv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12, marginTop: 16 }}>
                <Link
                  href={
                    selectedHotel.isDbHotel
                      ? (checkIn && checkOut
                          ? `/hotels/${selectedHotel.id}?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`
                          : `/hotels/${selectedHotel.id}`)
                      : (checkIn && checkOut
                          ? `/hotels?category=luxury&location=${encodeURIComponent(selectedHotel.city)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`
                          : `/hotels?category=luxury&location=${encodeURIComponent(selectedHotel.city)}`)
                  }
                  style={{ textDecoration: 'none' }}
                >
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#0f172a',
                      border: 'none',
                      padding: '14px 20px',
                      borderRadius: 14,
                      fontWeight: 900,
                      fontSize: '0.96rem',
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <span>Reserve Luxe Stay Now</span>
                    <span>→</span>
                  </button>
                </Link>

                <a
                  href={`https://wa.me/919999999999?text=${encodeURIComponent(`Hi StayBuddy Luxe Concierge! I want to inquire and reserve ${selectedHotel.name} in ${selectedHotel.city}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#fbbf24',
                      border: '1.5px solid rgba(245, 158, 11, 0.4)',
                      padding: '14px 16px',
                      borderRadius: 14,
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <span>🛎️ VIP Concierge</span>
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
