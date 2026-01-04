import React, { useState } from 'react';
import { Search, Bell, ChevronLeft, SlidersHorizontal, Heart, MapPin, Clock, Home, User, Shield, AlertTriangle, AlertCircle, CheckCircle, Info, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Design System - Matching Reference Image
const COLORS = {
  bg: '#FAFAFA',
  white: '#FFFFFF',
  coral: '#E07B54',
  coralLight: '#F5DDD5',
  textDark: '#1A1A1A',
  textMedium: '#6B6B6B',
  textLight: '#9CA3AF',
  border: '#F0F0F0',
  searchBg: '#F5F5F5',
  
  safe: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
  caution: { bg: '#FEF9C3', text: '#A16207', border: '#FDE047' },
  warning: { bg: '#FFEDD5', text: '#C2410C', border: '#FDBA74' },
  danger: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
};

const SHADOWS = {
  card: '0 2px 12px rgba(0,0,0,0.06)',
  button: '0 4px 14px rgba(224,123,84,0.3)',
};

const RADIUS = {
  full: '9999px',
  xl: '20px',
  lg: '16px',
  md: '12px',
};

// Data
const CITY_TO_COUNTRY: Record<string, string> = {
  'medellin': 'Colombia', 'bogota': 'Colombia', 'cartagena': 'Colombia',
  'paris': 'France', 'london': 'United Kingdom', 'tokyo': 'Japan', 'osaka': 'Japan',
  'rome': 'Italy', 'barcelona': 'Spain', 'madrid': 'Spain', 'berlin': 'Germany',
  'amsterdam': 'Netherlands', 'bangkok': 'Thailand', 'phuket': 'Thailand',
  'mexico city': 'Mexico', 'cancun': 'Mexico', 'cabo': 'Mexico',
  'dubai': 'United Arab Emirates', 'singapore': 'Singapore', 'bali': 'Indonesia',
  'istanbul': 'Turkey', 'athens': 'Greece', 'lisbon': 'Portugal', 'prague': 'Czech Republic',
};

interface TravelAdvisory {
  country: string;
  advisory_level: number;
  advisory_text: string;
  date_updated: string;
  url: string;
  image: string;
}

interface ACLEDData {
  total_events: number;
  fatalities: number;
  events_last_30_days: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface GDELTData {
  tone_score: number;
  trend_7day: 'improving' | 'worsening' | 'stable';
}

const DESTINATION_IMAGES: Record<string, string> = {
  'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop',
  'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop',
  'cancun': 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=400&h=300&fit=crop',
  'medellin': 'https://images.unsplash.com/photo-1599413987323-b2b8c0d7d9c8?w=400&h=300&fit=crop',
  'bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=300&fit=crop',
  'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop',
  'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop',
  'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
  'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop',
  'barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=300&fit=crop',
  'default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
};

const FALLBACK_DATA: Record<string, { advisory: TravelAdvisory; acled: ACLEDData; gdelt: GDELTData }> = {
  'japan': {
    advisory: { country: 'Japan', advisory_level: 1, advisory_text: 'Exercise normal precautions.', date_updated: '2024-12-01', url: 'https://travel.state.gov', image: DESTINATION_IMAGES['tokyo'] },
    acled: { total_events: 34, fatalities: 2, events_last_30_days: 3, trend: 'stable' },
    gdelt: { tone_score: 3.2, trend_7day: 'stable' },
  },
  'france': {
    advisory: { country: 'France', advisory_level: 2, advisory_text: 'Exercise increased caution due to terrorism and civil unrest.', date_updated: '2024-11-20', url: 'https://travel.state.gov', image: DESTINATION_IMAGES['paris'] },
    acled: { total_events: 423, fatalities: 12, events_last_30_days: 45, trend: 'stable' },
    gdelt: { tone_score: 0.8, trend_7day: 'stable' },
  },
  'mexico': {
    advisory: { country: 'Mexico', advisory_level: 2, advisory_text: 'Exercise increased caution due to crime and kidnapping.', date_updated: '2024-12-10', url: 'https://travel.state.gov', image: DESTINATION_IMAGES['cancun'] },
    acled: { total_events: 2156, fatalities: 1834, events_last_30_days: 187, trend: 'increasing' },
    gdelt: { tone_score: -2.1, trend_7day: 'worsening' },
  },
  'colombia': {
    advisory: { country: 'Colombia', advisory_level: 3, advisory_text: 'Reconsider travel due to crime, terrorism, and kidnapping.', date_updated: '2024-12-15', url: 'https://travel.state.gov', image: DESTINATION_IMAGES['medellin'] },
    acled: { total_events: 1247, fatalities: 892, events_last_30_days: 98, trend: 'stable' },
    gdelt: { tone_score: -2.8, trend_7day: 'stable' },
  },
  'thailand': {
    advisory: { country: 'Thailand', advisory_level: 1, advisory_text: 'Exercise normal precautions.', date_updated: '2024-11-01', url: 'https://travel.state.gov', image: DESTINATION_IMAGES['bangkok'] },
    acled: { total_events: 312, fatalities: 89, events_last_30_days: 28, trend: 'decreasing' },
    gdelt: { tone_score: 1.5, trend_7day: 'improving' },
  },
  'indonesia': {
    advisory: { country: 'Indonesia', advisory_level: 2, advisory_text: 'Exercise increased caution due to terrorism.', date_updated: '2024-10-15', url: 'https://travel.state.gov', image: DESTINATION_IMAGES['bali'] },
    acled: { total_events: 187, fatalities: 34, events_last_30_days: 15, trend: 'stable' },
    gdelt: { tone_score: 1.2, trend_7day: 'stable' },
  },
  'italy': {
    advisory: { country: 'Italy', advisory_level: 2, advisory_text: 'Exercise increased caution due to terrorism.', date_updated: '2024-11-05', url: 'https://travel.state.gov', image: DESTINATION_IMAGES['rome'] },
    acled: { total_events: 156, fatalities: 8, events_last_30_days: 12, trend: 'stable' },
    gdelt: { tone_score: 2.1, trend_7day: 'stable' },
  },
  'united kingdom': {
    advisory: { country: 'United Kingdom', advisory_level: 2, advisory_text: 'Exercise increased caution due to terrorism.', date_updated: '2024-10-20', url: 'https://travel.state.gov', image: DESTINATION_IMAGES['london'] },
    acled: { total_events: 234, fatalities: 15, events_last_30_days: 23, trend: 'stable' },
    gdelt: { tone_score: 0.5, trend_7day: 'stable' },
  },
  'united arab emirates': {
    advisory: { country: 'United Arab Emirates', advisory_level: 2, advisory_text: 'Exercise increased caution due to missile threats.', date_updated: '2024-09-15', url: 'https://travel.state.gov', image: DESTINATION_IMAGES['dubai'] },
    acled: { total_events: 45, fatalities: 3, events_last_30_days: 4, trend: 'stable' },
    gdelt: { tone_score: 1.8, trend_7day: 'stable' },
  },
  'spain': {
    advisory: { country: 'Spain', advisory_level: 2, advisory_text: 'Exercise increased caution due to terrorism.', date_updated: '2024-11-10', url: 'https://travel.state.gov', image: DESTINATION_IMAGES['barcelona'] },
    acled: { total_events: 123, fatalities: 5, events_last_30_days: 10, trend: 'stable' },
    gdelt: { tone_score: 2.4, trend_7day: 'improving' },
  },
};

const ADVISORY_CONFIG = {
  1: { label: 'Safe', color: COLORS.safe.text, bg: COLORS.safe.bg, icon: CheckCircle },
  2: { label: 'Caution', color: COLORS.caution.text, bg: COLORS.caution.bg, icon: Info },
  3: { label: 'Risky', color: COLORS.warning.text, bg: COLORS.warning.bg, icon: AlertTriangle },
  4: { label: 'Avoid', color: COLORS.danger.text, bg: COLORS.danger.bg, icon: AlertCircle },
};

function calcScore(level: number, acled: ACLEDData, gdelt: GDELTData): number {
  let s = 100 - (level - 1) * 15;
  if (acled.total_events > 1000) s -= 12;
  else if (acled.total_events > 500) s -= 8;
  if (acled.trend === 'increasing') s -= 5;
  else if (acled.trend === 'decreasing') s += 3;
  if (gdelt.tone_score < -3) s -= 8;
  else if (gdelt.tone_score > 2) s += 3;
  if (gdelt.trend_7day === 'worsening') s -= 5;
  return Math.max(10, Math.min(100, Math.round(s)));
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Very Safe';
  if (score >= 65) return 'Generally Safe';
  if (score >= 50) return 'Use Caution';
  if (score >= 35) return 'Elevated Risk';
  return 'High Risk';
}

// Destination Card Component
function DestinationCard({ 
  name, 
  country, 
  score, 
  level,
  image,
  onClick,
  isFavorite = false,
}: { 
  name: string; 
  country: string;
  score: number;
  level: number;
  image: string;
  onClick: () => void;
  isFavorite?: boolean;
}) {
  const config = ADVISORY_CONFIG[level as keyof typeof ADVISORY_CONFIG] || ADVISORY_CONFIG[1];
  
  return (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        boxShadow: SHADOWS.card,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = SHADOWS.card;
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '120px', overflow: 'hidden' }}>
        <img 
          src={image} 
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Safety Badge */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          backgroundColor: config.bg,
          color: config.color,
          padding: '4px 8px',
          borderRadius: RADIUS.md,
          fontSize: '10px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <config.icon size={12} />
          L{level}
        </div>
      </div>
      
      {/* Content */}
      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '15px', 
              fontWeight: 600, 
              color: COLORS.textDark,
              textTransform: 'capitalize',
            }}>
              {name}
            </h3>
            <p style={{ 
              margin: '2px 0 0', 
              fontSize: '12px', 
              color: COLORS.textLight,
            }}>
              {country}
            </p>
          </div>
          
          {/* Heart Button */}
          <button style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isFavorite ? COLORS.coralLight : COLORS.bg,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <Heart 
              size={16} 
              fill={isFavorite ? COLORS.coral : 'none'} 
              color={COLORS.coral} 
            />
          </button>
        </div>
        
        {/* Score */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: `1px solid ${COLORS.border}`,
        }}>
          <span style={{ fontSize: '11px', color: COLORS.textLight, fontWeight: 500 }}>
            Safety Score
          </span>
          <span style={{ 
            fontSize: '16px', 
            fontWeight: 700, 
            color: score >= 65 ? COLORS.safe.text : score >= 50 ? COLORS.caution.text : COLORS.warning.text,
          }}>
            {score}
          </span>
        </div>
      </div>
    </div>
  );
}

