#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js'

const BASE_URL = process.env.VEDINTEL_BASE_URL ?? 'https://api.vedintelastroapi.com/api/v1'
const API_KEY = process.env.VEDINTEL_API_KEY ?? ''

if (!API_KEY) {
  process.stderr.write(
    'Warning: VEDINTEL_API_KEY is not set. Get a free key at https://vedintelastroapi.com/auth/signup\n'
  )
}

// ─── Shared parameter schemas ────────────────────────────────────────────────

const BIRTH_PARAMS = {
  dob: {
    type: 'string' as const,
    description: 'Date of birth in DD/MM/YYYY format. Example: "01/10/1977"',
  },
  tob: {
    type: 'string' as const,
    description: 'Time of birth in HH:MM 24-hour format. Example: "11:40"',
  },
  lat: {
    type: 'number' as const,
    description: 'Latitude of birth place (decimal degrees). Example: 11.0 for Coimbatore',
  },
  lon: {
    type: 'number' as const,
    description: 'Longitude of birth place (decimal degrees). Example: 77.0 for Coimbatore',
  },
  tz: {
    type: 'number' as const,
    description: 'UTC timezone offset. Use 5.5 for IST (India Standard Time)',
  },
}

const BIRTH_REQUIRED = ['dob', 'tob', 'lat', 'lon', 'tz']

// ─── API call helper ──────────────────────────────────────────────────────────

async function callAPI(
  endpoint: string,
  params: Record<string, string | number | boolean>
): Promise<unknown> {
  const url = new URL(`${BASE_URL}/${endpoint}`)
  url.searchParams.set('api_key', API_KEY)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }

  const res = await fetch(url.toString())
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new McpError(ErrorCode.InternalError, `API error ${res.status}: ${body}`)
  }

  const data = (await res.json()) as { status: number; response: unknown; remaining_api_calls?: number }

  if (data.status !== 200) {
    throw new McpError(ErrorCode.InternalError, `VedIntel™ AstroAPI returned status ${data.status}`)
  }

  return {
    data: data.response,
    remaining_api_calls: data.remaining_api_calls,
  }
}

function formatResult(result: unknown): string {
  return JSON.stringify(result, null, 2)
}

// ─── All 106+ endpoints for discovery ────────────────────────────────────────

