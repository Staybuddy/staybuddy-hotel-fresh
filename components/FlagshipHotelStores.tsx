'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface FlagshipHotelItem {
  id: string;
  name: string;
  city: string;
  state?: string;
  photo: string;
  startingPrice: number;
  starRating: 4 | 5;
  highlights: string[];
  dbHotelId?: string;
}

export interface FlagshipBrand {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  stats: string;
  logoType: 'itc' | 'sterling' | 'hyatt' | 'cinnamon' | 'taj' | 'radisson';
  logoBgColor: string;
  heroPhoto: string;
  cardPhoto: string;
  badgeText: string;
  hotels: FlagshipHotelItem[];
}

// Curated 4-Star & 5-Star Flagship Hotel Brands matching user references
const FLAGSHIP_BRANDS: FlagshipBrand[] = [
  {
    id: 'itc-hotels',
    name: 'ITC Hotels Limited',
    shortName: 'ITC Hotels',
    tagline: 'Experience the warmth of Indian hospitality',
    stats: '150+ Hotels | 90+ Destinations | 7 Luxury Brands',
    logoType: 'itc',
    logoBgColor: '#ffffff',
    heroPhoto: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    cardPhoto: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=85',
    badgeText: '5★ Luxury Flagship',
    hotels: [
      {
        id: 'itc-1',
        name: 'Storii By ITC Hotels, Jawai, Falna',
        city: 'Falna',
        state: 'Rajasthan',
        photo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 19999,
        starRating: 5,
        highlights: ['Infinity Pool in the Wild', 'Plunge Pool Cottages'],
      },
      {
        id: 'itc-2',
        name: 'Welcomhotel Chandigarh, Mohali',
        city: 'Mohali',
        state: 'Punjab',
        photo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 9499,
        starRating: 5,
        highlights: ['Close to the Airport', 'Rooftop Dining & Sky Lounge'],
      },
      {
        id: 'itc-3',
        name: 'ITC Grand Bharat Luxury Retreat',
        city: 'Gurugram',
        state: 'NCR',
        photo: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 24500,
        starRating: 5,
        highlights: ['27-Hole Championship Golf', 'Kaya Kalp Royal Spa'],
      },
      {
        id: 'itc-4',
        name: 'ITC Kohenur, A Luxury Collection Hotel',
        city: 'Hyderabad',
        state: 'Telangana',
        photo: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 14200,
        starRating: 5,
        highlights: ['Durgam Cheruvu Lake View', 'Dum Pukht Begums Dining'],
      }
    ]
  },
  {
    id: 'sterling-resorts',
    name: 'Sterling Hotels & Resorts',
    shortName: 'Sterling',
    tagline: 'Holiday differently with curated experiential getaways',
    stats: '40+ Resorts | 35+ Scenic Destinations | 4-Star & 5-Star',
    logoType: 'sterling',
    logoBgColor: '#ffffff',
    heroPhoto: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    cardPhoto: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=85',
    badgeText: '4★ & 5★ Resorts',
    hotels: [
      {
        id: 'sterling-1',
        name: 'Sterling Lake Palace Alleppey',
        city: 'Alleppey',
        state: 'Kerala',
        photo: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 12500,
        starRating: 5,
        highlights: ['Private Backwater Lagoon', 'Ayurvedic Spa & Houseboats'],
      },
      {
        id: 'sterling-2',
        name: 'Sterling Ooty Fern Hill',
        city: 'Ooty',
        state: 'Tamil Nadu',
        photo: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 7200,
        starRating: 4,
        highlights: ['Panoramic Nilgiri Views', 'Bonfire & Stargazing Lawn'],
      },
      {
        id: 'sterling-3',
        name: 'Sterling Corbett Wildlife Resort',
        city: 'Jim Corbett',
        state: 'Uttarakhand',
        photo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 8900,
        starRating: 4,
        highlights: ['Ramganga River Front', 'Open Gypsy Jungle Safaris'],
      }
    ]
  },
  {
    id: 'hyatt-hotels',
    name: 'Hyatt Hotels',
    shortName: 'World of Hyatt',
    tagline: 'A world of care to bring people together in true luxury',
    stats: '1,150+ Hotels | 70+ Countries | 5-Star Global Standards',
    logoType: 'hyatt',
    logoBgColor: '#0a3a6b',
    heroPhoto: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    cardPhoto: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=85',
    badgeText: '5★ Global Luxury',
    hotels: [
      {
        id: 'hyatt-1',
        name: 'Grand Hyatt Goa, Bambolim',
        city: 'Bambolim',
        state: 'Goa',
        photo: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 18500,
        starRating: 5,
        highlights: ['Bambolim Bayfront View', 'Shamana Spa & Sailing Bay'],
      },
      {
        id: 'hyatt-2',
        name: 'Hyatt Regency Hyderabad, Gachibowli',
        city: 'Hyderabad',
        state: 'Telangana',
        photo: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 8999,
        starRating: 5,
        highlights: ['Express Airport Access', 'Award-Winning Italian Dining'],
      },
      {
        id: 'hyatt-3',
        name: 'Andaz Delhi, Aerocity Luxury',
        city: 'New Delhi',
        state: 'Delhi',
        photo: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 14000,
        starRating: 5,
        highlights: ['Curated 401 Artworks', 'Temperature Controlled Pool'],
      }
    ]
  },
  {
    id: 'cinnamon-hotels',
    name: 'Cinnamon Hotels',
    shortName: 'Cinnamon',
    tagline: 'Inspired living across iconic coastal & heritage sanctuaries',
    stats: '15+ Luxury Sanctuaries | Iconic Beachfront Destinations',
    logoType: 'cinnamon',
    logoBgColor: '#ffffff',
    heroPhoto: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    cardPhoto: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=85',
    badgeText: '5★ Heritage & Coast',
    hotels: [
      {
        id: 'cin-1',
        name: 'Cinnamon Bentota Beach Resort',
        city: 'Bentota',
        state: 'Coastal Sanctuary',
        photo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 16500,
        starRating: 5,
        highlights: ['Direct Beachfront Access', 'Water Sports Private Marina'],
      },
      {
        id: 'cin-2',
        name: 'Cinnamon Grand Luxury Haven',
        city: 'Colombo',
        state: 'Heritage District',
        photo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 11200,
        starRating: 5,
        highlights: ['14 Specialty Restaurants', 'Angsana Luxury Spa'],
      },
      {
        id: 'cin-3',
        name: 'Cinnamon Wild Yala Safari Lodge',
        city: 'Yala',
        state: 'National Sanctuary',
        photo: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 21000,
        starRating: 5,
        highlights: ['Bordering Leopard Sanctuary', 'Rooftop Stargazing Deck'],
      }
    ]
  },
  {
    id: 'taj-palaces',
    name: 'Taj Hotels & Palaces',
    shortName: 'Taj Palaces',
    tagline: 'The world’s strongest luxury hotel brand • Timeless royal elegance',
    stats: '200+ Palaces, Hotels & Resorts | Royal Indian Hospitality',
    logoType: 'taj',
    logoBgColor: '#ffffff',
    heroPhoto: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    cardPhoto: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=85',
    badgeText: '5★ Royal Palaces',
    hotels: [
      {
        id: 'taj-1',
        name: 'Taj Falaknuma Palace, Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        photo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 38000,
        starRating: 5,
        highlights: ['Horse-Drawn Royal Carriage', 'Nizam 101-Seat Dining Hall'],
      },
      {
        id: 'taj-2',
        name: 'Taj Lake Palace, Udaipur',
        city: 'Udaipur',
        state: 'Rajasthan',
        photo: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 42000,
        starRating: 5,
        highlights: ['Floating Lake Pichola Palace', 'Jiva Royal Spa Boat'],
      },
      {
        id: 'taj-3',
        name: 'The Taj Mahal Palace, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        photo: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 29000,
        starRating: 5,
        highlights: ['Gateway of India View', 'Legendary Heritage Wing'],
      }
    ]
  },
  {
    id: 'radisson-hotels',
    name: 'Radisson Hotel Group',
    shortName: 'Radisson',
    tagline: 'Every moment matters • Vibrant upscale comfort & style',
    stats: '100+ Hotels in India | 4-Star & 5-Star Premier Properties',
    logoType: 'radisson',
    logoBgColor: '#0f172a',
    heroPhoto: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    cardPhoto: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=85',
    badgeText: '4★ & 5★ Premier',
    hotels: [
      {
        id: 'rad-1',
        name: 'Radisson Blu Resort Goa, Cavelossim',
        city: 'Cavelossim',
        state: 'Goa',
        photo: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 8500,
        starRating: 5,
        highlights: ['10-Min Walk to Beach', '4,000 sq ft Swimming Lagoon'],
      },
      {
        id: 'rad-2',
        name: 'Radisson Hyderabad Hitec City',
        city: 'Hyderabad',
        state: 'Telangana',
        photo: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=85',
        startingPrice: 7200,
        starRating: 4,
        highlights: ['Rooftop Infinity Pool', '24/7 Business Lounge'],
      }
    ]
  }
];

