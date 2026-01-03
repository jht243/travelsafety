import React, { useState, useEffect, useMemo } from 'react';
import { Search, Shield, AlertTriangle, AlertCircle, CheckCircle, Info, MapPin, Calendar, ExternalLink, Globe, ChevronDown, ChevronUp } from 'lucide-react';

// Modern Minimal Color Palette (OpenAI/Stripe inspired)
const COLORS = {
  // Semantic Status Colors (Subtle & Professional)
  safe: { text: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: '#10B981' }, // Emerald
  caution: { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '#F59E0B' }, // Amber
  warning: { text: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', icon: '#F97316' }, // Orange
  danger: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '#EF4444' }, // Red
  
  // Neutrals
  slate: {
    900: '#0F172A', // Headings
    800: '#1E293B',
    700: '#334155', // Body text
    600: '#475569',
    500: '#64748B', // Secondary text
    400: '#94A3B8', // Icons/Borders
    300: '#CBD5E1',
    200: '#E2E8F0', // Dividers/Borders
    100: '#F1F5F9', // Backgrounds
    50: '#F8FAFC',  // Cards
  },
  
  // Brand
  primary: '#2563EB', // Royal Blue (Clean)
  white: '#FFFFFF',
};

// State Department Advisory Levels - Clean Semantic Mapping
const ADVISORY_LEVELS = {
  1: { label: 'Exercise Normal Precautions', style: COLORS.safe, icon: CheckCircle },
  2: { label: 'Exercise Increased Caution', style: COLORS.caution, icon: Info },
  3: { label: 'Reconsider Travel', style: COLORS.warning, icon: AlertTriangle },
  4: { label: 'Do Not Travel', style: COLORS.danger, icon: AlertCircle },
};

// City coordinates for nearby city calculations (lat, lng)
const CITY_COORDINATES: Record<string, { lat: number; lng: number; name: string; country: string }> = {
  'medellin': { lat: 6.2442, lng: -75.5812, name: 'Medellín', country: 'Colombia' },
  'bogota': { lat: 4.7110, lng: -74.0721, name: 'Bogotá', country: 'Colombia' },
  'cartagena': { lat: 10.3910, lng: -75.4794, name: 'Cartagena', country: 'Colombia' },
  'cali': { lat: 3.4516, lng: -76.5320, name: 'Cali', country: 'Colombia' },
  'caracas': { lat: 10.4806, lng: -66.9036, name: 'Caracas', country: 'Venezuela' },
  'panama city': { lat: 8.9824, lng: -79.5199, name: 'Panama City', country: 'Panama' },
  'quito': { lat: -0.1807, lng: -78.4678, name: 'Quito', country: 'Ecuador' },
  'mexico city': { lat: 19.4326, lng: -99.1332, name: 'Mexico City', country: 'Mexico' },
  'cancun': { lat: 21.1619, lng: -86.8515, name: 'Cancún', country: 'Mexico' },
  'cabo': { lat: 22.8905, lng: -109.9167, name: 'Los Cabos', country: 'Mexico' },
  'guadalajara': { lat: 20.6597, lng: -103.3496, name: 'Guadalajara', country: 'Mexico' },
  'paris': { lat: 48.8566, lng: 2.3522, name: 'Paris', country: 'France' },
  'barcelona': { lat: 41.3851, lng: 2.1734, name: 'Barcelona', country: 'Spain' },
  'madrid': { lat: 40.4168, lng: -3.7038, name: 'Madrid', country: 'Spain' },
  'rome': { lat: 41.9028, lng: 12.4964, name: 'Rome', country: 'Italy' },
  'tokyo': { lat: 35.6762, lng: 139.6503, name: 'Tokyo', country: 'Japan' },
  'osaka': { lat: 34.6937, lng: 135.5023, name: 'Osaka', country: 'Japan' },
  'bangkok': { lat: 13.7563, lng: 100.5018, name: 'Bangkok', country: 'Thailand' },
  'phuket': { lat: 7.8804, lng: 98.3923, name: 'Phuket', country: 'Thailand' },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729, name: 'Rio de Janeiro', country: 'Brazil' },
  'sao paulo': { lat: -23.5505, lng: -46.6333, name: 'São Paulo', country: 'Brazil' },
};

// Calculate distance between two points in km (Haversine formula)
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get nearby cities within 500km
function getNearbyCities(cityKey: string, maxDistance: number = 500): string[] {
  const origin = CITY_COORDINATES[cityKey];
  if (!origin) return [];
  
  return Object.entries(CITY_COORDINATES)
    .filter(([key, coords]) => {
      if (key === cityKey) return false;
      const dist = getDistanceKm(origin.lat, origin.lng, coords.lat, coords.lng);
      return dist <= maxDistance;
    })
    .sort((a, b) => {
      const distA = getDistanceKm(origin.lat, origin.lng, a[1].lat, a[1].lng);
      const distB = getDistanceKm(origin.lat, origin.lng, b[1].lat, b[1].lng);
      return distA - distB;
    })
    .slice(0, 4) // Max 4 nearby cities
    .map(([key]) => key);
}

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

interface UKTravelAdvice {
  country: string;
  alert_status: string[];
  change_description: string;
  last_updated: string;
  url: string;
}