const ALL_ENDPOINTS = [
  // Horoscope
  { path: 'horoscope/planet-details', category: 'Horoscope', desc: 'Planet positions, signs, houses, nakshatras' },
  { path: 'horoscope/divisional-charts', category: 'Horoscope', desc: 'D1–D60 divisional charts (Navamsa D9, Dashamsha D10, etc.)' },
  { path: 'horoscope/chart-image', category: 'Horoscope', desc: 'SVG birth chart image (north/south/east Indian style)' },
  { path: 'horoscope/ashtakvarga', category: 'Horoscope', desc: 'Ashtakvarga bindus table' },
  { path: 'horoscope/binnashtakvarga', category: 'Horoscope', desc: 'Binnashtakvarga (individual planet ashtakvarga)' },
  { path: 'horoscope/ashtakvarga-chart-image', category: 'Horoscope', desc: 'Ashtakvarga SVG bar chart image' },
  { path: 'horoscope/ascendant-report', category: 'Horoscope', desc: 'Detailed ascendant/lagna report' },
  { path: 'horoscope/planet-report', category: 'Horoscope', desc: 'Detailed report for a specific planet' },
  { path: 'horoscope/personal-characteristics', category: 'Horoscope', desc: 'Personality traits from birth chart' },
  { path: 'horoscope/planetary-aspects', category: 'Horoscope', desc: 'Planetary aspects and their effects' },
  { path: 'horoscope/planets-in-houses', category: 'Horoscope', desc: 'Planets in houses interpretation' },
  { path: 'horoscope/western-planets', category: 'Horoscope', desc: 'Western tropical chart planet positions' },
  { path: 'horoscope/ai-12-month-prediction', category: 'Horoscope', desc: 'AI-powered 12-month prediction' },
  // Extended Horoscope
  { path: 'extended-horoscope/find-ascendant', category: 'Extended Horoscope', desc: 'Calculate lagna/ascendant sign' },
  { path: 'extended-horoscope/find-moon-sign', category: 'Extended Horoscope', desc: 'Calculate Moon sign (Rashi)' },
  { path: 'extended-horoscope/find-sun-sign', category: 'Extended Horoscope', desc: 'Calculate Sun sign' },
  { path: 'extended-horoscope/current-sade-sati', category: 'Extended Horoscope', desc: 'Current Sade Sati status and phase' },
  { path: 'extended-horoscope/sade-sati-table', category: 'Extended Horoscope', desc: 'Full Sade Sati history and future table' },
  { path: 'extended-horoscope/extended-kundli-details', category: 'Extended Horoscope', desc: 'Extended Kundali details including yogas' },
  { path: 'extended-horoscope/shad-bala', category: 'Extended Horoscope', desc: 'Shadbala planetary strength scores' },
  { path: 'extended-horoscope/friendship-table', category: 'Extended Horoscope', desc: 'Planetary friendship table' },
  { path: 'extended-horoscope/kp-houses', category: 'Extended Horoscope', desc: 'KP (Krishnamurti Paddhati) house cusps' },
  { path: 'extended-horoscope/kp-planets', category: 'Extended Horoscope', desc: 'KP planet sub-lords' },
  { path: 'extended-horoscope/gem-suggestion', category: 'Extended Horoscope', desc: 'Gemstone recommendations from chart' },
  { path: 'extended-horoscope/rudraksh-suggestion', category: 'Extended Horoscope', desc: 'Rudraksha bead recommendations' },
  { path: 'extended-horoscope/numero-table', category: 'Extended Horoscope', desc: 'Numerology table from birth data' },
  { path: 'extended-horoscope/yoga-list', category: 'Extended Horoscope', desc: 'List of all yogas in the chart' },
  { path: 'extended-horoscope/yoga-calculator', category: 'Extended Horoscope', desc: 'Detailed yoga calculation and interpretation' },
  { path: 'extended-horoscope/arutha-padas', category: 'Extended Horoscope', desc: 'Jaimini Arudha Padas' },
  { path: 'extended-horoscope/jaimini-karakas', category: 'Extended Horoscope', desc: 'Jaimini Chara Karakas' },
  { path: 'extended-horoscope/varshapal-details', category: 'Extended Horoscope', desc: 'Varshapal/Solar return chart details' },
  { path: 'extended-horoscope/varshapal-month-chart', category: 'Extended Horoscope', desc: 'Varshapal monthly chart' },
  { path: 'extended-horoscope/varshapal-year-chart', category: 'Extended Horoscope', desc: 'Varshapal yearly chart' },
  // Dashas
  { path: 'dashas/current-mahadasha', category: 'Dashas', desc: 'Current Vimshottari Mahadasha period' },
  { path: 'dashas/current-mahadasha-full', category: 'Dashas', desc: 'Current Mahadasha with Antardasha and Pratyantar' },
  { path: 'dashas/mahadasha', category: 'Dashas', desc: 'Full 120-year Vimshottari Mahadasha timeline' },
  { path: 'dashas/mahadasha-predictions', category: 'Dashas', desc: 'Predictions for each Mahadasha period' },
  { path: 'dashas/antardasha', category: 'Dashas', desc: 'Antardasha (sub-periods) within a Mahadasha' },
  { path: 'dashas/specific-sub-dasha', category: 'Dashas', desc: 'Specific sub-dasha period details' },
  { path: 'dashas/char-dasha-current', category: 'Dashas', desc: 'Current Jaimini Char Dasha' },
  { path: 'dashas/char-dasha-main', category: 'Dashas', desc: 'Jaimini Char Dasha main periods' },
  { path: 'dashas/char-dasha-sub', category: 'Dashas', desc: 'Jaimini Char Dasha sub-periods' },
  { path: 'dashas/yogini-dasha-main', category: 'Dashas', desc: 'Yogini Dasha main periods' },
  { path: 'dashas/yogini-dasha-sub', category: 'Dashas', desc: 'Yogini Dasha sub-periods' },
  // Doshas
  { path: 'dosha/mangal-dosh', category: 'Doshas', desc: 'Mangal Dosha (Mars affliction) check and severity' },
  { path: 'dosha/manglik-dosh', category: 'Doshas', desc: 'Manglik Dosha with cancellation conditions' },
  { path: 'dosha/kaalsarp-dosh', category: 'Doshas', desc: 'Kaal Sarp Dosha type and effects' },
  { path: 'dosha/pitra-dosh', category: 'Doshas', desc: 'Pitra Dosha (ancestral karma) check' },
  { path: 'dosha/papasamaya', category: 'Doshas', desc: 'Papa Samaya malefic planetary analysis' },
  // Panchang
  { path: 'panchang/panchang', category: 'Panchang', desc: 'Full daily Panchang (tithi, nakshatra, yoga, karana, vara)' },
  { path: 'panchang/choghadiya-muhurta', category: 'Panchang', desc: 'Choghadiya auspicious time slots for the day' },
  { path: 'panchang/hora-muhurta', category: 'Panchang', desc: 'Planetary hora muhurta for the day' },
  { path: 'panchang/monthly-panchang', category: 'Panchang', desc: 'Full month Panchang calendar' },
  { path: 'panchang/moon-calendar', category: 'Panchang', desc: 'Monthly Moon phase calendar' },
  { path: 'panchang/moon-phase', category: 'Panchang', desc: 'Current Moon phase' },
  { path: 'panchang/festivals', category: 'Panchang', desc: 'Hindu festivals and vrats for a month/year' },
  { path: 'panchang/sunrise', category: 'Panchang', desc: 'Sunrise time for a date and location' },
  { path: 'panchang/sunset', category: 'Panchang', desc: 'Sunset time for a date and location' },
  { path: 'panchang/moon-rise', category: 'Panchang', desc: 'Moon rise time' },
  { path: 'panchang/moon-set', category: 'Panchang', desc: 'Moon set time' },
  { path: 'panchang/solar-noon', category: 'Panchang', desc: 'Solar noon (Abhijit Muhurta midpoint)' },
  { path: 'panchang/transit', category: 'Panchang', desc: 'Current planetary transits (all 9 planets)' },
  { path: 'panchang/retrogrades', category: 'Panchang', desc: 'Currently retrograde planets' },
  // Matching
  { path: 'matching/north-match', category: 'Matching', desc: 'North Indian guna milan (Ashtakoot, 36-point compatibility)' },
  { path: 'matching/south-match', category: 'Matching', desc: 'South Indian compatibility analysis' },
  { path: 'matching/aggregate-match', category: 'Matching', desc: 'Combined compatibility score with summary' },
  { path: 'matching/rajju-vedha-match', category: 'Matching', desc: 'Rajju and Vedha dosha check for compatibility' },
  { path: 'matching/papasamaya-match', category: 'Matching', desc: 'Papasamaya compatibility analysis' },
  { path: 'matching/nakshatra-match', category: 'Matching', desc: 'Nakshatra-based Ashtakoot compatibility' },
  { path: 'matching/western-match', category: 'Matching', desc: 'Western Sun+Moon sign compatibility (10-point)' },
  { path: 'matching/north-match-astro-details', category: 'Matching', desc: 'Detailed astrological analysis for north match' },
  { path: 'matching/south-match-astro-details', category: 'Matching', desc: 'Detailed astrological analysis for south match' },
  { path: 'matching/bulk-north-match', category: 'Matching', desc: 'Bulk north match — up to 10 couples in one call' },
  { path: 'matching/bulk-south-match', category: 'Matching', desc: 'Bulk south match — up to 10 couples in one call' },
  // Predictions
  { path: 'predictions/daily-sun', category: 'Predictions', desc: 'Daily horoscope prediction based on Sun sign' },
  { path: 'predictions/daily-moon', category: 'Predictions', desc: 'Daily horoscope based on Moon sign (Rashi)' },
  { path: 'predictions/daily-nakshatra', category: 'Predictions', desc: 'Daily prediction based on birth nakshatra' },
  { path: 'predictions/weekly-sun', category: 'Predictions', desc: 'Weekly prediction based on Sun sign' },
  { path: 'predictions/weekly-moon', category: 'Predictions', desc: 'Weekly prediction based on Moon sign' },
  { path: 'predictions/yearly', category: 'Predictions', desc: 'Yearly prediction for any year' },
  { path: 'predictions/biorhythm', category: 'Predictions', desc: 'Biorhythm cycles (physical, emotional, intellectual)' },
  { path: 'predictions/day-number', category: 'Predictions', desc: 'Numerology day number for a date' },
  { path: 'predictions/numerology', category: 'Predictions', desc: 'Full numerology profile (life path, destiny, lucky numbers)' },
  // Utilities
  { path: 'utilities/gem-details', category: 'Utilities', desc: 'Jyotish properties of all 9 Navratna gemstones' },
  { path: 'utilities/geo-search', category: 'Utilities', desc: 'Search city lat/lon/timezone by name' },
  { path: 'utilities/geo-search-advanced', category: 'Utilities', desc: 'Advanced geo search with city+state+country filter' },
  { path: 'utilities/radical-number-details', category: 'Utilities', desc: 'Mulank (radical number) 1–9 detailed profile' },
  { path: 'utilities/nakshatra-vastu-details', category: 'Utilities', desc: 'Vastu direction, colors, and activities for all 27 nakshatras' },
  // AI Endpoints (premium)
  { path: 'ai/interpret/chart', category: 'AI (Premium)', desc: 'Full Claude AI birth chart reading — 700+ words, fully personalized' },
  { path: 'ai/transit/forecast', category: 'AI (Premium)', desc: 'AI-powered transit forecast narrative' },
  { path: 'ai/dasha/narrative', category: 'AI (Premium)', desc: 'AI narrative for current Dasha period' },
  { path: 'ai/compatibility', category: 'AI (Premium)', desc: 'AI compatibility report for two birth charts' },
]

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'get_planet_details',
    description:
      'Get complete Vedic birth chart: all 9 planet positions (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu + Ascendant) with their zodiac sign, house placement, nakshatra, degree, and retrograde status. This is the foundation of any Vedic astrology analysis.',
    inputSchema: {
      type: 'object' as const,
      properties: BIRTH_PARAMS,
      required: BIRTH_REQUIRED,
    },
  },
  {
    name: 'get_ascendant',
    description:
      'Calculate the Lagna (Ascendant/Rising sign) for a birth. Returns the zodiac sign, degree, and nakshatra of the Ascendant. Use this when someone asks "what is my lagna?" or "what is my rising sign?" in Vedic astrology.',
    inputSchema: {
      type: 'object' as const,
      properties: BIRTH_PARAMS,
      required: BIRTH_REQUIRED,
    },
  },
  {
    name: 'get_moon_sign',
    description:
      'Calculate the Moon sign (Chandra Rashi) — the zodiac sign the Moon was in at birth. In Vedic astrology the Moon sign is more important than the Sun sign for personality and daily life. Returns sign, degree, nakshatra, and pada.',
    inputSchema: {
      type: 'object' as const,
      properties: BIRTH_PARAMS,
      required: BIRTH_REQUIRED,
    },
  },
  {
    name: 'get_divisional_chart',
    description:
      'Fetch a divisional (Varga) chart. The most important are D9 Navamsa (marriage, dharma, soul purpose), D10 Dashamsha (career, profession), D7 Saptamsha (children), D3 Drekkana (siblings). Pass chart_type as "D9", "D10", etc.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ...BIRTH_PARAMS,
        chart_type: {
          type: 'string' as const,
          description:
            'Divisional chart type: D1 (birth chart), D2 (Hora), D3 (Drekkana), D7 (Saptamsha), D9 (Navamsa), D10 (Dashamsha), D12 (Dwadashamsha), D16, D20, D24, D27, D30 (Trimshamsha), D40, D45, D60 (Shashtiamsha)',
          enum: ['D1','D2','D3','D7','D9','D10','D12','D16','D20','D24','D27','D30','D40','D45','D60'],
        },
        style: {
          type: 'string' as const,
          description: 'Chart diagram style: "north" (default), "south", or "east"',
          enum: ['north', 'south', 'east'],
        },
      },
      required: [...BIRTH_REQUIRED, 'chart_type'],
    },
  },
  {
    name: 'get_panchang',
    description:
      'Get the Vedic Hindu Panchang (five limbs of the day) for any date and location. Returns: Tithi (lunar day), Nakshatra (Moon constellation), Yoga (sun-moon combination), Karana (half-day), Vara (weekday), sunrise/sunset times, Moon sign, and festival information. Essential for muhurta (auspicious timing).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        dob: { type: 'string' as const, description: 'Date in DD/MM/YYYY format. Example: "24/04/2026"' },
        tob: { type: 'string' as const, description: 'Time in HH:MM format. Example: "07:52"' },
        lat: BIRTH_PARAMS.lat,
        lon: BIRTH_PARAMS.lon,
        tz: BIRTH_PARAMS.tz,
      },
      required: ['dob', 'tob', 'lat', 'lon', 'tz'],
    },
  },
  {
    name: 'get_current_dasha',
    description:
      'Get the current Vimshottari Mahadasha (major period) for a person\'s birth chart. Returns the ruling planet, start date, end date, and remaining years. The 120-year Vimshottari system is the primary dasha used in Vedic astrology for life predictions.',
    inputSchema: {
      type: 'object' as const,
      properties: BIRTH_PARAMS,
      required: BIRTH_REQUIRED,
    },
  },
  {
    name: 'get_dasha_timeline',
    description:
      'Get the complete 120-year Vimshottari Mahadasha sequence from birth. Returns all 9 planetary periods (Sun 6yr, Moon 10yr, Mars 7yr, Rahu 18yr, Jupiter 16yr, Saturn 19yr, Mercury 17yr, Ketu 7yr, Venus 20yr) with exact start and end dates.',
    inputSchema: {
      type: 'object' as const,
      properties: BIRTH_PARAMS,
      required: BIRTH_REQUIRED,
    },
  },
  {
    name: 'get_antardasha',
    description:
      'Get the Antardasha (sub-periods or Bhukti) within the current or a specified Mahadasha. Provides finer timing — each Mahadasha is divided into 9 sub-periods ruled by different planets.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ...BIRTH_PARAMS,
        mahadasha_lord: {
          type: 'string' as const,
          description: 'Planet name to get antardashas for. Leave empty for current Mahadasha.',
          enum: ['Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus'],
        },
      },
      required: BIRTH_REQUIRED,
    },
  },
  {
    name: 'check_sade_sati',
    description:
      'Check if a person is currently in Sade Sati — the 7.5-year period when Saturn transits the sign before, in, and after the natal Moon sign. One of the most important and feared transits in Vedic astrology. Returns current status, phase (rising/peak/setting), and dates.',
    inputSchema: {
      type: 'object' as const,
      properties: BIRTH_PARAMS,
      required: BIRTH_REQUIRED,
    },
  },
  {
    name: 'check_mangal_dosha',
    description:
      'Check for Mangal Dosha (Mars affliction) — whether Mars is placed in the 1st, 2nd, 4th, 7th, 8th, or 12th house, causing the Manglik condition. Highly relevant for matrimonial compatibility. Returns dosha status, which houses trigger it, and cancellation conditions.',
    inputSchema: {
      type: 'object' as const,
      properties: BIRTH_PARAMS,
      required: BIRTH_REQUIRED,
    },
  },
  {
    name: 'check_kaalsarp_dosha',
    description:
      'Check for Kaal Sarp Dosha — when all 7 planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn) are hemmed between Rahu and Ketu. Returns dosha type (Anant, Kulik, Vasuki, etc.), severity, and effects.',
    inputSchema: {
      type: 'object' as const,
      properties: BIRTH_PARAMS,
      required: BIRTH_REQUIRED,
    },
  },
  {
    name: 'get_yogas',
    description:
      'Detect and list all Yogas (auspicious and inauspicious planetary combinations) in a birth chart. Includes Raj Yogas (success), Dhana Yogas (wealth), Panch Mahapurusha Yogas, and more. Returns yoga name, planets involved, and interpretation.',
    inputSchema: {
      type: 'object' as const,
      properties: BIRTH_PARAMS,
      required: BIRTH_REQUIRED,
    },
  },
  {
    name: 'get_kundali_match',
    description:
      'Perform Kundali matching (Guna Milan / Ashtakoot) for two birth charts. Returns the 36-point compatibility score across 8 categories: Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakoot, and Nadi. Essential for matrimonial compatibility analysis.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        m_dob: { type: 'string' as const, description: 'Male date of birth DD/MM/YYYY' },
        m_tob: { type: 'string' as const, description: 'Male time of birth HH:MM' },
        m_lat: { type: 'number' as const, description: 'Male birth place latitude' },
        m_lon: { type: 'number' as const, description: 'Male birth place longitude' },
        m_tz: { type: 'number' as const, description: 'Male birth place timezone offset' },
        f_dob: { type: 'string' as const, description: 'Female date of birth DD/MM/YYYY' },
        f_tob: { type: 'string' as const, description: 'Female time of birth HH:MM' },
        f_lat: { type: 'number' as const, description: 'Female birth place latitude' },
        f_lon: { type: 'number' as const, description: 'Female birth place longitude' },
        f_tz: { type: 'number' as const, description: 'Female birth place timezone offset' },
      },
      required: ['m_dob','m_tob','m_lat','m_lon','m_tz','f_dob','f_tob','f_lat','f_lon','f_tz'],
    },
  },
  {
    name: 'get_planet_transits',
    description:
      'Get current positions of all 9 planets (real-time transit data). Returns today\'s planetary positions — which signs they are in, degrees, and whether any are retrograde. Use for transit analysis, electional astrology, or answering "where is Saturn right now?"',
    inputSchema: {
      type: 'object' as const,
      properties: {
        lat: BIRTH_PARAMS.lat,
        lon: BIRTH_PARAMS.lon,
        tz: BIRTH_PARAMS.tz,
        date: { type: 'string' as const, description: 'Date for transit data in DD/MM/YYYY. Defaults to today.' },
      },
      required: ['lat', 'lon', 'tz'],
    },
  },
  {
    name: 'get_muhurta',
    description:
      'Get Choghadiya muhurta — the auspicious and inauspicious time slots for a day, divided into day and night periods. Each slot is ruled by a planet: Amrit and Shubh are most auspicious for starting new ventures, contracts, travel. Returns all time slots with planet ruler and quality.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        dob: { type: 'string' as const, description: 'Date in DD/MM/YYYY' },
        tob: { type: 'string' as const, description: 'Time in HH:MM' },
        lat: BIRTH_PARAMS.lat,
        lon: BIRTH_PARAMS.lon,
        tz: BIRTH_PARAMS.tz,
      },
      required: ['dob', 'tob', 'lat', 'lon', 'tz'],
    },
  },
  {
    name: 'get_gem_suggestions',
    description:
      'Get Jyotish gemstone recommendations based on the birth chart. Returns the recommended Navratna gem, its ruling planet, the metal to use, mantra, and benefits. Each planet has a corresponding gem (Sun→Ruby, Moon→Pearl, Mars→Coral, etc.).',
    inputSchema: {
      type: 'object' as const,
      properties: BIRTH_PARAMS,
      required: BIRTH_REQUIRED,
    },
  },
  {
    name: 'get_numerology',
    description:
      'Get a full Vedic numerology profile: Life Path number, Destiny number, Soul Urge number, Mulank (radical number), Lucky number, Lucky color, Lucky day, and Lucky stone. Based on date of birth.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        dob: BIRTH_PARAMS.dob,
        name: { type: 'string' as const, description: 'Full name at birth (optional, used for name number calculation)' },
      },
      required: ['dob'],
    },
  },
  {
    name: 'interpret_chart_ai',
    description:
      'Generate a full AI-powered Vedic birth chart reading using Claude (Anthropic). Returns a 700+ word personalized interpretation covering: Ascendant and its nakshatra, Moon sign and emotional nature, Sun sign and life purpose, key planetary placements, prominent yogas, and current Dasha period themes. Requires AI add-on plan.',
    inputSchema: {
      type: 'object' as const,
      properties: BIRTH_PARAMS,
      required: BIRTH_REQUIRED,
    },
  },
  {
    name: 'get_dasha_narrative_ai',
    description:
      'Get an AI-generated narrative for the current Dasha (planetary period) — what themes, challenges, and opportunities this period brings based on the ruling planet, its placement in the natal chart, and how it interacts with the birth chart. Requires AI add-on plan.',
    inputSchema: {
      type: 'object' as const,
      properties: BIRTH_PARAMS,
      required: BIRTH_REQUIRED,
    },
  },
  {
    name: 'lookup_city_coordinates',
    description:
      'Look up latitude, longitude, and timezone for a city by name. Use this before any birth chart calculation when you know the city name but not its coordinates. Searches 80+ Indian and global cities.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        city: { type: 'string' as const, description: 'City name to search. Example: "Mumbai", "Delhi", "London"' },
      },
      required: ['city'],
    },
  },
  {
    name: 'list_endpoints',
    description:
      'List all 106+ endpoints available in VedIntel™ AstroAPI. Optionally filter by category. Categories: Horoscope, Extended Horoscope, Dashas, Doshas, Panchang, Matching, Predictions, Utilities, AI (Premium).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string' as const,
          description: 'Filter by category (optional)',
          enum: ['Horoscope','Extended Horoscope','Dashas','Doshas','Panchang','Matching','Predictions','Utilities','AI (Premium)'],
        },
      },
    },
  },
  {
    name: 'search_endpoints',
    description:
      'Search VedIntel™ AstroAPI endpoints by keyword. Useful for finding the right endpoint when you know what you want (e.g., "navamsa", "mahadasha", "festival", "gemstone").',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' as const, description: 'Keyword to search for. Examples: "navamsa", "compatibility", "retrograde", "sunrise"' },
      },
      required: ['query'],
    },
  },
]