function BrandLogo({ type, size = 32 }: { type: string; size?: number }) {
  if (type === 'itc') {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 4L22.5 14L28 9L25 18L35 15L27 22L36 26L26 28L30 36L20 30L10 36L14 28L4 26L13 22L5 15L15 18L12 9L17.5 14L20 4Z" fill="#b45309" />
        <path d="M19 12L20 7L21 12L25 10L23 15L28 14L24 18L29 20L23 21L25 26L20 23L15 26L17 21L11 20L16 18L12 14L17 15L15 10L19 12Z" fill="#d97706" />
      </svg>
    );
  }
  if (type === 'sterling') {
    return (
      <div style={{ fontSize: size * 0.45, fontWeight: 900, color: '#e11d48', letterSpacing: '-0.5px', fontFamily: 'serif', fontStyle: 'italic', textAlign: 'center' }}>
        Sterling
      </div>
    );
  }
  if (type === 'hyatt') {
    return (
      <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
        <div style={{ fontSize: size * 0.22, fontWeight: 800, color: '#ffffff', letterSpacing: '0.8px' }}>WORLD</div>
        <div style={{ fontSize: size * 0.18, fontWeight: 600, color: '#93c5fd' }}>OF</div>
        <div style={{ fontSize: size * 0.24, fontWeight: 900, color: '#ffffff', letterSpacing: '0.8px' }}>HYATT</div>
      </div>
    );
  }
  if (type === 'cinnamon') {
    return (
      <div style={{ fontSize: size * 0.38, fontWeight: 800, color: '#7c2d12', fontFamily: 'serif', textAlign: 'center' }}>
        Cinnamon
      </div>
    );
  }
  if (type === 'taj') {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke="#d97706" strokeWidth="1.5" />
        <path d="M12 28L20 12L28 28H24L20 20L16 28H12Z" fill="#d97706" />
        <circle cx="20" cy="9" r="2.5" fill="#d97706" />
      </svg>
    );
  }
  return (
    <div style={{ fontSize: size * 0.35, fontWeight: 900, color: '#38bdf8', letterSpacing: '0.5px' }}>
      Radisson
    </div>
  );
}

