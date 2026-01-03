import React, { useState, useEffect, useMemo } from 'react';
import { Search, Shield, AlertTriangle, AlertCircle, CheckCircle, Info, MapPin, Calendar, ExternalLink, Globe, ChevronDown, ChevronUp } from 'lucide-react';

// State Department Advisory Levels
const ADVISORY_LEVELS = {
  1: { label: 'Exercise Normal Precautions', color: '#22c55e', bgColor: '#dcfce7', icon: CheckCircle },
  2: { label: 'Exercise Increased Caution', color: '#eab308', bgColor: '#fef9c3', icon: Info },
  3: { label: 'Reconsider Travel', color: '#f97316', bgColor: '#ffedd5', icon: AlertTriangle },
  4: { label: 'Do Not Travel', color: '#ef4444', bgColor: '#fee2e2', icon: AlertCircle },
};

// Country to city mapping for common searches
const CITY_TO_COUNTRY: Record<string, string> = {
  'medellin': 'Colombia',
  'bogota': 'Colombia',
  'cartagena': 'Colombia',
  'cali': 'Colombia',
  'paris': 'France',
  'london': 'United Kingdom',
  'tokyo': 'Japan',
  'osaka': 'Japan',
  'kyoto': 'Japan',
  'rome': 'Italy',
  'milan': 'Italy',
  'florence': 'Italy',
  'venice': 'Italy',
  'barcelona': 'Spain',
  'madrid': 'Spain',
  'berlin': 'Germany',
  'munich': 'Germany',
  'amsterdam': 'Netherlands',
  'bangkok': 'Thailand',
  'phuket': 'Thailand',
  'chiang mai': 'Thailand',
  'mexico city': 'Mexico',
  'cancun': 'Mexico',
  'cabo': 'Mexico',
  'tulum': 'Mexico',
  'rio de janeiro': 'Brazil',
  'sao paulo': 'Brazil',
  'buenos aires': 'Argentina',
  'lima': 'Peru',
  'cusco': 'Peru',
  'sydney': 'Australia',
  'melbourne': 'Australia',
  'dubai': 'United Arab Emirates',
  'abu dhabi': 'United Arab Emirates',
  'singapore': 'Singapore',
  'hong kong': 'Hong Kong',
  'seoul': 'Korea, South',
  'busan': 'Korea, South',
  'taipei': 'Taiwan',
  'hanoi': 'Vietnam',
  'ho chi minh': 'Vietnam',
  'saigon': 'Vietnam',
  'bali': 'Indonesia',
  'jakarta': 'Indonesia',
  'cairo': 'Egypt',
  'marrakech': 'Morocco',
  'cape town': 'South Africa',
  'johannesburg': 'South Africa',
  'nairobi': 'Kenya',
  'istanbul': 'Turkey',
  'athens': 'Greece',
  'santorini': 'Greece',
  'lisbon': 'Portugal',
  'porto': 'Portugal',
  'dublin': 'Ireland',
  'edinburgh': 'United Kingdom',
  'prague': 'Czech Republic',
  'vienna': 'Austria',
  'zurich': 'Switzerland',
  'geneva': 'Switzerland',
  'brussels': 'Belgium',
  'copenhagen': 'Denmark',
  'stockholm': 'Sweden',
  'oslo': 'Norway',
  'helsinki': 'Finland',
  'reykjavik': 'Iceland',
  'warsaw': 'Poland',
  'krakow': 'Poland',
  'budapest': 'Hungary',
  'moscow': 'Russia',
  'st petersburg': 'Russia',
  'tel aviv': 'Israel',
  'jerusalem': 'Israel',
  'new delhi': 'India',
  'mumbai': 'India',
  'goa': 'India',
  'kathmandu': 'Nepal',
  'havana': 'Cuba',
  'san juan': 'Puerto Rico',
  'kingston': 'Jamaica',
  'nassau': 'Bahamas',
  'punta cana': 'Dominican Republic',
  'santo domingo': 'Dominican Republic',
};

interface TravelAdvisory {
  country: string;
  country_code: string;
  advisory_level: number;
  advisory_text: string;
  date_updated: string;
  url: string;
}

interface AdvisoryData {
  [key: string]: TravelAdvisory;
}