// Detail View Component
function DetailView({ 
  name, 
  data, 
  onBack 
}: { 
  name: string; 
  data: { advisory: TravelAdvisory; acled: ACLEDData; gdelt: GDELTData };
  onBack: () => void;
}) {
  const score = calcScore(data.advisory.advisory_level, data.acled, data.gdelt);
  const config = ADVISORY_CONFIG[data.advisory.advisory_level as keyof typeof ADVISORY_CONFIG];
  
  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      {/* Header Image */}
      <div style={{ position: 'relative', height: '200px' }}>
        <img 
          src={data.advisory.image} 
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 50%, rgba(0,0,0,0.5) 100%)',
        }} />
        
        {/* Back Button */}
        <button 
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: COLORS.white,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: SHADOWS.card,
          }}
        >
          <ChevronLeft size={20} color={COLORS.textDark} />
        </button>
        
        {/* Title Overlay */}
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: 700, 
            color: COLORS.white,
            textTransform: 'capitalize',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}>
            {name}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
            {data.advisory.country}
          </p>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ padding: '16px', marginTop: '-24px', position: 'relative' }}>
        {/* Main Score Card */}
        <div style={{
          backgroundColor: COLORS.white,
          borderRadius: RADIUS.xl,
          padding: '20px',
          boxShadow: SHADOWS.card,
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Score Circle */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: config.bg,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: config.color }}>{score}</span>
              <span style={{ fontSize: '9px', fontWeight: 600, color: config.color }}>SCORE</span>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                backgroundColor: config.bg,
                padding: '6px 12px',
                borderRadius: RADIUS.full,
                marginBottom: '8px',
              }}>
                <config.icon size={14} color={config.color} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: config.color }}>
                  Level {data.advisory.advisory_level}: {config.label}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: COLORS.textMedium, lineHeight: 1.4 }}>
                {getScoreLabel(score)} destination
              </p>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            backgroundColor: COLORS.white,
            borderRadius: RADIUS.lg,
            padding: '16px',
            boxShadow: SHADOWS.card,
          }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textLight, textTransform: 'uppercase', marginBottom: '4px' }}>
              Events (30d)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: COLORS.textDark }}>
                {data.acled.events_last_30_days}
              </span>
              {data.acled.trend === 'increasing' && <TrendingUp size={16} color={COLORS.danger.text} />}
              {data.acled.trend === 'decreasing' && <TrendingDown size={16} color={COLORS.safe.text} />}
              {data.acled.trend === 'stable' && <Minus size={16} color={COLORS.textLight} />}
            </div>
          </div>
          
          <div style={{
            backgroundColor: COLORS.white,
            borderRadius: RADIUS.lg,
            padding: '16px',
            boxShadow: SHADOWS.card,
          }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textLight, textTransform: 'uppercase', marginBottom: '4px' }}>
              News Sentiment
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                fontSize: '20px', 
                fontWeight: 700, 
                color: data.gdelt.tone_score > 0 ? COLORS.safe.text : data.gdelt.tone_score < -2 ? COLORS.danger.text : COLORS.textDark,
              }}>
                {data.gdelt.tone_score > 0 ? '+' : ''}{data.gdelt.tone_score.toFixed(1)}
              </span>
              {data.gdelt.trend_7day === 'improving' && <TrendingUp size={16} color={COLORS.safe.text} />}
              {data.gdelt.trend_7day === 'worsening' && <TrendingDown size={16} color={COLORS.danger.text} />}
              {data.gdelt.trend_7day === 'stable' && <Minus size={16} color={COLORS.textLight} />}
            </div>
          </div>
        </div>
        
        {/* Advisory Text */}
        <div style={{
          backgroundColor: COLORS.white,
          borderRadius: RADIUS.lg,
          padding: '16px',
          boxShadow: SHADOWS.card,
          marginBottom: '16px',
        }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: COLORS.textDark }}>
            US State Department Advisory
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: COLORS.textMedium, lineHeight: 1.5 }}>
            {data.advisory.advisory_text}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '11px', color: COLORS.textLight }}>
            Updated: {data.advisory.date_updated}
          </p>
        </div>
        
        {/* CTA Button */}
        <a 
          href={data.advisory.url} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '14px',
            backgroundColor: COLORS.coral,
            color: COLORS.white,
            borderRadius: RADIUS.lg,
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: SHADOWS.button,
          }}
        >
          <ExternalLink size={16} />
          View Full Advisory
        </a>
      </div>
    </div>
  );
}

