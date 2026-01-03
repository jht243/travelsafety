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

function getScoreColor(score: number): string {
  if (score >= 75) return '#22c55e'; // Green
  if (score >= 50) return '#eab308'; // Yellow
  if (score >= 25) return '#f97316'; // Orange
  return '#dc2626'; // Red
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
  const scoreColor = getScoreColor(safetyScore);
  const scoreLabel = getScoreLabel(safetyScore);
  
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
      {/* MAIN VIEW - Always Visible */}
      {/* Header with Location */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <MapPin size={24} style={{ color: scoreColor }} />
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#111827' }}>
            {isCity ? (
              <>
                <span style={{ textTransform: 'capitalize' }}>{searchTerm}</span>
                <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '20px' }}>, {advisory.country}</span>
              </>
            ) : (
              advisory.country
            )}
          </h1>
        </div>
      </div>
      
      {/* BIG SAFETY SCORE - The Main Visual */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        marginBottom: '32px',
        padding: '24px',
        backgroundColor: `${scoreColor}10`,
        borderRadius: '16px',
        border: `2px solid ${scoreColor}30`,
      }}>
        <div style={{ 
          width: '140px', 
          height: '140px', 
          borderRadius: '50%', 
          backgroundColor: scoreColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 8px 24px ${scoreColor}40`,
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '48px', fontWeight: 800, color: 'white', lineHeight: 1 }}>{safetyScore}</div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'white', opacity: 0.9 }}>/ 100</div>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: scoreColor, marginBottom: '4px' }}>{scoreLabel}</div>
        <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', maxWidth: '400px' }}>
          {safetyScore >= 75 ? 'Generally safe for travelers with normal precautions.' :
           safetyScore >= 50 ? 'Exercise increased caution. Be aware of your surroundings.' :
           safetyScore >= 25 ? 'Reconsider travel. Significant safety concerns exist.' :
           'Avoid travel if possible. Serious risks present.'}
        </div>
      </div>
      
      {/* KEY INSIGHTS - Quick Summary */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#374151' }}>Key Insights</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Local News Sentiment (GDELT) */}
          {gdeltData && (
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Globe size={18} style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Local News Sentiment</span>
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 700, 
                color: gdeltData.tone_score > 0 ? '#22c55e' : gdeltData.tone_score < -3 ? '#dc2626' : '#f97316',
                marginBottom: '4px',
              }}>
                {gdeltData.tone_score > 0 ? '+' : ''}{gdeltData.tone_score}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {gdeltData.volume_level === 'spike' ? '🔴 News spike detected' : 
                 gdeltData.volume_level === 'elevated' ? '🟡 Elevated coverage' : 
                 '🟢 Normal coverage'} • {gdeltData.trend_7day === 'worsening' ? 'Trend ↓' : gdeltData.trend_7day === 'improving' ? 'Trend ↑' : 'Stable'}
              </div>
            </div>
          )}
          
          {/* Local Conflict Events (ACLED) */}
          {acledData && (
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={18} style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  {acledData.location ? 'Local Incidents' : 'Country Incidents'}
                </span>
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 700, 
                color: acledData.total_events > 500 ? '#dc2626' : acledData.total_events > 100 ? '#f97316' : '#22c55e',
                marginBottom: '4px',
              }}>
                {acledData.total_events.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Events in 2025 • {acledData.events_last_30_days} last 30 days • {acledData.trend === 'increasing' ? 'Trend ↑' : acledData.trend === 'decreasing' ? 'Trend ↓' : 'Stable'}
              </div>
            </div>
          )}
          
          {/* Government Advisory Level */}
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f9fafb', 
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Shield size={18} style={{ color: '#6b7280' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>US Advisory Level</span>
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 700, 
              color: config.color,
              marginBottom: '4px',
            }}>
              Level {advisory.advisory_level}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {config.label} • Country-wide
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Headlines (if available) */}
      {gdeltData && gdeltData.headlines.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#374151' }}>Recent News</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {gdeltData.headlines.slice(0, 2).map((headline, index) => (
              <a
                key={index}
                href={headline.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  textDecoration: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>{headline.title}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{headline.source}</div>
                </div>
                <ExternalLink size={16} style={{ color: '#9ca3af', flexShrink: 0, marginLeft: '12px' }} />
              </a>
            ))}
          </div>
        </div>
      )}
      
      {/* SEE MORE BUTTON */}
      <div style={{ textAlign: 'center', marginBottom: showMore ? '24px' : '0' }}>
        <button
          onClick={() => setShowMore(!showMore)}
          style={{
            padding: '12px 32px',
            backgroundColor: showMore ? '#f3f4f6' : '#2563eb',
            color: showMore ? '#374151' : 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          {showMore ? (
            <>
              <ChevronUp size={20} />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown size={20} />
              See Full Analysis
            </>
          )}
        </button>
      </div>
      
      {/* EXPANDED SECTION - Only visible when showMore is true */}
      {showMore && (
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600, color: '#111827' }}>Detailed Analysis</h3>
          
          {/* Full Data Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {/* US State Department Card */}
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
        
        {/* UK Foreign Office Card */}
        {ukAdvisory && (
          <DashboardCard title="UK Foreign Office" icon={Shield}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f0f9ff', 
              borderRadius: '12px',
              border: '1px solid #0ea5e930',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 700,
                }}>
                  UK
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>FCO Travel Advice</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Foreign, Commonwealth & Development Office</div>
                </div>
              </div>
              {ukAdvisory.alert_status.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }}>
                    ⚠️ Travel Alerts:
                  </div>
                  {ukAdvisory.alert_status.map((status, index) => (
                    <div key={index} style={{ 
                      padding: '6px 12px', 
                      backgroundColor: '#fef2f2', 
                      borderRadius: '6px', 
                      fontSize: '13px', 
                      color: '#991b1b',
                      marginBottom: '4px',
                      border: '1px solid #fecaca'
                    }}>
                      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  ))}
                </div>
              )}
              <p style={{ margin: '0 0 12px 0', color: '#4b5563', lineHeight: 1.5, fontSize: '14px' }}>
                {ukAdvisory.change_description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '13px' }}>
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
                  marginTop: '12px',
                  padding: '10px 16px',
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'background-color 0.2s',
                }}
              >
                <ExternalLink size={16} />
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
              backgroundColor: '#fefce8', 
              borderRadius: '12px',
              border: '1px solid #fef08a',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#eab308',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 700,
                }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>
                    {acledData.location ? `${acledData.location}, ${acledData.country}` : acledData.country}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    ACLED Conflict Data {acledData.location ? '(City-level)' : '(Country-level)'}
                  </div>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>{acledData.total_events.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Events (2025)</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>{acledData.fatalities.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Fatalities</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#f97316' }}>{acledData.events_last_30_days}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Last 30 Days</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 700, 
                    color: acledData.trend === 'increasing' ? '#dc2626' : acledData.trend === 'decreasing' ? '#22c55e' : '#6b7280' 
                  }}>
                    {acledData.trend === 'increasing' ? '↑ Increasing' : acledData.trend === 'decreasing' ? '↓ Decreasing' : '→ Stable'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Trend</div>
                </div>
              </div>
              
              {/* Event Types */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Event Types:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {Object.entries(acledData.event_types).slice(0, 5).map(([type, count]) => (
                    <div key={type} style={{ 
                      padding: '4px 10px', 
                      backgroundColor: 'white', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      border: '1px solid #e5e7eb',
                    }}>
                      <span style={{ color: '#6b7280' }}>{type}:</span>{' '}
                      <span style={{ fontWeight: 600, color: '#111827' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '13px' }}>
                <Calendar size={14} />
                <span>Data from ACLED • Updated: {new Date(acledData.last_updated).toLocaleDateString()}</span>
              </div>
              <a 
                href="https://acleddata.com/dashboard/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '12px',
                  padding: '10px 16px',
                  backgroundColor: '#eab308',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'background-color 0.2s',
                }}
              >
                <ExternalLink size={16} />
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
              backgroundColor: '#f0fdf4', 
              borderRadius: '12px',
              border: '1px solid #bbf7d0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 700,
                }}>
                  <Globe size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>
                    {gdeltData.location}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Global News Monitoring {gdeltData.location !== gdeltData.country ? '(City-level)' : '(Country-level)'}
                  </div>
                </div>
              </div>
              
              {/* Sentiment & Volume Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 700, 
                    color: gdeltData.tone_score > 0 ? '#22c55e' : gdeltData.tone_score < -3 ? '#dc2626' : '#f97316' 
                  }}>
                    {gdeltData.tone_score > 0 ? '+' : ''}{gdeltData.tone_score}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>News Tone</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 700, 
                    color: gdeltData.volume_level === 'spike' ? '#dc2626' : gdeltData.volume_level === 'elevated' ? '#f97316' : '#22c55e' 
                  }}>
                    {gdeltData.volume_level === 'spike' ? '🔴 Spike' : gdeltData.volume_level === 'elevated' ? '🟡 Elevated' : '🟢 Normal'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Volume</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 700, 
                    color: gdeltData.trend_7day === 'worsening' ? '#dc2626' : gdeltData.trend_7day === 'improving' ? '#22c55e' : '#6b7280' 
                  }}>
                    {gdeltData.trend_7day === 'worsening' ? '↓ Worsening' : gdeltData.trend_7day === 'improving' ? '↑ Improving' : '→ Stable'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>7-Day Trend</div>
                </div>
              </div>
              
              {/* Theme Breakdown */}
              {Object.keys(gdeltData.themes).length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>News Theme Breakdown:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Object.entries(gdeltData.themes).slice(0, 5).map(([theme, pct]) => (
                      <div key={theme} style={{ 
                        padding: '4px 10px', 
                        backgroundColor: 'white', 
                        borderRadius: '12px', 
                        fontSize: '12px',
                        border: '1px solid #e5e7eb',
                      }}>
                        <span style={{ color: '#6b7280' }}>{theme}:</span>{' '}
                        <span style={{ fontWeight: 600, color: '#111827' }}>{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent Headlines */}
              {gdeltData.headlines.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Recent Headlines:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {gdeltData.headlines.slice(0, 3).map((headline, index) => (
                      <a
                        key={index}
                        href={headline.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '10px 12px',
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          textDecoration: 'none',
                          display: 'block',
                        }}
                      >
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#111827', 
                          fontWeight: 500,
                          marginBottom: '4px',
                          lineHeight: 1.4,
                        }}>
                          {headline.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#6b7280' }}>
                          <span>{headline.source}</span>
                          <span>•</span>
                          <span style={{ 
                            color: headline.tone > 0 ? '#22c55e' : headline.tone < -3 ? '#dc2626' : '#f97316',
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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '12px' }}>
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
                  marginTop: '12px',
                  padding: '10px 16px',
                  backgroundColor: '#22c55e',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'background-color 0.2s',
                }}
              >
                <ExternalLink size={16} />
                View GDELT Project
              </a>
            </div>
          </DashboardCard>
        )}
          </div>
          
          {/* Advisory Level Legend */}
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f9fafb', 
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>US Advisory Levels Explained</h4>
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
                      backgroundColor: info.bgColor,
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  >
                    <Icon size={16} style={{ color: info.color }} />
                    <span style={{ fontWeight: 600, color: info.color }}>Level {level}:</span>
                    <span style={{ color: '#4b5563' }}>{info.label}</span>
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
              backgroundColor: '#eff6ff',
              borderRadius: '10px',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}>
              <Info size={18} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ color: '#1e40af', fontSize: '13px', lineHeight: 1.5 }}>
                <strong>Note:</strong> Government advisories apply to {advisory.country} as a whole. 
                Local data (ACLED, GDELT) is specific to <span style={{ textTransform: 'capitalize' }}>{searchTerm}</span>.
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
            ukAdvisory={searchResult.ukAdvisory}
            acledData={searchResult.acledData}
            gdeltData={searchResult.gdeltData}
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