// Fetch State Department advisories
async function fetchStateAdvisories(): Promise<AdvisoryData> {
  try {
    const response = await fetch('https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/_jcr_content/traveladvisories.json');
    const data = await response.json();
    
    const advisories: AdvisoryData = {};
    
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        const countryName = item.title || item.country;
        if (countryName) {
          // Extract level from the advisory text or level field
          let level = 1;
          const levelMatch = item.travel_advisory?.level || item.level;
          if (levelMatch) {
            level = parseInt(levelMatch, 10);
          } else if (item.travel_advisory?.advisory) {
            const textMatch = item.travel_advisory.advisory.match(/Level (\d)/i);
            if (textMatch) level = parseInt(textMatch[1], 10);
          }
          
          advisories[countryName.toLowerCase()] = {
            country: countryName,
            country_code: item.country_code || item.iso_code || '',
            advisory_level: Math.min(Math.max(level, 1), 4),
            advisory_text: item.travel_advisory?.advisory || item.advisory || `Level ${level} - ${ADVISORY_LEVELS[level as keyof typeof ADVISORY_LEVELS]?.label || 'Unknown'}`,
            date_updated: item.date_updated || item.last_updated || new Date().toISOString().split('T')[0],
            url: item.url || `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/${countryName.toLowerCase().replace(/\s+/g, '-')}.html`,
          };
        }
      });
    }
    
    return advisories;
  } catch (error) {
    console.error('Failed to fetch State Department advisories:', error);
    return {};
  }
}

// Fallback advisory data for common countries (used when API fails)
const FALLBACK_ADVISORIES: AdvisoryData = {
  'colombia': {
    country: 'Colombia',
    country_code: 'CO',
    advisory_level: 3,
    advisory_text: 'Reconsider travel due to crime and terrorism. Some areas have increased risk.',
    date_updated: '2024-12-15',
    url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/colombia-travel-advisory.html',
  },
  'mexico': {
    country: 'Mexico',
    country_code: 'MX',
    advisory_level: 2,
    advisory_text: 'Exercise increased caution due to crime and kidnapping. Some areas have increased risk.',
    date_updated: '2024-12-10',
    url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/mexico-travel-advisory.html',
  },
  'france': {
    country: 'France',
    country_code: 'FR',
    advisory_level: 2,
    advisory_text: 'Exercise increased caution due to terrorism and civil unrest.',
    date_updated: '2024-11-20',
    url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/france-travel-advisory.html',
  },
  'japan': {
    country: 'Japan',
    country_code: 'JP',
    advisory_level: 1,
    advisory_text: 'Exercise normal precautions.',
    date_updated: '2024-10-15',
    url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/japan-travel-advisory.html',
  },
  'italy': {
    country: 'Italy',
    country_code: 'IT',
    advisory_level: 2,
    advisory_text: 'Exercise increased caution due to terrorism.',
    date_updated: '2024-11-05',
    url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/italy-travel-advisory.html',
  },
  'united kingdom': {
    country: 'United Kingdom',
    country_code: 'GB',
    advisory_level: 2,
    advisory_text: 'Exercise increased caution due to terrorism.',
    date_updated: '2024-10-20',
    url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/united-kingdom-travel-advisory.html',
  },
  'spain': {
    country: 'Spain',
    country_code: 'ES',
    advisory_level: 2,
    advisory_text: 'Exercise increased caution due to terrorism.',
    date_updated: '2024-11-10',
    url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/spain-travel-advisory.html',
  },
  'germany': {
    country: 'Germany',
    country_code: 'DE',
    advisory_level: 2,
    advisory_text: 'Exercise increased caution due to terrorism.',
    date_updated: '2024-10-25',
    url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/germany-travel-advisory.html',
  },
  'thailand': {
    country: 'Thailand',
    country_code: 'TH',
    advisory_level: 1,
    advisory_text: 'Exercise normal precautions.',
    date_updated: '2024-09-15',
    url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/thailand-travel-advisory.html',
  },
  'brazil': {
    country: 'Brazil',
    country_code: 'BR',
    advisory_level: 2,
    advisory_text: 'Exercise increased caution due to crime.',
    date_updated: '2024-11-30',
    url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/brazil-travel-advisory.html',
  },
};

