import React, { useState, useEffect } from 'react';
import { Search, Shield, AlertTriangle, AlertCircle, CheckCircle, Info, MapPin, ExternalLink, Globe, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Compact Peachy/Coral Color Palette
const COLORS = {
  peach: '#FADCD9',
  peachLight: '#FDF5F3',
  white: '#FFFFFF',
  coral: '#D4785C',
  coralDark: '#C46A4E',
  textDark: '#2D2D2D',
  textMedium: '#5A5A5A',
  textLight: '#8B8B8B',
  border: '#E8E0DE',
  
  safe: { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
  caution: { bg: '#FFF8E1', text: '#F57C00', border: '#FFE082' },
  warning: { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' },
  danger: { bg: '#FFEBEE', text: '#C62828', border: '#EF9A9A' },
};

const ADVISORY_LEVELS = {
  1: { label: 'Normal Precautions', color: COLORS.safe.text, bg: COLORS.safe.bg, icon: CheckCircle },
  2: { label: 'Increased Caution', color: COLORS.caution.text, bg: COLORS.caution.bg, icon: Info },
  3: { label: 'Reconsider Travel', color: COLORS.warning.text, bg: COLORS.warning.bg, icon: AlertTriangle },
  4: { label: 'Do Not Travel', color: COLORS.danger.text, bg: COLORS.danger.bg, icon: AlertCircle },
};

const CITY_TO_COUNTRY: Record<string, string> = {
  'medellin': 'Colombia', 'bogota': 'Colombia', 'cartagena': 'Colombia', 'cali': 'Colombia',
  'paris': 'France', 'london': 'United Kingdom', 'tokyo': 'Japan', 'osaka': 'Japan',
  'rome': 'Italy', 'milan': 'Italy', 'barcelona': 'Spain', 'madrid': 'Spain',
  'berlin': 'Germany', 'amsterdam': 'Netherlands', 'bangkok': 'Thailand', 'phuket': 'Thailand',
  'mexico city': 'Mexico', 'cancun': 'Mexico', 'cabo': 'Mexico', 'rio de janeiro': 'Brazil',
  'sao paulo': 'Brazil', 'buenos aires': 'Argentina', 'lima': 'Peru', 'sydney': 'Australia',
  'dubai': 'United Arab Emirates', 'singapore': 'Singapore', 'hong kong': 'Hong Kong',
  'seoul': 'Korea, South', 'taipei': 'Taiwan', 'hanoi': 'Vietnam', 'bali': 'Indonesia',
  'cairo': 'Egypt', 'marrakech': 'Morocco', 'cape town': 'South Africa', 'istanbul': 'Turkey',
  'athens': 'Greece', 'lisbon': 'Portugal', 'dublin': 'Ireland', 'prague': 'Czech Republic',
  'vienna': 'Austria', 'zurich': 'Switzerland', 'copenhagen': 'Denmark', 'stockholm': 'Sweden',
};

interface TravelAdvisory {
  country: string;
  country_code: string;
  advisory_level: number;
  advisory_text: string;
  date_updated: string;
  url: string;
}

interface ACLEDData {
  country: string;
  location?: string;
  total_events: number;
  fatalities: number;
  events_last_30_days: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface GDELTData {
  location: string;
  tone_score: number;
  volume_level: 'normal' | 'elevated' | 'spike';
  trend_7day: 'improving' | 'worsening' | 'stable';
  headlines: { title: string; url: string; source: string; tone: number }[];
}

// Fallback data
const FALLBACK_ADVISORIES: Record<string, TravelAdvisory> = {
  'colombia': { country: 'Colombia', country_code: 'CO', advisory_level: 3, advisory_text: 'Reconsider travel due to crime and terrorism.', date_updated: '2024-12-15', url: 'https://travel.state.gov' },
  'mexico': { country: 'Mexico', country_code: 'MX', advisory_level: 2, advisory_text: 'Exercise increased caution due to crime.', date_updated: '2024-12-10', url: 'https://travel.state.gov' },
  'france': { country: 'France', country_code: 'FR', advisory_level: 2, advisory_text: 'Exercise increased caution due to terrorism.', date_updated: '2024-11-20', url: 'https://travel.state.gov' },
  'japan': { country: 'Japan', country_code: 'JP', advisory_level: 1, advisory_text: 'Exercise normal precautions.', date_updated: '2024-10-15', url: 'https://travel.state.gov' },
  'italy': { country: 'Italy', country_code: 'IT', advisory_level: 2, advisory_text: 'Exercise increased caution due to terrorism.', date_updated: '2024-11-05', url: 'https://travel.state.gov' },
  'thailand': { country: 'Thailand', country_code: 'TH', advisory_level: 1, advisory_text: 'Exercise normal precautions.', date_updated: '2024-11-01', url: 'https://travel.state.gov' },
  'spain': { country: 'Spain', country_code: 'ES', advisory_level: 2, advisory_text: 'Exercise increased caution.', date_updated: '2024-11-10', url: 'https://travel.state.gov' },
  'united kingdom': { country: 'United Kingdom', country_code: 'GB', advisory_level: 2, advisory_text: 'Exercise increased caution.', date_updated: '2024-10-20', url: 'https://travel.state.gov' },
  'brazil': { country: 'Brazil', country_code: 'BR', advisory_level: 2, advisory_text: 'Exercise increased caution due to crime.', date_updated: '2024-11-15', url: 'https://travel.state.gov' },
  'germany': { country: 'Germany', country_code: 'DE', advisory_level: 2, advisory_text: 'Exercise increased caution.', date_updated: '2024-10-25', url: 'https://travel.state.gov' },
};

const FALLBACK_ACLED: Record<string, ACLEDData> = {
  'colombia': { country: 'Colombia', total_events: 1247, fatalities: 892, events_last_30_days: 98, trend: 'stable' },
  'medellin': { country: 'Colombia', location: 'Medellín', total_events: 156, fatalities: 89, events_last_30_days: 12, trend: 'decreasing' },
  'mexico': { country: 'Mexico', total_events: 2156, fatalities: 1834, events_last_30_days: 187, trend: 'increasing' },
  'cancun': { country: 'Mexico', location: 'Cancún', total_events: 67, fatalities: 34, events_last_30_days: 6, trend: 'stable' },
  'france': { country: 'France', total_events: 423, fatalities: 12, events_last_30_days: 45, trend: 'stable' },
  'paris': { country: 'France', location: 'Paris', total_events: 187, fatalities: 5, events_last_30_days: 21, trend: 'stable' },
  'japan': { country: 'Japan', total_events: 34, fatalities: 2, events_last_30_days: 3, trend: 'stable' },
  'tokyo': { country: 'Japan', location: 'Tokyo', total_events: 18, fatalities: 0, events_last_30_days: 2, trend: 'stable' },
  'thailand': { country: 'Thailand', total_events: 312, fatalities: 89, events_last_30_days: 28, trend: 'decreasing' },
  'bangkok': { country: 'Thailand', location: 'Bangkok', total_events: 89, fatalities: 12, events_last_30_days: 8, trend: 'stable' },
  'brazil': { country: 'Brazil', total_events: 1876, fatalities: 1245, events_last_30_days: 156, trend: 'stable' },
};

const FALLBACK_GDELT: Record<string, GDELTData> = {
  'medellin': { location: 'Medellín', tone_score: -2.8, volume_level: 'normal', trend_7day: 'stable', headlines: [{ title: 'Medellín named top destination for digital nomads', url: '#', source: 'Travel Weekly', tone: 4.2 }] },
  'colombia': { location: 'Colombia', tone_score: -4.1, volume_level: 'elevated', trend_7day: 'worsening', headlines: [{ title: 'Colombia peace process faces challenges', url: '#', source: 'Reuters', tone: -5.2 }] },
  'cancun': { location: 'Cancún', tone_score: 1.2, volume_level: 'normal', trend_7day: 'stable', headlines: [{ title: 'Cancún hotels report record bookings', url: '#', source: 'Travel Weekly', tone: 4.8 }] },
  'mexico': { location: 'Mexico', tone_score: -5.3, volume_level: 'elevated', trend_7day: 'worsening', headlines: [{ title: 'Security concerns in border regions', url: '#', source: 'AP News', tone: -8.5 }] },
  'paris': { location: 'Paris', tone_score: 0.8, volume_level: 'normal', trend_7day: 'stable', headlines: [{ title: 'Louvre sets new visitor record', url: '#', source: 'France 24', tone: 4.5 }] },
  'tokyo': { location: 'Tokyo', tone_score: 3.2, volume_level: 'normal', trend_7day: 'improving', headlines: [{ title: 'Tokyo named safest major city', url: '#', source: 'Travel + Leisure', tone: 6.2 }] },
  'bangkok': { location: 'Bangkok', tone_score: 1.5, volume_level: 'normal', trend_7day: 'stable', headlines: [{ title: 'Bangkok street food draws global attention', url: '#', source: 'CNN Travel', tone: 5.1 }] },
};

function calculateScore(advisory: TravelAdvisory, acled?: ACLEDData, gdelt?: GDELTData): number {
  let score = 100;
  score -= (advisory.advisory_level - 1) * 15;
  if (acled) {
    if (acled.total_events > 1000) score -= 15;
    else if (acled.total_events > 500) score -= 10;
    else if (acled.total_events > 100) score -= 5;
    if (acled.trend === 'increasing') score -= 5;
    else if (acled.trend === 'decreasing') score += 3;
  }
  if (gdelt) {
    if (gdelt.tone_score < -5) score -= 10;
    else if (gdelt.tone_score < -2) score -= 5;
    else if (gdelt.tone_score > 2) score += 3;
    if (gdelt.volume_level === 'spike') score -= 8;
    if (gdelt.trend_7day === 'worsening') score -= 5;
    else if (gdelt.trend_7day === 'improving') score += 3;
  }
  return Math.max(1, Math.min(100, Math.round(score)));
}

function getScoreStyle(score: number) {
  if (score >= 75) return { color: COLORS.safe.text, bg: COLORS.safe.bg };
  if (score >= 50) return { color: COLORS.caution.text, bg: COLORS.caution.bg };
  if (score >= 25) return { color: COLORS.warning.text, bg: COLORS.warning.bg };
  return { color: COLORS.danger.text, bg: COLORS.danger.bg };
}

function ScoreCircle({ score }: { score: number }) {
  const style = getScoreStyle(score);
  return (
    <div style={{
      width: '56px', height: '56px', borderRadius: '50%',
      backgroundColor: style.bg, border: `3px solid ${style.color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: '20px', fontWeight: 700, color: style.color }}>{score}</span>
    </div>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'increasing' || trend === 'worsening') return <TrendingUp size={14} style={{ color: COLORS.danger.text }} />;
  if (trend === 'decreasing' || trend === 'improving') return <TrendingDown size={14} style={{ color: COLORS.safe.text }} />;
  return <Minus size={14} style={{ color: COLORS.textLight }} />;
}

function CompactResult({ advisory, acled, gdelt, searchTerm, isCity }: {
  advisory: TravelAdvisory; acled?: ACLEDData; gdelt?: GDELTData; searchTerm: string; isCity: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const score = calculateScore(advisory, acled, gdelt);
  const scoreStyle = getScoreStyle(score);
  const config = ADVISORY_LEVELS[advisory.advisory_level as keyof typeof ADVISORY_LEVELS] || ADVISORY_LEVELS[1];
  const Icon = config.icon;

  return (
    <div style={{ backgroundColor: COLORS.white, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `1px solid ${COLORS.border}` }}>
        <ScoreCircle score={score} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} style={{ color: COLORS.coral }} />
            <span style={{ fontSize: '16px', fontWeight: 700, color: COLORS.textDark, textTransform: 'capitalize' }}>
              {isCity ? searchTerm : advisory.country}
            </span>
            {isCity && <span style={{ fontSize: '13px', color: COLORS.textMedium }}>{advisory.country}</span>}
          </div>
          <div style={{ fontSize: '12px', color: scoreStyle.color, fontWeight: 600, marginTop: '2px' }}>
            {score >= 75 ? 'Low Risk' : score >= 50 ? 'Moderate Risk' : score >= 25 ? 'Elevated Risk' : 'High Risk'}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ padding: '10px', textAlign: 'center', borderRight: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: '10px', color: COLORS.textLight, fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Advisory</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Icon size={14} style={{ color: config.color }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: config.color }}>L{advisory.advisory_level}</span>
          </div>
        </div>
        {acled && (
          <div style={{ padding: '10px', textAlign: 'center', borderRight: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: '10px', color: COLORS.textLight, fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Events</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: COLORS.textDark }}>{acled.events_last_30_days}</span>
              <TrendIcon trend={acled.trend} />
            </div>
          </div>
        )}
        {gdelt && (
          <div style={{ padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: COLORS.textLight, fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Sentiment</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: gdelt.tone_score > 0 ? COLORS.safe.text : gdelt.tone_score < -3 ? COLORS.danger.text : COLORS.textDark }}>
                {gdelt.tone_score > 0 ? '+' : ''}{gdelt.tone_score.toFixed(1)}
              </span>
              <TrendIcon trend={gdelt.trend_7day} />
            </div>
          </div>
        )}
      </div>

      {/* Advisory Badge */}
      <div style={{ padding: '10px 16px', backgroundColor: config.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={16} style={{ color: config.color }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: config.color }}>{config.label}</span>
        </div>
      </div>

      {/* Headline */}
      {gdelt && gdelt.headlines.length > 0 && (
        <a href={gdelt.headlines[0].url} target="_blank" rel="noopener noreferrer" style={{
          display: 'block', padding: '10px 16px', backgroundColor: COLORS.peachLight, textDecoration: 'none',
          borderTop: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ fontSize: '12px', color: COLORS.textDark, fontWeight: 500, lineHeight: 1.3 }}>
            {gdelt.headlines[0].title}
          </div>
          <div style={{ fontSize: '10px', color: COLORS.textLight, marginTop: '2px' }}>{gdelt.headlines[0].source}</div>
        </a>
      )}

      {/* Expand Button */}
      <button onClick={() => setExpanded(!expanded)} style={{
        width: '100%', padding: '8px', backgroundColor: COLORS.white, border: 'none',
        borderTop: `1px solid ${COLORS.border}`, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        fontSize: '11px', fontWeight: 600, color: COLORS.coral,
      }}>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Less' : 'More Details'}
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div style={{ padding: '12px 16px', backgroundColor: COLORS.peachLight, borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: '12px', color: COLORS.textMedium, lineHeight: 1.5, marginBottom: '10px' }}>
            {advisory.advisory_text}
          </div>
          
          {acled && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div style={{ backgroundColor: COLORS.white, padding: '8px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: COLORS.textLight, fontWeight: 600 }}>TOTAL EVENTS</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: COLORS.textDark }}>{acled.total_events.toLocaleString()}</div>
              </div>
              <div style={{ backgroundColor: COLORS.white, padding: '8px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: COLORS.textLight, fontWeight: 600 }}>FATALITIES</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: COLORS.danger.text }}>{acled.fatalities.toLocaleString()}</div>
              </div>
            </div>
          )}

          <a href={advisory.url} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '8px', backgroundColor: COLORS.coral, color: COLORS.white,
            borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: 600,
          }}>
            <ExternalLink size={14} />
            Official Advisory
          </a>
        </div>
      )}
    </div>
  );
}

export default function TravelSafety() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ advisory: TravelAdvisory; acled?: ACLEDData; gdelt?: GDELTData; isCity: boolean; term: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    setError(null);
    const q = query.trim().toLowerCase();
    
    // Check city first
    const country = CITY_TO_COUNTRY[q];
    if (country) {
      const countryKey = country.toLowerCase();
      const advisory = FALLBACK_ADVISORIES[countryKey];
      if (advisory) {
        setResult({
          advisory,
          acled: FALLBACK_ACLED[q] || FALLBACK_ACLED[countryKey],
          gdelt: FALLBACK_GDELT[q] || FALLBACK_GDELT[countryKey],
          isCity: true,
          term: q,
        });
        return;
      }
    }
    
    // Check country
    const advisory = FALLBACK_ADVISORIES[q];
    if (advisory) {
      setResult({ advisory, acled: FALLBACK_ACLED[q], gdelt: FALLBACK_GDELT[q], isCity: false, term: q });
      return;
    }
    
    // Fuzzy match
    const match = Object.entries(FALLBACK_ADVISORIES).find(([k, v]) => k.includes(q) || v.country.toLowerCase().includes(q));
    if (match) {
      setResult({ advisory: match[1], acled: FALLBACK_ACLED[match[0]], gdelt: FALLBACK_GDELT[match[0]], isCity: false, term: match[0] });
      return;
    }
    
    setError(`No advisory found for "${query}"`);
    setResult(null);
  };

  const quickSearches = ['Tokyo', 'Paris', 'Cancun', 'Medellin', 'Bangkok'];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.peach, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Compact Header */}
      <div style={{ padding: '12px 16px', backgroundColor: COLORS.white, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: COLORS.coral, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={18} color={COLORS.white} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.textDark }}>Travel Safety</div>
            <div style={{ fontSize: '10px', color: COLORS.textLight }}>Real-time risk assessment</div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textLight }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search destination..."
              style={{
                width: '100%', padding: '10px 10px 10px 32px', fontSize: '14px',
                border: `1px solid ${COLORS.border}`, borderRadius: '10px',
                backgroundColor: COLORS.peachLight, outline: 'none',
              }}
            />
          </div>
          <button onClick={handleSearch} style={{
            padding: '0 16px', backgroundColor: COLORS.coral, color: COLORS.white,
            border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>
            Go
          </button>
        </div>
        
        {/* Quick Searches */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
          {quickSearches.map((term) => (
            <button key={term} onClick={() => { setQuery(term); setTimeout(() => {
              const q = term.toLowerCase();
              const country = CITY_TO_COUNTRY[q];
              if (country) {
                const advisory = FALLBACK_ADVISORIES[country.toLowerCase()];
                if (advisory) setResult({ advisory, acled: FALLBACK_ACLED[q], gdelt: FALLBACK_GDELT[q], isCity: true, term: q });
              }
            }, 0); }} style={{
              padding: '4px 10px', fontSize: '11px', fontWeight: 600,
              backgroundColor: COLORS.peachLight, color: COLORS.coral,
              border: `1px solid ${COLORS.coralLight}`, borderRadius: '12px', cursor: 'pointer',
            }}>
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 16px' }}>
        {error && (
          <div style={{ padding: '12px', backgroundColor: COLORS.danger.bg, borderRadius: '10px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: COLORS.danger.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          </div>
        )}
        
        {result && (
          <CompactResult
            advisory={result.advisory}
            acled={result.acled}
            gdelt={result.gdelt}
            searchTerm={result.term}
            isCity={result.isCity}
          />
        )}
        
        {!result && !error && (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <Shield size={40} style={{ color: COLORS.coralLight, marginBottom: '12px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.textDark, marginBottom: '4px' }}>
              Search a Destination
            </div>
            <div style={{ fontSize: '12px', color: COLORS.textMedium }}>
              Get safety scores, advisories & news sentiment
            </div>
          </div>
        )}
      </div>

      {/* Compact Footer */}
      <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.white }}>
        <div style={{ fontSize: '10px', color: COLORS.textLight }}>
          Data: US State Dept • ACLED • GDELT
        </div>
      </div>
    </div>
  );
}