// Main Component
export default function TravelSafety() {
  const [query, setQuery] = useState('');
  const [selectedDest, setSelectedDest] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const popularDestinations = ['tokyo', 'paris', 'cancun', 'bangkok', 'bali', 'rome'];
  
  const getDestData = (key: string) => {
    const country = CITY_TO_COUNTRY[key] || key;
    const countryKey = country.toLowerCase();
    return FALLBACK_DATA[countryKey];
  };

  const filteredDests = query.trim() 
    ? popularDestinations.filter(d => d.includes(query.toLowerCase()) || (CITY_TO_COUNTRY[d] || '').toLowerCase().includes(query.toLowerCase()))
    : popularDestinations;

  if (selectedDest) {
    const data = getDestData(selectedDest);
    if (data) {
      return <DetailView name={selectedDest} data={data} onBack={() => setSelectedDest(null)} />;
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: COLORS.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <ChevronLeft size={20} color={COLORS.textDark} />
          </button>
          
          <button style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <Bell size={20} color={COLORS.textDark} />
          </button>
        </div>
        
        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 400, color: COLORS.textDark }}>
            Explore the
          </h1>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: COLORS.textDark }}>
            Safe destinations
          </h1>
        </div>
        
        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            backgroundColor: COLORS.searchBg,
            borderRadius: RADIUS.full,
            padding: '0 20px',
            height: '52px',
          }}>
            <Search size={20} color={COLORS.textLight} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your destination"
              style={{
                flex: 1,
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '15px',
                color: COLORS.textDark,
                outline: 'none',
              }}
            />
          </div>
          
          <button style={{
            width: '52px',
            height: '52px',
            borderRadius: RADIUS.lg,
            backgroundColor: COLORS.coral,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: SHADOWS.button,
          }}>
            <SlidersHorizontal size={20} color={COLORS.white} />
          </button>
        </div>
      </div>
      
      {/* Destination Grid */}
      <div style={{ padding: '0 20px 100px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '16px',
        }}>
          {filteredDests.map((dest) => {
            const data = getDestData(dest);
            if (!data) return null;
            const score = calcScore(data.advisory.advisory_level, data.acled, data.gdelt);
            return (
              <DestinationCard
                key={dest}
                name={dest}
                country={data.advisory.country}
                score={score}
                level={data.advisory.advisory_level}
                image={DESTINATION_IMAGES[dest] || DESTINATION_IMAGES['default']}
                onClick={() => setSelectedDest(dest)}
                isFavorite={favorites.has(dest)}
              />
            );
          })}
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTop: `1px solid ${COLORS.border}`,
        padding: '12px 0 20px',
        display: 'flex',
        justifyContent: 'space-around',
      }}>
        {[
          { icon: Home, label: 'Home', active: true },
          { icon: MapPin, label: 'Explore', active: false },
          { icon: Clock, label: 'History', active: false },
          { icon: User, label: 'Profile', active: false },
        ].map((item) => (
          <button 
            key={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 16px',
            }}
          >
            <item.icon size={22} color={item.active ? COLORS.coral : COLORS.textLight} />
            <span style={{ fontSize: '10px', color: item.active ? COLORS.coral : COLORS.textLight, fontWeight: item.active ? 600 : 400 }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