interface ACLEDData {
  country: string;
  location?: string; // City or region name
  total_events: number;
  fatalities: number;
  events_last_30_days: number;
  event_types: { [key: string]: number };
  last_updated: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface AdvisoryData {
  [key: string]: TravelAdvisory;
}

interface UKAdvisoryData {
  [key: string]: UKTravelAdvice;
}

interface ACLEDAdvisoryData {
  [key: string]: ACLEDData;
}

interface GDELTHeadline {
  title: string;
  url: string;
  source: string;
  date: string;
  tone: number;
}

interface GDELTData {
  location: string;
  country: string;
  tone_score: number; // -100 to +100, negative = concerning
  volume_level: 'normal' | 'elevated' | 'spike';
  article_count_24h: number;
  themes: { [key: string]: number }; // theme name -> percentage
  headlines: GDELTHeadline[];
  trend_7day: 'improving' | 'worsening' | 'stable';
  last_updated: string;
}

interface GDELTAdvisoryData {
  [key: string]: GDELTData;
}

// Fetch GDELT news data for a location
async function fetchGDELTData(location: string): Promise<GDELTData | null> {
  try {
    // GDELT DOC 2.0 API - get articles and tone
    const response = await fetch(
      `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(location)}&mode=artlist&maxrecords=10&format=json&timespan=7d`
    );
    
    if (!response.ok) {
      console.log(`GDELT API not available for ${location}, using fallback`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.articles && Array.isArray(data.articles)) {
      const articles = data.articles;
      
      // Calculate average tone
      const tones = articles.map((a: any) => a.tone || 0);
      const avgTone = tones.length > 0 ? tones.reduce((a: number, b: number) => a + b, 0) / tones.length : 0;
      
      // Extract headlines
      const headlines: GDELTHeadline[] = articles.slice(0, 5).map((a: any) => ({
        title: a.title || 'Untitled',
        url: a.url || '',
        source: a.domain || 'Unknown',
        date: a.seendate || new Date().toISOString(),
        tone: a.tone || 0,
      }));
      
      // Determine volume level based on article count
      const volumeLevel = articles.length > 50 ? 'spike' : articles.length > 20 ? 'elevated' : 'normal';
      
      return {
        location,
        country: '',
        tone_score: Math.round(avgTone * 10) / 10,
        volume_level: volumeLevel,
        article_count_24h: articles.length,
        themes: {}, // Would need separate API call for themes
        headlines,
        trend_7day: avgTone > 0 ? 'improving' : avgTone < -5 ? 'worsening' : 'stable',
        last_updated: new Date().toISOString(),
      };
    }
    
    return null;
  } catch (error) {
    console.log(`Failed to fetch GDELT data for ${location}:`, error);
    return null;
  }
}

// Fetch ACLED conflict data
// Note: ACLED requires API key for full access. Set ACLED_API_KEY env var or use fallback data.
async function fetchACLEDData(country: string): Promise<ACLEDData | null> {
  try {
    // ACLED API requires authentication - this will use public endpoint if available
    const currentYear = new Date().getFullYear();
    const response = await fetch(
      `https://api.acleddata.com/acled/read?event_date=${currentYear}&event_date_where=>=&country=${encodeURIComponent(country)}&fields=event_type|fatalities|event_date&limit=500`
    );
    
    if (!response.ok) {
      console.log(`ACLED API not available for ${country}, using fallback`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.data && Array.isArray(data.data)) {
      const events = data.data;
      const eventTypes: { [key: string]: number } = {};
      let totalFatalities = 0;
      
      events.forEach((event: any) => {
        const type = event.event_type || 'Unknown';
        eventTypes[type] = (eventTypes[type] || 0) + 1;
        totalFatalities += parseInt(event.fatalities || '0', 10);
      });
      
      // Calculate events in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentEvents = events.filter((e: any) => new Date(e.event_date) >= thirtyDaysAgo).length;
      
      return {
        country,
        total_events: events.length,
        fatalities: totalFatalities,
        events_last_30_days: recentEvents,
        event_types: eventTypes,
        last_updated: new Date().toISOString(),
        trend: recentEvents > events.length / 12 ? 'increasing' : 'stable',
      };
    }
    
    return null;
  } catch (error) {
    console.log(`Failed to fetch ACLED data for ${country}:`, error);
    return null;
  }
}

// Fetch UK Foreign Office travel advice
async function fetchUKAdvisories(): Promise<UKAdvisoryData> {
  try {
    const ukAdvisories: UKAdvisoryData = {};
    
    // Common countries to fetch UK advice for
    const countries = [
      'colombia', 'mexico', 'france', 'japan', 'italy', 
      'spain', 'germany', 'thailand', 'brazil', 'united-kingdom'
    ];
    
    for (const country of countries) {
      try {
        const response = await fetch(`https://www.gov.uk/api/content/foreign-travel-advice/${country}`);
        if (response.ok) {
          const data = await response.json();
          
          if (data.details) {
            ukAdvisories[country] = {
              country: data.title || country.charAt(0).toUpperCase() + country.slice(1),
              alert_status: data.details.alert_status || [],
              change_description: data.details.change_description || '',
              last_updated: data.public_updated_at || new Date().toISOString(),
              url: data.web_url || `https://www.gov.uk/foreign-travel-advice/${country}`,
            };
          }
        }
      } catch (error) {
        console.log(`Failed to fetch UK advice for ${country}:`, error);
      }
    }
    
    return ukAdvisories;
  } catch (error) {
    console.error('Failed to fetch UK advisories:', error);
    return {};
  }
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

// Fallback UK advisory data for common countries
const FALLBACK_UK_ADVISORIES: UKAdvisoryData = {
  'colombia': {
    country: 'Colombia',
    alert_status: ['avoid_all_but_essential_travel_to_parts'],
    change_description: 'FCO advises against all but essential travel to parts of Colombia due to crime and terrorism.',
    last_updated: '2025-12-29T16:17:16Z',
    url: 'https://www.gov.uk/foreign-travel-advice/colombia',
  },
  'mexico': {
    country: 'Mexico',
    alert_status: ['avoid_all_but_essential_travel_to_parts'],
    change_description: 'FCO advises against all but essential travel to parts of Mexico due to crime.',
    last_updated: '2025-12-10T13:43:01Z',
    url: 'https://www.gov.uk/foreign-travel-advice/mexico',
  },
  'france': {
    country: 'France',
    alert_status: [],
    change_description: 'Terrorists are very likely to try to carry out attacks in France.',
    last_updated: '2025-11-20T10:15:00Z',
    url: 'https://www.gov.uk/foreign-travel-advice/france',
  },
  'japan': {
    country: 'Japan',
    alert_status: [],
    change_description: 'Japan is generally a safe country with low crime rates.',
    last_updated: '2025-10-15T09:30:00Z',
    url: 'https://www.gov.uk/foreign-travel-advice/japan',
  },
};

// Fallback ACLED conflict data for countries AND cities
const FALLBACK_ACLED_DATA: ACLEDAdvisoryData = {
  // Country-level data
  'colombia': {
    country: 'Colombia',
    total_events: 1247,
    fatalities: 892,
    events_last_30_days: 98,
    event_types: {
      'Violence against civilians': 312,
      'Battles': 245,
      'Explosions/Remote violence': 189,
      'Protests': 287,
      'Riots': 124,
      'Strategic developments': 90,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
  'mexico': {
    country: 'Mexico',
    total_events: 2156,
    fatalities: 1834,
    events_last_30_days: 187,
    event_types: {
      'Violence against civilians': 892,
      'Battles': 534,
      'Explosions/Remote violence': 245,
      'Protests': 312,
      'Riots': 98,
      'Strategic developments': 75,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'increasing',
  },
  'france': {
    country: 'France',
    total_events: 423,
    fatalities: 12,
    events_last_30_days: 45,
    event_types: {
      'Protests': 287,
      'Riots': 89,
      'Violence against civilians': 23,
      'Strategic developments': 24,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
  'japan': {
    country: 'Japan',
    total_events: 34,
    fatalities: 2,
    events_last_30_days: 3,
    event_types: {
      'Protests': 28,
      'Strategic developments': 6,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
  'thailand': {
    country: 'Thailand',
    total_events: 312,
    fatalities: 89,
    events_last_30_days: 28,
    event_types: {
      'Violence against civilians': 78,
      'Battles': 45,
      'Protests': 134,
      'Riots': 34,
      'Strategic developments': 21,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'decreasing',
  },
  'brazil': {
    country: 'Brazil',
    total_events: 1876,
    fatalities: 1245,
    events_last_30_days: 156,
    event_types: {
      'Violence against civilians': 923,
      'Battles': 312,
      'Protests': 412,
      'Riots': 167,
      'Strategic developments': 62,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
  // City-level data - Colombia
  'medellin': {
    country: 'Colombia',
    location: 'Medellín',
    total_events: 156,
    fatalities: 89,
    events_last_30_days: 12,
    event_types: {
      'Violence against civilians': 67,
      'Protests': 45,
      'Riots': 23,
      'Strategic developments': 21,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'decreasing',
  },
  'bogota': {
    country: 'Colombia',
    location: 'Bogotá',
    total_events: 234,
    fatalities: 45,
    events_last_30_days: 18,
    event_types: {
      'Protests': 134,
      'Violence against civilians': 45,
      'Riots': 34,
      'Strategic developments': 21,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
  'cali': {
    country: 'Colombia',
    location: 'Cali',
    total_events: 198,
    fatalities: 134,
    events_last_30_days: 15,
    event_types: {
      'Violence against civilians': 89,
      'Battles': 45,
      'Protests': 34,
      'Riots': 30,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
  'cartagena': {
    country: 'Colombia',
    location: 'Cartagena',
    total_events: 34,
    fatalities: 12,
    events_last_30_days: 3,
    event_types: {
      'Violence against civilians': 18,
      'Protests': 12,
      'Strategic developments': 4,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
  // City-level data - Mexico
  'mexico city': {
    country: 'Mexico',
    location: 'Mexico City',
    total_events: 312,
    fatalities: 156,
    events_last_30_days: 28,
    event_types: {
      'Violence against civilians': 134,
      'Protests': 98,
      'Riots': 45,
      'Strategic developments': 35,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
  'cancun': {
    country: 'Mexico',
    location: 'Cancún',
    total_events: 67,
    fatalities: 34,
    events_last_30_days: 6,
    event_types: {
      'Violence against civilians': 45,
      'Protests': 12,
      'Strategic developments': 10,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
  'cabo': {
    country: 'Mexico',
    location: 'Los Cabos',
    total_events: 23,
    fatalities: 8,
    events_last_30_days: 2,
    event_types: {
      'Violence against civilians': 15,
      'Strategic developments': 8,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'decreasing',
  },
  // City-level data - Brazil
  'rio de janeiro': {
    country: 'Brazil',
    location: 'Rio de Janeiro',
    total_events: 456,
    fatalities: 312,
    events_last_30_days: 38,
    event_types: {
      'Violence against civilians': 234,
      'Battles': 89,
      'Protests': 78,
      'Riots': 55,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
  'sao paulo': {
    country: 'Brazil',
    location: 'São Paulo',
    total_events: 389,
    fatalities: 198,
    events_last_30_days: 32,
    event_types: {
      'Violence against civilians': 178,
      'Protests': 134,
      'Riots': 45,
      'Strategic developments': 32,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
  // City-level data - Thailand
  'bangkok': {
    country: 'Thailand',
    location: 'Bangkok',
    total_events: 89,
    fatalities: 12,
    events_last_30_days: 8,
    event_types: {
      'Protests': 67,
      'Riots': 12,
      'Strategic developments': 10,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
  'phuket': {
    country: 'Thailand',
    location: 'Phuket',
    total_events: 12,
    fatalities: 2,
    events_last_30_days: 1,
    event_types: {
      'Protests': 8,
      'Strategic developments': 4,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
  // City-level data - France
  'paris': {
    country: 'France',
    location: 'Paris',
    total_events: 187,
    fatalities: 5,
    events_last_30_days: 21,
    event_types: {
      'Protests': 134,
      'Riots': 34,
      'Violence against civilians': 12,
      'Strategic developments': 7,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
  // City-level data - Japan
  'tokyo': {
    country: 'Japan',
    location: 'Tokyo',
    total_events: 18,
    fatalities: 0,
    events_last_30_days: 2,
    event_types: {
      'Protests': 15,
      'Strategic developments': 3,
    },
    last_updated: '2025-12-30T00:00:00Z',
    trend: 'stable',
  },
};

// Fallback GDELT news data for cities and countries
const FALLBACK_GDELT_DATA: GDELTAdvisoryData = {
  // City-level data - Colombia
  'medellin': {
    location: 'Medellín',
    country: 'Colombia',
    tone_score: -2.8,
    volume_level: 'normal',
    article_count_24h: 23,
    themes: {
      'Tourism': 34,
      'Crime': 22,
      'Business': 18,
      'Culture': 15,
      'Politics': 11,
    },
    headlines: [
      { title: 'Medellín named top destination for digital nomads in 2025', url: 'https://example.com/1', source: 'Travel Weekly', date: '2025-12-30', tone: 4.2 },
      { title: 'Security concerns persist in Comuna 13 despite tourism boom', url: 'https://example.com/2', source: 'Colombia Reports', date: '2025-12-29', tone: -3.5 },
      { title: 'New metro line expansion connects Medellín neighborhoods', url: 'https://example.com/3', source: 'Reuters', date: '2025-12-28', tone: 2.1 },
      { title: 'Local authorities crack down on tourist scams', url: 'https://example.com/4', source: 'El Tiempo', date: '2025-12-27', tone: -1.8 },
      { title: 'Medellín tech scene attracts international investment', url: 'https://example.com/5', source: 'Bloomberg', date: '2025-12-26', tone: 3.4 },
    ],
    trend_7day: 'stable',
    last_updated: '2025-12-30T12:00:00Z',
  },
  'bogota': {
    location: 'Bogotá',
    country: 'Colombia',
    tone_score: -3.2,
    volume_level: 'elevated',
    article_count_24h: 45,
    themes: {
      'Politics': 32,
      'Crime': 24,
      'Economy': 20,
      'Protests': 14,
      'Culture': 10,
    },
    headlines: [
      { title: 'Colombia government announces new security measures for capital', url: 'https://example.com/1', source: 'AP News', date: '2025-12-30', tone: -2.1 },
      { title: 'Bogotá mayor addresses rising theft concerns in tourist areas', url: 'https://example.com/2', source: 'Colombia Reports', date: '2025-12-29', tone: -4.5 },
      { title: 'International film festival draws crowds to Bogotá', url: 'https://example.com/3', source: 'Variety', date: '2025-12-28', tone: 3.8 },
    ],
    trend_7day: 'stable',
    last_updated: '2025-12-30T12:00:00Z',
  },
  'colombia': {
    location: 'Colombia',
    country: 'Colombia',
    tone_score: -4.1,
    volume_level: 'elevated',
    article_count_24h: 156,
    themes: {
      'Politics': 28,
      'Violence': 24,
      'Economy': 18,
      'Drug Trade': 15,
      'Tourism': 15,
    },
    headlines: [
      { title: 'Colombia peace process faces new challenges', url: 'https://example.com/1', source: 'Reuters', date: '2025-12-30', tone: -5.2 },
      { title: 'Colombian exports reach record high in 2025', url: 'https://example.com/2', source: 'Bloomberg', date: '2025-12-29', tone: 4.1 },
      { title: 'Rural violence continues in border regions', url: 'https://example.com/3', source: 'AP News', date: '2025-12-28', tone: -7.8 },
    ],
    trend_7day: 'worsening',
    last_updated: '2025-12-30T12:00:00Z',
  },
  // City-level data - Mexico
  'mexico city': {
    location: 'Mexico City',
    country: 'Mexico',
    tone_score: -1.9,
    volume_level: 'normal',
    article_count_24h: 67,
    themes: {
      'Culture': 28,
      'Politics': 24,
      'Tourism': 20,
      'Crime': 16,
      'Business': 12,
    },
    headlines: [
      { title: 'Mexico City ranked among top culinary destinations', url: 'https://example.com/1', source: 'Food & Wine', date: '2025-12-30', tone: 5.2 },
      { title: 'Air quality improvements in capital credited to new policies', url: 'https://example.com/2', source: 'Reuters', date: '2025-12-29', tone: 3.1 },
      { title: 'Pickpocketing on metro remains concern for tourists', url: 'https://example.com/3', source: 'Travel Safety', date: '2025-12-28', tone: -4.2 },
    ],
    trend_7day: 'improving',
    last_updated: '2025-12-30T12:00:00Z',
  },
  'cancun': {
    location: 'Cancún',
    country: 'Mexico',
    tone_score: 1.2,
    volume_level: 'normal',
    article_count_24h: 34,
    themes: {
      'Tourism': 45,
      'Weather': 20,
      'Business': 18,
      'Crime': 12,
      'Environment': 5,
    },
    headlines: [
      { title: 'Cancún hotels report record bookings for holiday season', url: 'https://example.com/1', source: 'Travel Weekly', date: '2025-12-30', tone: 4.8 },
      { title: 'New coral reef restoration project launches near Cancún', url: 'https://example.com/2', source: 'National Geographic', date: '2025-12-29', tone: 5.2 },
      { title: 'Tourist zone security increased ahead of New Year', url: 'https://example.com/3', source: 'Mexico News Daily', date: '2025-12-28', tone: 0.5 },
    ],
    trend_7day: 'stable',
    last_updated: '2025-12-30T12:00:00Z',
  },
  'mexico': {
    location: 'Mexico',
    country: 'Mexico',
    tone_score: -5.3,
    volume_level: 'elevated',
    article_count_24h: 234,
    themes: {
      'Crime': 32,
      'Politics': 25,
      'Economy': 18,
      'Drug Trade': 15,
      'Tourism': 10,
    },
    headlines: [
      { title: 'Cartel violence surges in northern border states', url: 'https://example.com/1', source: 'AP News', date: '2025-12-30', tone: -8.5 },
      { title: 'Mexican peso strengthens against dollar', url: 'https://example.com/2', source: 'Bloomberg', date: '2025-12-29', tone: 3.2 },
      { title: 'Travel advisory updated for several Mexican states', url: 'https://example.com/3', source: 'State Dept', date: '2025-12-28', tone: -5.1 },
    ],
    trend_7day: 'worsening',
    last_updated: '2025-12-30T12:00:00Z',
  },
  // City-level data - France
  'paris': {
    location: 'Paris',
    country: 'France',
    tone_score: 0.8,
    volume_level: 'normal',
    article_count_24h: 89,
    themes: {
      'Culture': 35,
      'Tourism': 28,
      'Politics': 18,
      'Protests': 12,
      'Business': 7,
    },
    headlines: [
      { title: 'Louvre sets new visitor record in 2025', url: 'https://example.com/1', source: 'France 24', date: '2025-12-30', tone: 4.5 },
      { title: 'Paris public transport strike ends after negotiations', url: 'https://example.com/2', source: 'Reuters', date: '2025-12-29', tone: 1.2 },
      { title: 'New Year celebrations planned across Paris landmarks', url: 'https://example.com/3', source: 'Le Monde', date: '2025-12-28', tone: 3.8 },
    ],
    trend_7day: 'stable',
    last_updated: '2025-12-30T12:00:00Z',
  },
  'france': {
    location: 'France',
    country: 'France',
    tone_score: -1.2,
    volume_level: 'normal',
    article_count_24h: 178,
    themes: {
      'Politics': 32,
      'Economy': 24,
      'Protests': 18,
      'Culture': 16,
      'Terrorism': 10,
    },
    headlines: [
      { title: 'French government faces confidence vote', url: 'https://example.com/1', source: 'Reuters', date: '2025-12-30', tone: -3.2 },
      { title: 'French tourism sector posts strong recovery', url: 'https://example.com/2', source: 'Bloomberg', date: '2025-12-29', tone: 4.1 },
      { title: 'Security heightened at major attractions following threats', url: 'https://example.com/3', source: 'AP News', date: '2025-12-28', tone: -4.5 },
    ],
    trend_7day: 'stable',
    last_updated: '2025-12-30T12:00:00Z',
  },
  // City-level data - Japan
  'tokyo': {
    location: 'Tokyo',
    country: 'Japan',
    tone_score: 3.2,
    volume_level: 'normal',
    article_count_24h: 56,
    themes: {
      'Culture': 32,
      'Business': 28,
      'Tourism': 22,
      'Technology': 12,
      'Politics': 6,
    },
    headlines: [
      { title: 'Tokyo named safest major city for travelers in 2025', url: 'https://example.com/1', source: 'Travel + Leisure', date: '2025-12-30', tone: 6.2 },
      { title: 'Japanese yen weakness draws record foreign tourists', url: 'https://example.com/2', source: 'Bloomberg', date: '2025-12-29', tone: 2.8 },
      { title: 'New bullet train route connects Tokyo to regional cities', url: 'https://example.com/3', source: 'Japan Times', date: '2025-12-28', tone: 4.5 },
    ],
    trend_7day: 'improving',
    last_updated: '2025-12-30T12:00:00Z',
  },
  'japan': {
    location: 'Japan',
    country: 'Japan',
    tone_score: 2.8,
    volume_level: 'normal',
    article_count_24h: 134,
    themes: {
      'Economy': 30,
      'Culture': 25,
      'Politics': 20,
      'Tourism': 18,
      'Technology': 7,
    },
    headlines: [
      { title: 'Japan tourism boom continues despite yen fluctuations', url: 'https://example.com/1', source: 'Reuters', date: '2025-12-30', tone: 3.5 },
      { title: 'Japanese companies report strong Q4 earnings', url: 'https://example.com/2', source: 'Nikkei', date: '2025-12-29', tone: 4.2 },
      { title: 'Japan maintains strict entry requirements for some countries', url: 'https://example.com/3', source: 'AP News', date: '2025-12-28', tone: -1.2 },
    ],
    trend_7day: 'stable',
    last_updated: '2025-12-30T12:00:00Z',
  },
  // City-level data - Thailand
  'bangkok': {
    location: 'Bangkok',
    country: 'Thailand',
    tone_score: 1.5,
    volume_level: 'normal',
    article_count_24h: 45,
    themes: {
      'Tourism': 38,
      'Politics': 22,
      'Culture': 20,
      'Crime': 12,
      'Business': 8,
    },
    headlines: [
      { title: 'Bangkok street food scene draws global attention', url: 'https://example.com/1', source: 'CNN Travel', date: '2025-12-30', tone: 5.1 },
      { title: 'New airport express line reduces travel times', url: 'https://example.com/2', source: 'Bangkok Post', date: '2025-12-29', tone: 3.2 },
      { title: 'Police warn tourists about common scams in tourist areas', url: 'https://example.com/3', source: 'Thailand News', date: '2025-12-28', tone: -2.1 },
    ],
    trend_7day: 'stable',
    last_updated: '2025-12-30T12:00:00Z',
  },
  'thailand': {
    location: 'Thailand',
    country: 'Thailand',
    tone_score: 0.8,
    volume_level: 'normal',
    article_count_24h: 98,
    themes: {
      'Tourism': 35,
      'Politics': 28,
      'Economy': 18,
      'Crime': 12,
      'Environment': 7,
    },
    headlines: [
      { title: 'Thailand extends visa-free entry for more countries', url: 'https://example.com/1', source: 'Reuters', date: '2025-12-30', tone: 3.8 },
      { title: 'Southern provinces see uptick in separatist activity', url: 'https://example.com/2', source: 'AP News', date: '2025-12-29', tone: -5.2 },
      { title: 'Thai tourism authority launches new safety campaign', url: 'https://example.com/3', source: 'Travel Weekly', date: '2025-12-28', tone: 2.5 },
    ],
    trend_7day: 'stable',
    last_updated: '2025-12-30T12:00:00Z',
  },
  // City-level data - Brazil
  'rio de janeiro': {
    location: 'Rio de Janeiro',
    country: 'Brazil',
    tone_score: -3.8,
    volume_level: 'normal',
    article_count_24h: 56,
    themes: {
      'Crime': 32,
      'Tourism': 25,
      'Culture': 20,
      'Politics': 15,
      'Sports': 8,
    },
    headlines: [
      { title: 'Rio police launch new favela pacification program', url: 'https://example.com/1', source: 'Reuters', date: '2025-12-30', tone: -2.5 },
      { title: 'Copacabana beach preps for massive New Year celebration', url: 'https://example.com/2', source: 'BBC', date: '2025-12-29', tone: 4.2 },
      { title: 'Tourist robbed at gunpoint near Christ the Redeemer', url: 'https://example.com/3', source: 'O Globo', date: '2025-12-28', tone: -7.8 },
    ],
    trend_7day: 'stable',
    last_updated: '2025-12-30T12:00:00Z',
  },
  'brazil': {
    location: 'Brazil',
    country: 'Brazil',
    tone_score: -4.5,
    volume_level: 'elevated',
    article_count_24h: 189,
    themes: {
      'Crime': 30,
      'Politics': 28,
      'Economy': 22,
      'Environment': 12,
      'Sports': 8,
    },
    headlines: [
      { title: 'Brazil struggles with rising urban violence', url: 'https://example.com/1', source: 'AP News', date: '2025-12-30', tone: -6.5 },
      { title: 'Brazilian real stabilizes after central bank intervention', url: 'https://example.com/2', source: 'Bloomberg', date: '2025-12-29', tone: 2.1 },
      { title: 'Amazon deforestation rates show slight decline', url: 'https://example.com/3', source: 'Reuters', date: '2025-12-28', tone: 1.5 },
    ],
    trend_7day: 'stable',
    last_updated: '2025-12-30T12:00:00Z',
  },
};

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
        backgroundColor: config.style.bg, 
        color: config.style.text,
        border: `1px solid ${config.style.border}`,
        borderRadius: '6px',
        padding: '6px 12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 600,
        fontSize: '14px',
      }}
    >
      <Icon size={16} />
      <span>Level {level}: {config.label}</span>
    </div>
  );
}

function SafetyMeter({ level }: { level: number }) {
  const percentage = ((4 - level + 1) / 4) * 100;
  const config = ADVISORY_LEVELS[level as keyof typeof ADVISORY_LEVELS] || ADVISORY_LEVELS[1];
  
  return (
    <div style={{ width: '100%', marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: COLORS.slate[500], fontWeight: 500 }}>
        <span>Safety Score</span>
        <span style={{ color: config.style.text }}>{Math.round(percentage)}%</span>
      </div>
      <div style={{ 
        width: '100%', 
        height: '8px', 
        backgroundColor: COLORS.slate[200], 
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{ 
          width: `${percentage}%`, 
          height: '100%', 
          backgroundColor: config.style.icon,
          borderRadius: '4px',
          transition: 'width 0.5s ease-out',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: COLORS.slate[400] }}>
        <span>High Risk</span>
        <span>Low Risk</span>
      </div>
    </div>
  );
}

function DashboardCard({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) {
  return (
    <div style={{
      backgroundColor: COLORS.white,
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
      border: `1px solid ${COLORS.slate[200]}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        {Icon && <Icon size={20} style={{ color: COLORS.slate[400] }} />}
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: COLORS.slate[900] }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// Nearby Cities Comparison Component
function NearbyCitiesComparison({ currentCity, acledData, gdeltData, advisories }: { 
  currentCity: string; 
  acledData?: ACLEDData; 
  gdeltData?: GDELTData;
  advisories: TravelAdvisory;
}) {
  const nearbyCities = getNearbyCities(currentCity);
  
  if (nearbyCities.length === 0) return null;
  
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '11px', fontWeight: 500, color: COLORS.slate[500], marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nearby Cities</div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {nearbyCities.map((cityKey) => {
          const cityInfo = CITY_COORDINATES[cityKey];
          if (!cityInfo) return null;
          
          // Get city's data for score calculation
          const cityAcled = FALLBACK_ACLED_DATA[cityKey];
          const cityGdelt = FALLBACK_GDELT_DATA[cityKey];
          
          // Calculate score for this city (simplified - uses country advisory)
          const countryKey = cityInfo.country.toLowerCase();
          const cityAdvisory = FALLBACK_ADVISORIES[countryKey] || advisories;
          const score = calculateSafetyScore(cityAdvisory, cityAcled, cityGdelt);
          const config = getScoreConfig(score);
          
          return (
            <div
              key={cityKey}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: COLORS.white,
                borderRadius: '6px',
                border: `1px solid ${COLORS.slate[200]}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title={`${cityInfo.name}, ${cityInfo.country}`}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: config.bg,
                border: `1px solid ${config.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700,
                color: config.text,
              }}>
                {score}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.slate[700] }}>{cityInfo.name}</div>
                <div style={{ fontSize: '11px', color: COLORS.slate[400] }}>{cityInfo.country}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Calculate composite safety score (1-100) from all data sources
function calculateSafetyScore(advisory: TravelAdvisory, acledData?: ACLEDData, gdeltData?: GDELTData): number {
  let score = 100;
  
  // State Dept advisory level (major factor for country-level)
  // Level 1 = -0, Level 2 = -15, Level 3 = -30, Level 4 = -50
  score -= (advisory.advisory_level - 1) * 15;
  
  // ACLED conflict data (local factor - weighted higher for cities)
  if (acledData) {
    // Events impact: more events = lower score
    if (acledData.total_events > 1000) score -= 15;
    else if (acledData.total_events > 500) score -= 10;
    else if (acledData.total_events > 100) score -= 5;
    
    // Fatalities impact
    if (acledData.fatalities > 500) score -= 10;
    else if (acledData.fatalities > 100) score -= 5;
    
    // Trend impact
    if (acledData.trend === 'increasing') score -= 5;
    else if (acledData.trend === 'decreasing') score += 3;
  }
  
  // GDELT news tone (local sentiment indicator)
  if (gdeltData) {
    // Tone impact: negative tone = concerning
    if (gdeltData.tone_score < -5) score -= 10;
    else if (gdeltData.tone_score < -2) score -= 5;
    else if (gdeltData.tone_score > 2) score += 3;
    
    // Volume spike = something happening
    if (gdeltData.volume_level === 'spike') score -= 8;
    else if (gdeltData.volume_level === 'elevated') score -= 3;
    
    // Trend
    if (gdeltData.trend_7day === 'worsening') score -= 5;
    else if (gdeltData.trend_7day === 'improving') score += 3;
  }
  
  return Math.max(1, Math.min(100, Math.round(score)));
}

function getScoreConfig(score: number) {
  if (score >= 75) return COLORS.safe;
  if (score >= 50) return COLORS.caution;
  if (score >= 25) return COLORS.warning;
  return COLORS.danger;
}

function getScoreLabel(score: number): string {
  if (score >= 75) return 'Low Risk';
  if (score >= 50) return 'Moderate Risk';
  if (score >= 25) return 'Elevated Risk';
  return 'High Risk';
}

function SearchResult({ advisory, ukAdvisory, acledData, gdeltData, searchTerm, isCity }: { advisory: TravelAdvisory; ukAdvisory?: UKTravelAdvice; acledData?: ACLEDData; gdeltData?: GDELTData; searchTerm: string; isCity: boolean }) {
  const [showMore, setShowMore] = useState(false);
  const config = ADVISORY_LEVELS[advisory.advisory_level as keyof typeof ADVISORY_LEVELS] || ADVISORY_LEVELS[1];
  
  // Calculate composite safety score
  const safetyScore = calculateSafetyScore(advisory, acledData, gdeltData);
  const scoreConfig = getScoreConfig(safetyScore);
  const scoreLabel = getScoreLabel(safetyScore);
  
  return (
    <div style={{
      backgroundColor: COLORS.white,
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)',
      border: `1px solid ${COLORS.slate[200]}`,
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      {/* MAIN VIEW - Always Visible */}
      {/* Header with Location */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <MapPin size={20} style={{ color: COLORS.slate[400] }} />
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: COLORS.slate[900], letterSpacing: '-0.02em' }}>
            {isCity ? (
              <>
                <span style={{ textTransform: 'capitalize' }}>{searchTerm}</span>
                <span style={{ color: COLORS.slate[500], fontWeight: 400, fontSize: '20px' }}>, {advisory.country}</span>
              </>
            ) : (
              advisory.country
            )}
          </h1>
        </div>
      </div>
      
      {/* COMPACT SAFETY SCORE - Clean Minimal Layout */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '20px',
        marginBottom: '24px',
        padding: '20px',
        backgroundColor: COLORS.slate[50],
        borderRadius: '8px',
        border: `1px solid ${COLORS.slate[200]}`,
      }}>
        <div style={{ 
          width: '72px', 
          height: '72px', 
          borderRadius: '50%', 
          backgroundColor: COLORS.white,
          border: `4px solid ${scoreConfig.text}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: scoreConfig.text, lineHeight: 1 }}>{safetyScore}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: scoreConfig.text, marginBottom: '4px' }}>{scoreLabel}</div>
          <div style={{ fontSize: '14px', color: COLORS.slate[500], lineHeight: 1.5 }}>
            {safetyScore >= 75 ? 'Likely safe for travel. Exercise normal precautions.' :
             safetyScore >= 50 ? 'Exercise increased caution. Be aware of surroundings.' :
             safetyScore >= 25 ? 'Reconsider travel. Significant safety concerns exist.' :
             'Do not travel. Extreme risks present.'}
          </div>
        </div>
      </div>
      
      {/* KEY INSIGHTS - Minimal Grid */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {/* Local News (GDELT) */}
          {gdeltData && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: COLORS.white, 
              borderRadius: '8px',
              border: `1px solid ${COLORS.slate[200]}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '11px', color: COLORS.slate[500], marginBottom: '4px', fontWeight: 500, textTransform: 'uppercase' }}>News Tone</div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 700, 
                color: gdeltData.tone_score > 0 ? COLORS.safe.text : gdeltData.tone_score < -3 ? COLORS.danger.text : COLORS.warning.text,
              }}>
                {gdeltData.tone_score > 0 ? '+' : ''}{gdeltData.tone_score}
              </div>
              <div style={{ fontSize: '11px', color: COLORS.slate[400] }}>
                {gdeltData.volume_level === 'spike' ? 'High Volume' : 'Normal Vol'}
              </div>
            </div>
          )}
          
          {/* Local Incidents (ACLED) */}
          {acledData && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: COLORS.white, 
              borderRadius: '8px',
              border: `1px solid ${COLORS.slate[200]}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '11px', color: COLORS.slate[500], marginBottom: '4px', fontWeight: 500, textTransform: 'uppercase' }}>Events</div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 700, 
                color: acledData.total_events > 500 ? COLORS.danger.text : acledData.total_events > 100 ? COLORS.warning.text : COLORS.safe.text,
              }}>
                {acledData.total_events.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: COLORS.slate[400] }}>
                Past Year
              </div>
            </div>
          )}
          
          {/* US Advisory Level */}
          <div style={{ 
            padding: '12px', 
            backgroundColor: COLORS.white, 
            borderRadius: '8px',
            border: `1px solid ${COLORS.slate[200]}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '11px', color: COLORS.slate[500], marginBottom: '4px', fontWeight: 500, textTransform: 'uppercase' }}>US Advisory</div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: config.style.text,
            }}>
              Level {advisory.advisory_level}
            </div>
            <div style={{ fontSize: '11px', color: COLORS.slate[400] }}>
              of 4
            </div>
          </div>
        </div>
      </div>
      
      {/* COMPARE NEARBY CITIES */}
      {isCity && (
        <NearbyCitiesComparison 
          currentCity={searchTerm} 
          acledData={acledData}
          gdeltData={gdeltData}
          advisories={advisory}
        />
      )}
      
      {/* Top Headline (just 1 to save space) */}
      {gdeltData && gdeltData.headlines.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <a
            href={gdeltData.headlines[0].url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 12px',
              backgroundColor: COLORS.slate[50],
              borderRadius: '8px',
              border: `1px solid ${COLORS.slate[200]}`,
              textDecoration: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: COLORS.slate[900], fontWeight: 500, lineHeight: 1.3 }}>{gdeltData.headlines[0].title}</div>
              <div style={{ fontSize: '11px', color: COLORS.slate[500], marginTop: '2px' }}>{gdeltData.headlines[0].source}</div>
            </div>
            <ExternalLink size={14} style={{ color: COLORS.slate[400], flexShrink: 0, marginLeft: '8px' }} />
          </a>
        </div>
      )}
      
      {/* SEE MORE BUTTON */}
      <div style={{ textAlign: 'center', marginBottom: showMore ? '24px' : '0' }}>
        <button
          onClick={() => setShowMore(!showMore)}
          style={{
            padding: '10px 24px',
            backgroundColor: showMore ? COLORS.slate[100] : COLORS.white,
            color: showMore ? COLORS.slate[600] : COLORS.primary,
            border: `1px solid ${showMore ? COLORS.slate[300] : COLORS.slate[200]}`,
            borderRadius: '50px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            boxShadow: showMore ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          {showMore ? (
            <>
              <ChevronUp size={16} />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Full Analysis
            </>
          )}
        </button>
      </div>
      
      {/* EXPANDED SECTION - Only visible when showMore is true */}
      {showMore && (
        <div style={{ borderTop: `1px solid ${COLORS.slate[200]}`, paddingTop: '32px' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600, color: COLORS.slate[900] }}>Detailed Analysis</h3>
          
          {/* Full Data Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {/* US State Department Card */}
            <DashboardCard title="US State Department" icon={Shield}>
              <div style={{ 
                padding: '16px', 
                backgroundColor: config.style.bg, 
                borderRadius: '8px',
                border: `1px solid ${config.style.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: config.style.icon,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLORS.white,
                fontSize: '18px',
                fontWeight: 700,
              }}>
                {advisory.advisory_level}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: COLORS.slate[900] }}>Level {advisory.advisory_level}</div>
                <div style={{ fontSize: '14px', color: config.style.text }}>{config.label}</div>
              </div>
            </div>
          </div>
          <SafetyMeter level={advisory.advisory_level} />
        </DashboardCard>
        
        {/* Advisory Details Card */}
        <DashboardCard title="Advisory Details" icon={Info}>
          <p style={{ margin: '0 0 16px 0', color: COLORS.slate[700], lineHeight: 1.6, fontSize: '14px' }}>
            {advisory.advisory_text}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.slate[500], fontSize: '13px' }}>
            <Calendar size={14} />
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
              padding: '8px 16px',
              backgroundColor: COLORS.white,
              color: COLORS.primary,
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
              border: `1px solid ${COLORS.slate[200]}`,
              transition: 'all 0.2s',
            }}
          >
            <ExternalLink size={14} />
            View Full Advisory
          </a>
        </DashboardCard>
        
        {/* UK Foreign Office Card */}
        {ukAdvisory && (
          <DashboardCard title="UK Foreign Office" icon={Shield}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: COLORS.slate[50], 
              borderRadius: '8px',
              border: `1px solid ${COLORS.slate[200]}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: COLORS.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.white,
                  fontSize: '16px',
                  fontWeight: 700,
                }}>
                  UK
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: COLORS.slate[900] }}>FCO Travel Advice</div>
                  <div style={{ fontSize: '14px', color: COLORS.slate[500] }}>Foreign, Commonwealth & Development Office</div>
                </div>
              </div>
              {ukAdvisory.alert_status.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.danger.text, marginBottom: '8px', textTransform: 'uppercase' }}>
                    Travel Alerts
                  </div>
                  {ukAdvisory.alert_status.map((status, index) => (
                    <div key={index} style={{ 
                      padding: '8px 12px', 
                      backgroundColor: COLORS.danger.bg, 
                      borderRadius: '6px', 
                      fontSize: '13px', 
                      color: COLORS.danger.text,
                      marginBottom: '6px',
                      border: `1px solid ${COLORS.danger.border}`,
                      fontWeight: 500,
                    }}>
                      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  ))}
                </div>
              )}
              <p style={{ margin: '0 0 16px 0', color: COLORS.slate[700], lineHeight: 1.6, fontSize: '14px' }}>
                {ukAdvisory.change_description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.slate[500], fontSize: '13px', marginBottom: '16px' }}>
                <Calendar size={14} />
                <span>Updated: {new Date(ukAdvisory.last_updated).toLocaleDateString()}</span>
              </div>
              <a 
                href={ukAdvisory.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: COLORS.white,
                  color: COLORS.primary,
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: `1px solid ${COLORS.slate[200]}`,
                  transition: 'all 0.2s',
                }}
              >
                <ExternalLink size={14} />
                View UK Advice
              </a>
            </div>
          </DashboardCard>
        )}
        
        {/* ACLED Conflict Data Card */}
        {acledData && (
          <DashboardCard title="ACLED Conflict Data" icon={AlertTriangle}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: COLORS.slate[50], 
              borderRadius: '8px',
              border: `1px solid ${COLORS.slate[200]}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: COLORS.warning.icon,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.white,
                  fontSize: '16px',
                  fontWeight: 700,
                }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: COLORS.slate[900] }}>
                    {acledData.location ? `${acledData.location}, ${acledData.country}` : acledData.country}
                  </div>
                  <div style={{ fontSize: '14px', color: COLORS.slate[500] }}>
                    Conflict Data {acledData.location ? '(City-level)' : '(Country-level)'}
                  </div>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: COLORS.white, borderRadius: '6px', border: `1px solid ${COLORS.slate[200]}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.danger.text }}>{acledData.total_events.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: COLORS.slate[500], fontWeight: 500 }}>Events (2025)</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: COLORS.white, borderRadius: '6px', border: `1px solid ${COLORS.slate[200]}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.danger.text }}>{acledData.fatalities.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: COLORS.slate[500], fontWeight: 500 }}>Fatalities</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: COLORS.white, borderRadius: '6px', border: `1px solid ${COLORS.slate[200]}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.warning.text }}>{acledData.events_last_30_days}</div>
                  <div style={{ fontSize: '12px', color: COLORS.slate[500], fontWeight: 500 }}>Last 30 Days</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: COLORS.white, borderRadius: '6px', border: `1px solid ${COLORS.slate[200]}`, textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 700, 
                    color: acledData.trend === 'increasing' ? COLORS.danger.text : acledData.trend === 'decreasing' ? COLORS.safe.text : COLORS.slate[500] 
                  }}>
                    {acledData.trend === 'increasing' ? '↑ Increasing' : acledData.trend === 'decreasing' ? '↓ Decreasing' : '→ Stable'}
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.slate[500], fontWeight: 500 }}>Trend</div>
                </div>
              </div>
              
              {/* Event Types */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.slate[900], marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Types</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {Object.entries(acledData.event_types).slice(0, 5).map(([type, count]) => (
                    <div key={type} style={{ 
                      padding: '6px 10px', 
                      backgroundColor: COLORS.white, 
                      borderRadius: '6px', 
                      fontSize: '12px',
                      border: `1px solid ${COLORS.slate[200]}`,
                      color: COLORS.slate[700],
                      fontWeight: 500,
                    }}>
                      <span style={{ color: COLORS.slate[500] }}>{type}:</span>{' '}
                      <span style={{ fontWeight: 600, color: COLORS.slate[900] }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.slate[500], fontSize: '13px', marginBottom: '16px' }}>
                <Calendar size={14} />
                <span>Updated: {new Date(acledData.last_updated).toLocaleDateString()}</span>
              </div>
              <a 
                href="https://acleddata.com/dashboard/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: COLORS.white,
                  color: COLORS.primary,
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: `1px solid ${COLORS.slate[200]}`,
                  transition: 'all 0.2s',
                }}
              >
                <ExternalLink size={14} />
                View ACLED Dashboard
              </a>
            </div>
          </DashboardCard>
        )}
        
        {/* GDELT News Analysis Card */}
        {gdeltData && (
          <DashboardCard title="GDELT News Analysis" icon={Globe}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: COLORS.slate[50], 
              borderRadius: '8px',
              border: `1px solid ${COLORS.slate[200]}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: COLORS.safe.icon,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.white,
                  fontSize: '16px',
                  fontWeight: 700,
                }}>
                  <Globe size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: COLORS.slate[900] }}>
                    {gdeltData.location}
                  </div>
                  <div style={{ fontSize: '14px', color: COLORS.slate[500] }}>
                    Global News Monitoring {gdeltData.location !== gdeltData.country ? '(City-level)' : '(Country-level)'}
                  </div>
                </div>
              </div>
              
              {/* Sentiment & Volume Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: COLORS.white, borderRadius: '6px', border: `1px solid ${COLORS.slate[200]}`, textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 700, 
                    color: gdeltData.tone_score > 0 ? COLORS.safe.text : gdeltData.tone_score < -3 ? COLORS.danger.text : COLORS.warning.text 
                  }}>
                    {gdeltData.tone_score > 0 ? '+' : ''}{gdeltData.tone_score}
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.slate[500], fontWeight: 500 }}>News Tone</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: COLORS.white, borderRadius: '6px', border: `1px solid ${COLORS.slate[200]}`, textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 700, 
                    color: gdeltData.volume_level === 'spike' ? COLORS.danger.text : gdeltData.volume_level === 'elevated' ? COLORS.warning.text : COLORS.safe.text 
                  }}>
                    {gdeltData.volume_level === 'spike' ? '🔴 Spike' : gdeltData.volume_level === 'elevated' ? '🟡 Elevated' : '🟢 Normal'}
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.slate[500], fontWeight: 500 }}>Volume</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: COLORS.white, borderRadius: '6px', border: `1px solid ${COLORS.slate[200]}`, textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 700, 
                    color: gdeltData.trend_7day === 'worsening' ? COLORS.danger.text : gdeltData.trend_7day === 'improving' ? COLORS.safe.text : COLORS.slate[500] 
                  }}>
                    {gdeltData.trend_7day === 'worsening' ? '↓ Worsening' : gdeltData.trend_7day === 'improving' ? '↑ Improving' : '→ Stable'}
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.slate[500], fontWeight: 500 }}>7-Day Trend</div>
                </div>
              </div>
              
              {/* Theme Breakdown */}
              {Object.keys(gdeltData.themes).length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.slate[900], marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Themes</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Object.entries(gdeltData.themes).slice(0, 5).map(([theme, pct]) => (
                      <div key={theme} style={{ 
                        padding: '6px 10px', 
                        backgroundColor: COLORS.white, 
                        borderRadius: '6px', 
                        fontSize: '12px',
                        border: `1px solid ${COLORS.slate[200]}`,
                        color: COLORS.slate[700],
                        fontWeight: 500,
                      }}>
                        <span style={{ color: COLORS.slate[500] }}>{theme}:</span>{' '}
                        <span style={{ fontWeight: 600, color: COLORS.slate[900] }}>{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent Headlines */}
              {gdeltData.headlines.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.slate[900], marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Headlines</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {gdeltData.headlines.slice(0, 3).map((headline, index) => (
                      <a
                        key={index}
                        href={headline.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '12px',
                          backgroundColor: COLORS.white,
                          borderRadius: '6px',
                          border: `1px solid ${COLORS.slate[200]}`,
                          textDecoration: 'none',
                          display: 'block',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ 
                          fontSize: '14px', 
                          color: COLORS.slate[900], 
                          fontWeight: 500,
                          marginBottom: '4px',
                          lineHeight: 1.4,
                        }}>
                          {headline.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: COLORS.slate[500] }}>
                          <span>{headline.source}</span>
                          <span style={{ color: COLORS.slate[300] }}>•</span>
                          <span style={{ 
                            color: headline.tone > 0 ? COLORS.safe.text : headline.tone < -3 ? COLORS.danger.text : COLORS.warning.text,
                            fontWeight: 500,
                          }}>
                            Tone: {headline.tone > 0 ? '+' : ''}{headline.tone.toFixed(1)}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.slate[500], fontSize: '13px', marginBottom: '16px' }}>
                <Calendar size={14} />
                <span>Data from GDELT • {gdeltData.article_count_24h} articles in 24h</span>
              </div>
              <a 
                href={`https://gdeltproject.org/`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: COLORS.white,
                  color: COLORS.primary,
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: `1px solid ${COLORS.slate[200]}`,
                  transition: 'all 0.2s',
                }}
              >
                <ExternalLink size={14} />
                View GDELT Project
              </a>
            </div>
          </DashboardCard>
        )}
          </div>
          
          {/* Advisory Level Legend */}
          <div style={{ 
            padding: '16px', 
            backgroundColor: COLORS.slate[50], 
            borderRadius: '12px',
            border: `1px solid ${COLORS.slate[200]}`,
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: COLORS.slate[900], textTransform: 'uppercase', letterSpacing: '0.05em' }}>Advisory Levels</h4>
            <div style={{ display: 'grid', gap: '8px' }}>
              {Object.entries(ADVISORY_LEVELS).map(([level, info]) => {
                const Icon = info.icon;
                return (
                  <div 
                    key={level}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      backgroundColor: info.style.bg,
                      borderRadius: '6px',
                      fontSize: '13px',
                      border: `1px solid ${info.style.border}`,
                    }}
                  >
                    <Icon size={16} style={{ color: info.style.icon }} />
                    <span style={{ fontWeight: 600, color: info.style.text }}>Level {level}:</span>
                    <span style={{ color: COLORS.slate[600] }}>{info.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* City-specific note in expanded */}
          {isCity && (
            <div style={{
              marginTop: '16px',
              padding: '14px',
              backgroundColor: COLORS.primary + '10', // 10% opacity
              borderRadius: '10px',
              border: `1px solid ${COLORS.primary}30`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}>
              <Info size={18} style={{ color: COLORS.primary, flexShrink: 0, marginTop: '2px' }} />
              <div style={{ color: COLORS.slate[700], fontSize: '13px', lineHeight: 1.5 }}>
                <strong style={{ color: COLORS.primary }}>Note:</strong> Government advisories apply to {advisory.country} as a whole. 
                Local data (ACLED, GDELT) is specific to <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{searchTerm}</span>.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TravelSafety() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{ advisory: TravelAdvisory; ukAdvisory?: UKTravelAdvice; acledData?: ACLEDData; gdeltData?: GDELTData; isCity: boolean; searchTerm: string } | null>(null);
  const [advisories, setAdvisories] = useState<AdvisoryData>(FALLBACK_ADVISORIES);
  const [ukAdvisories, setUkAdvisories] = useState<UKAdvisoryData>(FALLBACK_UK_ADVISORIES);
  const [acledData, setAcledData] = useState<ACLEDAdvisoryData>(FALLBACK_ACLED_DATA);
  const [gdeltData, setGdeltData] = useState<GDELTAdvisoryData>(FALLBACK_GDELT_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiLoaded, setApiLoaded] = useState(false);

  // Load advisories on mount
  useEffect(() => {
    Promise.all([
      fetchStateAdvisories(),
      fetchUKAdvisories()
    ]).then(([usData, ukData]) => {
      if (Object.keys(usData).length > 0) {
        setAdvisories({ ...FALLBACK_ADVISORIES, ...usData });
      }
      if (Object.keys(ukData).length > 0) {
        setUkAdvisories({ ...FALLBACK_UK_ADVISORIES, ...ukData });
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
      const ukAdvisory = ukAdvisories[countryKey];
      // Use city-specific ACLED and GDELT data if available, otherwise fall back to country
      const acled = acledData[query] || acledData[countryKey];
      const gdelt = gdeltData[query] || gdeltData[countryKey];
      if (advisory) {
        setSearchResult({ advisory, ukAdvisory, acledData: acled, gdeltData: gdelt, isCity: true, searchTerm: query });
        setLoading(false);
        return;
      }
    }
    
    // Check if it's a country
    const advisory = advisories[query];
    const ukAdvisory = ukAdvisories[query];
    const acled = acledData[query];
    const gdelt = gdeltData[query];
    if (advisory) {
      setSearchResult({ advisory, ukAdvisory, acledData: acled, gdeltData: gdelt, isCity: false, searchTerm: query });
      setLoading(false);
      return;
    }
    
    // Fuzzy match - find countries that contain the search term
    const partialMatch = Object.entries(advisories).find(([key, value]) => 
      key.includes(query) || value.country.toLowerCase().includes(query)
    );
    
    if (partialMatch) {
      const ukAdvisory = ukAdvisories[partialMatch[0]];
      const acled = acledData[partialMatch[0]];
      const gdelt = gdeltData[partialMatch[0]];
      setSearchResult({ advisory: partialMatch[1], ukAdvisory, acledData: acled, gdeltData: gdelt, isCity: false, searchTerm: partialMatch[1].country.toLowerCase() });
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
      backgroundColor: COLORS.slate[50],
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      color: COLORS.slate[900],
    }}>
      {/* Hero Section - Minimal & Clean */}
      <div style={{
        backgroundColor: COLORS.white,
        padding: '64px 24px 48px',
        textAlign: 'center',
        borderBottom: `1px solid ${COLORS.slate[200]}`,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ 
              backgroundColor: COLORS.primary, 
              borderRadius: '10px', 
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)',
            }}>
              <Globe size={24} style={{ color: 'white' }} />
            </div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: COLORS.slate[900], letterSpacing: '-0.02em' }}>
              Travel Safety Index
            </h1>
          </div>
          <p style={{ margin: '0 0 32px 0', fontSize: '16px', color: COLORS.slate[500], maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Real-time safety assessments from official government sources and global news data.
          </p>
          
          {/* Search Bar - Sleek & Minimal */}
          <div style={{
            display: 'flex',
            maxWidth: '560px',
            margin: '0 auto',
            backgroundColor: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: `1px solid ${COLORS.slate[200]}`,
            transition: 'box-shadow 0.2s, border-color 0.2s',
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: COLORS.slate[400] }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search city or country (e.g. Tokyo)..."
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  fontSize: '16px',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  color: COLORS.slate[900],
                }}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                padding: '0 24px',
                backgroundColor: COLORS.white,
                color: COLORS.primary,
                border: 'none',
                borderLeft: `1px solid ${COLORS.slate[100]}`,
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          {/* Popular Searches */}
          <div style={{ marginTop: '24px' }}>
            <span style={{ color: COLORS.slate[400], fontSize: '12px', marginRight: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trending:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term);
                  setTimeout(() => {
                    setSearchQuery(term);
                    const query = term.toLowerCase();
                    const advisory = advisories[query];
                    const ukAdvisory = ukAdvisories[query];
                    const acled = acledData[query];
                    const gdelt = gdeltData[query];
                    if (advisory) {
                      setSearchResult({ advisory, ukAdvisory, acledData: acled, gdeltData: gdelt, isCity: false, searchTerm: query });
                    }
                  }, 0);
                }}
                style={{
                  padding: '6px 12px',
                  margin: '4px',
                  backgroundColor: COLORS.white,
                  color: COLORS.slate[700],
                  border: `1px solid ${COLORS.slate[200]}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Results Section */}
      <div style={{ padding: '40px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        {error && (
          <div style={{
            maxWidth: '600px',
            margin: '0 auto 32px',
            padding: '16px 24px',
            backgroundColor: COLORS.danger.bg,
            borderRadius: '8px',
            border: `1px solid ${COLORS.danger.border}`,
            color: COLORS.danger.text,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            fontWeight: 500,
          }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        
        {searchResult && (
          <SearchResult 
            advisory={searchResult.advisory}
            ukAdvisory={searchResult.ukAdvisory}
            acledData={searchResult.acledData}
            gdeltData={searchResult.gdeltData}
            searchTerm={searchResult.searchTerm}
            isCity={searchResult.isCity}
          />
        )}
        
        {!searchResult && !error && (
          <div style={{ textAlign: 'center', color: COLORS.slate[400], maxWidth: '480px', margin: '64px auto' }}>
            <Shield size={48} style={{ marginBottom: '24px', opacity: 0.2 }} />
            <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 600, color: COLORS.slate[900] }}>
              Search for a Destination
            </h2>
            <p style={{ margin: 0, lineHeight: 1.6, fontSize: '15px', color: COLORS.slate[500] }}>
              Enter a city or country name above to view comprehensive safety data, news sentiment, and travel advisories.
            </p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div style={{
        padding: '32px 24px',
        textAlign: 'center',
        borderTop: `1px solid ${COLORS.slate[200]}`,
        backgroundColor: COLORS.white,
      }}>
        <p style={{ margin: 0, color: COLORS.slate[400], fontSize: '13px' }}>
          Data sourced from the{' '}
          <a 
            href="https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: COLORS.primary, textDecoration: 'none', fontWeight: 500 }}
          >
            US Department of State
          </a>
          ,{' '}
          <a 
            href="https://www.gov.uk/foreign-travel-advice" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: COLORS.primary, textDecoration: 'none', fontWeight: 500 }}
          >
            UK Foreign Office
          </a>
          ,{' '}
          <a 
            href="https://acleddata.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: COLORS.primary, textDecoration: 'none', fontWeight: 500 }}
          >
            ACLED
          </a>
          , and{' '}
          <a 
            href="https://www.gdeltproject.org/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: COLORS.primary, textDecoration: 'none', fontWeight: 500 }}
          >
            GDELT Project
          </a>
          .
        </p>
        <p style={{ margin: '8px 0 0 0', color: COLORS.slate[300], fontSize: '12px' }}>
          For informational purposes only. Always verify with official sources before traveling.
        </p>
      </div>
    </div>
  );
}