export default function FlagshipHotelStores({ dbHotels = [] }: { dbHotels?: any[] }) {
  const router = useRouter();
  const [selectedBrand, setSelectedBrand] = useState<FlagshipBrand | null>(null);
  const [activeHotelIdx, setActiveHotelIdx] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Merge real 4-Star & 5-Star database hotels dynamically into the flagship brands
  const enrichedBrands = useMemo(() => {
    const valid45Stars = (dbHotels || []).filter((h: any) => {
      const star = Number(h.starRating) || (h.category === 'Luxury' ? 5 : h.category === 'Premium' ? 4 : 0);
      return star >= 4;
    });

    return FLAGSHIP_BRANDS.map(brand => {
      // Find any matching database hotel by brand name or keyword
      const matchingDb = valid45Stars.filter((dh: any) => {
        const n = (dh.name || '').toLowerCase();
        return n.includes(brand.shortName.toLowerCase()) || n.includes(brand.id.split('-')[0]);
      });

      if (matchingDb.length > 0) {
        const converted: FlagshipHotelItem[] = matchingDb.map((dh: any) => ({
          id: dh._id,
          name: dh.name,
          city: dh.city || dh.area || 'India',
          state: dh.state || '',
          photo: dh.images?.[0] || brand.heroPhoto,
          startingPrice: Number(dh.startingPrice) || 8999,
          starRating: Math.min(5, Math.max(4, Number(dh.starRating) || 5)) as (4 | 5),
          highlights: dh.amenities?.slice(0, 2) || ['Verified StayBuddy Premier', 'Express Check-In'],
          dbHotelId: dh._id
        }));
        return {
          ...brand,
          hotels: [...converted, ...brand.hotels]
        };
      }
      return brand;
    });
  }, [dbHotels]);

  // When selected brand changes, reset active hotel slide
  useEffect(() => {
    setActiveHotelIdx(0);
  }, [selectedBrand]);

  const handleOpenBrand = (brand: FlagshipBrand) => {
    setSelectedBrand(brand);
  };

  const handleCloseModal = () => {
    setSelectedBrand(null);
  };

  const currentHotels = selectedBrand?.hotels || [];

  const handlePrevHotel = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
    setActiveHotelIdx(prev => (prev > 0 ? prev - 1 : currentHotels.length - 1));
  };

  const handleNextHotel = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
    setActiveHotelIdx(prev => (prev < currentHotels.length - 1 ? prev + 1 : 0));
  };

  const handleViewAll = () => {
    if (selectedBrand) {
      router.push(`/hotels?category=premium&minRating=4&search=${encodeURIComponent(selectedBrand.shortName)}`);
    } else {
      router.push('/hotels?category=premium&minRating=4');
    }
  };

  return (
    <>
      <style>{`
        .flagship-section-container {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #eff6ff 100%);
          border: 1.5px solid #e2e8f0;
          border-radius: 22px;
          padding: 24px;
          margin-bottom: 26px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
          position: relative;
          overflow: hidden;
        }

        .flagship-layout {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .flagship-title-box {
          flex: 0 0 250px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .flagship-scroll-row {
          flex: 1 1 auto;
          display: flex;
          align-items: center;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 6px 4px 12px;
          scrollbar-width: thin;
          -webkit-overflow-scrolling: touch;
        }

        .flagship-scroll-row::-webkit-scrollbar {
          height: 5px;
        }
        .flagship-scroll-row::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .flagship-scroll-row::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        .flagship-brand-card {
          flex: 0 0 220px;
          height: 135px;
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          scroll-snap-align: start;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          border: 1.5px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.1);
        }

        .flagship-brand-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.2);
          border-color: #3b82f6;
        }

        .flagship-brand-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .flagship-brand-card:hover .flagship-brand-img {
          transform: scale(1.06);
        }

        .flagship-brand-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%);
          z-index: 2;
        }

        .flagship-logo-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justifyContent: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          border: 2px solid #ffffff;
          z-index: 3;
          padding: 2px;
        }

        .flagship-brand-name-tag {
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          color: #ffffff;
          font-weight: 800;
          font-size: 0.88rem;
          line-height: 1.25;
          z-index: 3;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justifyContent: space-between;
        }

        @media (max-width: 900px) {
          .flagship-layout {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          .flagship-title-box {
            flex: none;
            width: 100%;
          }
          .flagship-section-container {
            padding: 18px 14px;
            border-radius: 18px;
            margin-bottom: 20px;
          }
          .flagship-brand-card {
            flex: 0 0 190px;
            height: 125px;
          }
        }

        /* Modal Styles */
        @keyframes flagshipModalFadeIn {
          from { opacity: 0; transform: scale(0.94) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .flagship-modal-dialog {
          animation: flagshipModalFadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .flagship-hotel-slider {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 4px 8px 18px;
          scrollbar-width: thin;
          -webkit-overflow-scrolling: touch;
        }

        .flagship-hotel-card-item {
          flex: 0 0 320px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          scroll-snap-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .flagship-hotel-card-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
        }

        @media (max-width: 640px) {
          .flagship-hotel-card-item {
            flex: 0 0 280px;
          }
        }
      `}</style>

      {/* Flagship Section on Homepage */}
      <section className="container" style={{ padding: '0 16px' }}>
        <div className="flagship-section-container">
          <div className="flagship-layout">
            
            {/* Left Header Title Box (Matching MakeMyTrip Flagship banner) */}
            <div className="flagship-title-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.72rem', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#b45309', border: '1px solid #f59e0b', padding: '2px 8px', borderRadius: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  👑 4★ & 5★ Premier
                </span>
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
                Flagship Hotel Stores on StayBuddy
              </h2>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.4 }}>
                Explore iconic luxury chains & world-class verified resorts with guaranteed best rates.
              </p>
            </div>

            {/* Right Horizontal Scrolling Cards */}
            <div className="flagship-scroll-row">
              {enrichedBrands.map((brand) => (
                <div
                  key={brand.id}
                  className="flagship-brand-card"
                  onClick={() => handleOpenBrand(brand)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenBrand(brand); }}
                >
                  <img
                    src={brand.cardPhoto}
                    alt={brand.name}
                    className="flagship-brand-img"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flagship-brand-gradient" />
                  
                  {/* Circular White Brand Logo */}
                  <div className="flagship-logo-badge" style={{ backgroundColor: brand.logoBgColor }}>
                    <BrandLogo type={brand.logoType} size={28} />
                  </div>

                  {/* Brand Name on Bottom */}
                  <div className="flagship-brand-name-tag">
                    <span>{brand.name}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>›</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Flagship Brand Showcase Modal (Exactly like Photo 2 & Photo 3) */}
      {selectedBrand && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          overflowY: 'auto'
        }}>
          {/* Backdrop Click to close */}
          <div
            style={{ position: 'absolute', inset: 0 }}
            onClick={handleCloseModal}
          />

          <div
            className="flagship-modal-dialog"
            style={{
              position: 'relative',
              background: '#ffffff',
              borderRadius: 24,
              maxWidth: 720,
              width: '100%',
              maxHeight: '94vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
              border: '1.5px solid #e2e8f0',
              zIndex: 10
            }}
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#ffffff',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                cursor: 'pointer',
                zIndex: 20,
                backdropFilter: 'blur(4px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'background 0.2s'
              }}
            >
              ✕
            </button>

            {/* Top Full Hero Photo with Circular Fountain / Grand Palace Driveway (Photo 2) */}
            <div style={{ position: 'relative', height: 210, width: '100%', overflow: 'hidden', background: '#0f172a' }}>
              <img
                src={selectedBrand.heroPhoto}
                alt={selectedBrand.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 70%, rgba(15, 23, 42, 0.75) 100%)'
              }} />
              
              <div style={{
                position: 'absolute',
                top: 14,
                left: 16,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(6px)',
                color: '#0f172a',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: '0.74rem',
                fontWeight: 800,
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span>👑</span>
                <span>{selectedBrand.badgeText}</span>
              </div>
            </div>

            {/* Overlapping Centered Brand Logo (Photo 2) */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: -40, position: 'relative', zIndex: 12 }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: selectedBrand.logoBgColor,
                border: '4px solid #ffffff',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4
              }}>
                <BrandLogo type={selectedBrand.logoType} size={50} />
              </div>
            </div>

            {/* Brand Title & Tagline (Photo 2) */}
            <div style={{ textAlign: 'center', padding: '12px 20px 16px' }}>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                {selectedBrand.name}
              </h2>
              <p style={{ fontSize: '0.92rem', color: '#475569', margin: '0 0 4px', fontWeight: 500 }}>
                {selectedBrand.tagline}
              </p>
              <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 700, letterSpacing: '0.02em' }}>
                {selectedBrand.stats}
              </div>

              {/* Thin Divider Line */}
              <div style={{ width: '85%', height: 1, background: '#e2e8f0', margin: '18px auto 14px' }} />

              {/* Subheading: New Stays (Photo 2 & Photo 3) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: 12 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>New Stays</span>
                  <span style={{ fontSize: '0.9rem', color: '#ea580c' }}>✨</span>
                </h3>
                
                {/* Left & Right Carousel Arrows (Photo 3) */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handlePrevHotel}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                    }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={handleNextHotel}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            {/* Hotel Cards Carousel (Photo 3) */}
            <div style={{ padding: '0 16px 12px' }}>
              <div ref={scrollContainerRef} className="flagship-hotel-slider">
                {currentHotels.map((hotel) => {
                  const targetUrl = hotel.dbHotelId 
                    ? `/hotels/${hotel.dbHotelId}` 
                    : `/hotels?category=premium&search=${encodeURIComponent(hotel.name)}`;

                  return (
                    <Link
                      key={hotel.id}
                      href={targetUrl}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                      className="flagship-hotel-card-item"
                    >
                      {/* Photo with 4★/5★ Badge */}
                      <div style={{ position: 'relative', height: 165, width: '100%', overflow: 'hidden' }}>
                        <img
                          src={hotel.photo}
                          alt={hotel.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                        <div style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          background: 'linear-gradient(135deg, #d97706, #b45309)',
                          color: '#ffffff',
                          padding: '3px 9px',
                          borderRadius: 8,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <span>👑 {hotel.starRating}-Star Hotel</span>
                        </div>
                      </div>

                      {/* Card Content (Photo 3) */}
                      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{
                            fontSize: '1.08rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            margin: '0 0 4px',
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {hotel.name}
                          </h4>
                          <div style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>📍</span>
                            <span>{hotel.city}{hotel.state ? `, ${hotel.state}` : ''}</span>
                          </div>

                          {/* Green Checkmarks Amenities (Photo 3) */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                            {hotel.highlights.map((hl, i) => (
                              <div key={i} style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>✓</span>
                                <span>{hl}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Starting from Price Row (Photo 3) */}
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                              Starting from
                            </div>
                            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                              ₹ {hotel.startingPrice.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                              Per night
                            </div>
                          </div>

                          <div style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            padding: '6px 12px',
                            borderRadius: 10,
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <span>View Deal</span>
                            <span>→</span>
                          </div>
                        </div>

                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom Full-Width CTA: VIEW ALL HOTELS (Photo 2) */}
            <div style={{ padding: '8px 20px 22px' }}>
              <button
                type="button"
                onClick={handleViewAll}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px 24px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  textTransform: 'uppercase',
                  transition: 'background 0.2s, transform 0.2s'
                }}
              >
                <span>VIEW ALL {selectedBrand.shortName.toUpperCase()} HOTELS</span>
                <span style={{ fontSize: '1.1rem' }}>→</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