function AdvisoryLevelBadge({ level }: { level: number }) {
  const config = ADVISORY_LEVELS[level as keyof typeof ADVISORY_LEVELS] || ADVISORY_LEVELS[1];
  const Icon = config.icon;
  
  return (
    <div 
      className="advisory-badge"
      style={{ 
        backgroundColor: config.bgColor, 
        color: config.color,
        border: `2px solid ${config.color}`,
        borderRadius: '12px',
        padding: '8px 16px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 600,
      }}
    >
      <Icon size={20} />
      <span>Level {level}: {config.label}</span>
    </div>
  );
}

function SafetyMeter({ level }: { level: number }) {
  const percentage = ((4 - level + 1) / 4) * 100;
  const config = ADVISORY_LEVELS[level as keyof typeof ADVISORY_LEVELS] || ADVISORY_LEVELS[1];
  
  return (
    <div style={{ width: '100%', marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
        <span>Safety Score</span>
        <span style={{ fontWeight: 600, color: config.color }}>{Math.round(percentage)}%</span>
      </div>
      <div style={{ 
        width: '100%', 
        height: '12px', 
        backgroundColor: '#e5e7eb', 
        borderRadius: '6px',
        overflow: 'hidden',
      }}>
        <div style={{ 
          width: `${percentage}%`, 
          height: '100%', 
          backgroundColor: config.color,
          borderRadius: '6px',
          transition: 'width 0.5s ease-out',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: '#9ca3af' }}>
        <span>Higher Risk</span>
        <span>Lower Risk</span>
      </div>
    </div>
  );
}

function DashboardCard({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        {Icon && <Icon size={24} style={{ color: '#6b7280' }} />}
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SearchResult({ advisory, searchTerm, isCity }: { advisory: TravelAdvisory; searchTerm: string; isCity: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const config = ADVISORY_LEVELS[advisory.advisory_level as keyof typeof ADVISORY_LEVELS] || ADVISORY_LEVELS[1];
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '32px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 10px 15px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
          <MapPin size={28} style={{ color: config.color }} />
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#111827' }}>
            {isCity ? (
              <>
                <span style={{ textTransform: 'capitalize' }}>{searchTerm}</span>
                <span style={{ color: '#6b7280', fontWeight: 400 }}>, {advisory.country}</span>
              </>
            ) : (
              advisory.country
            )}
          </h1>
        </div>
        <AdvisoryLevelBadge level={advisory.advisory_level} />
      </div>
      
      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* State Department Card */}
        <DashboardCard title="US State Department" icon={Shield}>
          <div style={{ 
            padding: '16px', 
            backgroundColor: config.bgColor, 
            borderRadius: '12px',
            border: `1px solid ${config.color}20`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: config.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 700,
              }}>
                {advisory.advisory_level}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#111827' }}>Level {advisory.advisory_level}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>{config.label}</div>
              </div>
            </div>
          </div>
          <SafetyMeter level={advisory.advisory_level} />
        </DashboardCard>
        
        {/* Advisory Details Card */}
        <DashboardCard title="Advisory Details" icon={Info}>
          <p style={{ margin: '0 0 16px 0', color: '#4b5563', lineHeight: 1.6 }}>
            {advisory.advisory_text}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '14px' }}>
            <Calendar size={16} />
            <span>Updated: {advisory.date_updated}</span>
          </div>
          <a 
            href={advisory.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              padding: '10px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background-color 0.2s',
            }}
          >
            <ExternalLink size={16} />
            View Full Advisory
          </a>
        </DashboardCard>
      </div>
      
      {/* Expandable Risk Factors */}
      <div style={{
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%',
            padding: '16px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          <span>Understanding the Advisory Levels</span>
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {expanded && (
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              {Object.entries(ADVISORY_LEVELS).map(([level, info]) => {
                const Icon = info.icon;
                return (
                  <div 
                    key={level}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: info.bgColor,
                      borderRadius: '8px',
                      border: `1px solid ${info.color}30`,
                    }}
                  >
                    <Icon size={20} style={{ color: info.color }} />
                    <span style={{ fontWeight: 600, color: info.color }}>Level {level}:</span>
                    <span style={{ color: '#4b5563' }}>{info.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* City-specific note */}
      {isCity && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#eff6ff',
          borderRadius: '12px',
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}>
          <Info size={20} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ color: '#1e40af', fontSize: '14px', lineHeight: 1.6 }}>
            <strong>Note:</strong> This advisory applies to {advisory.country} as a whole. 
            Safety conditions in <span style={{ textTransform: 'capitalize' }}>{searchTerm}</span> may differ from other regions. 
            Always check for city-specific guidance and local news before traveling.
          </div>
        </div>
      )}
    </div>
  );
}

export default function TravelSafety() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{ advisory: TravelAdvisory; isCity: boolean; searchTerm: string } | null>(null);
  const [advisories, setAdvisories] = useState<AdvisoryData>(FALLBACK_ADVISORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiLoaded, setApiLoaded] = useState(false);

  // Load advisories on mount
  useEffect(() => {
    fetchStateAdvisories().then((data) => {
      if (Object.keys(data).length > 0) {
        setAdvisories({ ...FALLBACK_ADVISORIES, ...data });
      }
      setApiLoaded(true);
    });
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    const query = searchQuery.trim().toLowerCase();
    
    // Check if it's a city
    const countryFromCity = CITY_TO_COUNTRY[query];
    if (countryFromCity) {
      const countryKey = countryFromCity.toLowerCase();
      const advisory = advisories[countryKey];
      if (advisory) {
        setSearchResult({ advisory, isCity: true, searchTerm: query });
        setLoading(false);
        return;
      }
    }
    
    // Check if it's a country
    const advisory = advisories[query];
    if (advisory) {
      setSearchResult({ advisory, isCity: false, searchTerm: query });
      setLoading(false);
      return;
    }
    
    // Fuzzy match - find countries that contain the search term
    const partialMatch = Object.entries(advisories).find(([key, value]) => 
      key.includes(query) || value.country.toLowerCase().includes(query)
    );
    
    if (partialMatch) {
      setSearchResult({ advisory: partialMatch[1], isCity: false, searchTerm: partialMatch[1].country.toLowerCase() });
      setLoading(false);
      return;
    }
    
    setError(`No travel advisory found for "${searchQuery}". Try searching for a country name like "Colombia" or a major city like "Medellin".`);
    setSearchResult(null);
    setLoading(false);
  };

  const popularSearches = ['Colombia', 'Mexico', 'Japan', 'France', 'Thailand', 'Italy'];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        padding: '48px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <Globe size={40} style={{ color: 'white' }} />
            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: 'white' }}>
              Is It Safe To Travel?
            </h1>
          </div>
          <p style={{ margin: '0 0 32px 0', fontSize: '18px', color: '#bfdbfe', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Get real-time travel safety information from official government sources. 
            Search any city or country to see current advisories.
          </p>
          
          {/* Search Bar */}
          <div style={{
            display: 'flex',
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 10px 15px rgba(0,0,0,0.1)',
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search a city or country (e.g., Medellin, Colombia)"
                style={{
                  width: '100%',
                  padding: '18px 16px 18px 48px',
                  fontSize: '16px',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                }}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                padding: '18px 32px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '16px',
                fontWeight: 600,
                transition: 'background-color 0.2s',
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          {/* Popular Searches */}
          <div style={{ marginTop: '24px' }}>
            <span style={{ color: '#bfdbfe', fontSize: '14px', marginRight: '12px' }}>Popular:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term);
                  setTimeout(() => {
                    setSearchQuery(term);
                    const query = term.toLowerCase();
                    const advisory = advisories[query];
                    if (advisory) {
                      setSearchResult({ advisory, isCity: false, searchTerm: query });
                    }
                  }, 0);
                }}
                style={{
                  padding: '6px 12px',
                  margin: '4px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Results Section */}
      <div style={{ padding: '48px 24px' }}>
        {error && (
          <div style={{
            maxWidth: '600px',
            margin: '0 auto 32px',
            padding: '16px 24px',
            backgroundColor: '#fef2f2',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        
        {searchResult && (
          <SearchResult 
            advisory={searchResult.advisory} 
            searchTerm={searchResult.searchTerm}
            isCity={searchResult.isCity}
          />
        )}
        
        {!searchResult && !error && (
          <div style={{ textAlign: 'center', color: '#6b7280', maxWidth: '500px', margin: '0 auto' }}>
            <Shield size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600, color: '#374151' }}>
              Search for a Destination
            </h2>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Enter a city or country name above to see the latest travel safety information 
              from the US Department of State.
            </p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div style={{
        padding: '24px',
        textAlign: 'center',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: 'white',
      }}>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Data sourced from the{' '}
          <a 
            href="https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#2563eb', textDecoration: 'none' }}
          >
            US Department of State
          </a>
          . Always verify with official sources before traveling.
        </p>
      </div>
    </div>
  );
}