// ─── Server setup ─────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'vedintel-mcp',
    version: '1.0.0',
  },
  {
    capabilities: { tools: {} },
  }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  const p = (args ?? {}) as Record<string, string | number | boolean>

  try {
    switch (name) {
      case 'get_planet_details':
        return { content: [{ type: 'text', text: formatResult(await callAPI('horoscope/planet-details', p)) }] }

      case 'get_ascendant':
        return { content: [{ type: 'text', text: formatResult(await callAPI('extended-horoscope/find-ascendant', p)) }] }

      case 'get_moon_sign':
        return { content: [{ type: 'text', text: formatResult(await callAPI('extended-horoscope/find-moon-sign', p)) }] }

      case 'get_divisional_chart':
        return { content: [{ type: 'text', text: formatResult(await callAPI('horoscope/divisional-charts', p)) }] }

      case 'get_panchang':
        return { content: [{ type: 'text', text: formatResult(await callAPI('panchang/panchang', p)) }] }

      case 'get_current_dasha':
        return { content: [{ type: 'text', text: formatResult(await callAPI('dashas/current-mahadasha', p)) }] }

      case 'get_dasha_timeline':
        return { content: [{ type: 'text', text: formatResult(await callAPI('dashas/mahadasha', p)) }] }

      case 'get_antardasha':
        return { content: [{ type: 'text', text: formatResult(await callAPI('dashas/antardasha', p)) }] }

      case 'check_sade_sati':
        return { content: [{ type: 'text', text: formatResult(await callAPI('extended-horoscope/current-sade-sati', p)) }] }

      case 'check_mangal_dosha':
        return { content: [{ type: 'text', text: formatResult(await callAPI('dosha/mangal-dosh', p)) }] }

      case 'check_kaalsarp_dosha':
        return { content: [{ type: 'text', text: formatResult(await callAPI('dosha/kaalsarp-dosh', p)) }] }

      case 'get_yogas':
        return { content: [{ type: 'text', text: formatResult(await callAPI('extended-horoscope/yoga-list', p)) }] }

      case 'get_kundali_match':
        return { content: [{ type: 'text', text: formatResult(await callAPI('matching/north-match', p)) }] }

      case 'get_planet_transits': {
        const { date, ...rest } = p as Record<string, string | number | boolean>
        const params = date ? { ...rest, dob: date } : { ...rest, dob: new Date().toLocaleDateString('en-GB').replace(/\//g, '/') }
        return { content: [{ type: 'text', text: formatResult(await callAPI('panchang/transit', params)) }] }
      }

      case 'get_muhurta':
        return { content: [{ type: 'text', text: formatResult(await callAPI('panchang/choghadiya-muhurta', p)) }] }

      case 'get_gem_suggestions':
        return { content: [{ type: 'text', text: formatResult(await callAPI('extended-horoscope/gem-suggestion', p)) }] }

      case 'get_numerology':
        return { content: [{ type: 'text', text: formatResult(await callAPI('predictions/numerology', p)) }] }

      case 'interpret_chart_ai':
        return { content: [{ type: 'text', text: formatResult(await callAPI('ai/interpret/chart', p)) }] }

      case 'get_dasha_narrative_ai':
        return { content: [{ type: 'text', text: formatResult(await callAPI('ai/dasha/narrative', p)) }] }

      case 'lookup_city_coordinates':
        return { content: [{ type: 'text', text: formatResult(await callAPI('utilities/geo-search', p)) }] }

      case 'list_endpoints': {
        const cat = (p.category as string | undefined)
        const filtered = cat ? ALL_ENDPOINTS.filter(e => e.category === cat) : ALL_ENDPOINTS
        const grouped: Record<string, typeof ALL_ENDPOINTS> = {}
        for (const ep of filtered) {
          if (!grouped[ep.category]) grouped[ep.category] = []
          grouped[ep.category].push(ep)
        }
        const lines: string[] = [`VedIntel™ AstroAPI — ${filtered.length} endpoints${cat ? ` in ${cat}` : ' across all categories'}\n`]
        for (const [category, eps] of Object.entries(grouped)) {
          lines.push(`## ${category} (${eps.length})`)
          for (const ep of eps) {
            lines.push(`  /api/v1/${ep.path}\n  ${ep.desc}`)
          }
          lines.push('')
        }
        return { content: [{ type: 'text', text: lines.join('\n') }] }
      }

      case 'search_endpoints': {
        const query = ((p.query as string) ?? '').toLowerCase()
        const matches = ALL_ENDPOINTS.filter(
          e => e.path.includes(query) || e.desc.toLowerCase().includes(query) || e.category.toLowerCase().includes(query)
        )
        if (matches.length === 0) {
          return { content: [{ type: 'text', text: `No endpoints found matching "${p.query}". Try list_endpoints to see all available endpoints.` }] }
        }
        const lines = [`Found ${matches.length} endpoint(s) matching "${p.query}":\n`]
        for (const ep of matches) {
          lines.push(`[${ep.category}] /api/v1/${ep.path}`)
          lines.push(`  ${ep.desc}\n`)
        }
        return { content: [{ type: 'text', text: lines.join('\n') }] }
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`)
    }
  } catch (error) {
    if (error instanceof McpError) throw error
    throw new McpError(ErrorCode.InternalError, `Tool error: ${error instanceof Error ? error.message : String(error)}`)
  }
})

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write('VedIntel™ AstroAPI MCP server running. Tools: ' + TOOLS.length + '\n')
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err}\n`)
  process.exit(1)
})
