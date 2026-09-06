# VedIntel™ AstroAPI — MCP Server

The only Vedic astrology MCP server that **actually calls the API and returns live computed results**.

VedicAstroAPI's MCP server is documentation-only — it helps you find endpoints. Ours lets Claude, Cursor, and VS Code **compute real birth charts, dashas, kundali matches, and AI readings** directly in your conversation.

## What you can do

```
"Generate a birth chart for 01/10/1977, 11:40 AM, Coimbatore India"
"Is this person currently in Sade Sati?"
"Check Mangal Dosha for this birth data"
"Match these two charts for marriage compatibility"
"What Mahadasha is this person running?"
"Get today's Panchang for Mumbai"
"Find the D9 Navamsa chart for this person"
"Interpret this birth chart using AI"
"What are the auspicious muhurtas today in Delhi?"
"What coordinates should I use for Chennai?"
```

## 24 Tools

| Tool | What it does |
|------|-------------|
| `get_planet_details` | Complete birth chart — all 9 planets with sign, house, nakshatra |
| `get_ascendant` | Lagna (rising sign) calculation |
| `get_moon_sign` | Chandra Rashi (Moon sign) |
| `get_divisional_chart` | Any D1–D60 chart (D9 Navamsa, D10 Dashamsha, etc.) |
| `get_panchang` | Full Vedic Panchang for any date/location |
| `get_current_dasha` | Current Vimshottari Mahadasha period |
| `get_dasha_timeline` | Full 120-year dasha sequence |
| `get_antardasha` | Antardasha sub-periods |
| `check_sade_sati` | Saturn 7.5-year transit check |
| `check_mangal_dosha` | Mars affliction (Manglik) check |
| `check_kaalsarp_dosha` | Kaal Sarp Dosha check |
| `get_yogas` | All yogas detected in the chart |
| `get_kundali_match` | Guna Milan / 36-point compatibility |
| `get_planet_transits` | Real-time planet positions today |
| `get_muhurta` | Choghadiya auspicious time slots |
| `get_gem_suggestions` | Jyotish gemstone recommendations |
| `get_numerology` | Full numerology profile |
| `interpret_chart_ai` | 700+ word AI chart reading, BYOLLM *(Developer plan+)* |
| `get_dasha_narrative_ai` | AI Dasha period narrative, BYOLLM *(Developer plan+)* |
| `run_ai_chat` | Send a message to a pre-configured AI Chat from your dashboard *(Developer plan+)* |
| `run_ai_narrative` | Generate a narrative from a pre-configured AI Narrative template *(Developer plan+)* |
| `lookup_city_coordinates` | City → lat/lon/timezone lookup |
| `list_endpoints` | Browse all 143 VedIntel™ AstroAPI endpoints |
| `search_endpoints` | Search endpoints by keyword |

## Setup

### 1. Get a free API key

Sign up at [vedintelastroapi.com/auth/signup](https://vedintelastroapi.com/auth/signup) — 500 free calls/month, no credit card.

### 2. Install

**Option A — npx (recommended, no install needed):**

```bash
npx @vedintelastroapi/mcp-server
```

**Option B — clone and build:**

```bash
git clone https://github.com/cryptonaidu/vedintel-mcp.git
cd vedintel-mcp
npm install
npm run build
```

### 3. Configure your MCP client

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "vedintel-astroapi": {
      "command": "npx",
      "args": ["@vedintelastroapi/mcp-server"],
      "env": {
        "VEDINTEL_API_KEY": "vai_your_key_here"
      }
    }
  }
}
```

#### Cursor / VS Code

Add to your MCP settings:

```json
{
  "mcp": {
    "servers": {
      "vedintel-astroapi": {
        "command": "npx",
        "args": ["@vedintelastroapi/mcp-server"],
        "env": {
          "VEDINTEL_API_KEY": "vai_your_key_here"
        }
      }
    }
  }
}
```

### 4. Restart your MCP client

Restart Claude Desktop / Cursor. You should see the VedIntel™ AstroAPI tools available.

## AI Chats and AI Narratives — using a pre-configured template

Unlike every other tool here (which is self-contained — just pass birth data), `run_ai_chat` and `run_ai_narrative` call a Chat or Narrative you've **already configured** on your dashboard:

- Create an AI Chat at [vedintelastroapi.com/dashboard/ai-chats](https://vedintelastroapi.com/dashboard/ai-chats), copy its `chat_id` from the Configure page, then ask Claude/Cursor to `run_ai_chat` with that id and a message.
- Create an AI Narrative template at [vedintelastroapi.com/dashboard/ai-narratives](https://vedintelastroapi.com/dashboard/ai-narratives), copy its `narrative_id`, then ask Claude/Cursor to `run_ai_narrative` with that id and any params to override the template's defaults.

Both tools require a paid plan (Developer and above) and a connected AI provider (BYOLLM — set once at [vedintelastroapi.com/dashboard/ai-providers](https://vedintelastroapi.com/dashboard/ai-providers)).

## Testing

Try these prompts after setup:

```
"Get the birth chart for dob=01/10/1977, tob=11:40, lat=11, lon=77, tz=5.5"
"List all available VedIntel AstroAPI endpoints"
"Search endpoints for nakshatra"
"What coordinates should I use for Mumbai?"
```

## Reference birth data (for testing)

| Field | Value |
|-------|-------|
| dob | 01/10/1977 |
| tob | 11:40 |
| lat | 11.0 (Coimbatore) |
| lon | 77.0 (Coimbatore) |
| tz | 5.5 (IST) |

Expected: Sagittarius Ascendant · Sun in Virgo · Moon in Aries · 0.0000° deviation from Jagannatha Hora

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VEDINTEL_API_KEY` | Your VedIntel™ AstroAPI key | *(required)* |
| `VEDINTEL_BASE_URL` | Override API base URL | `https://vedintelastroapi.com/api/v1` |

## How it differs from VedicAstroAPI's MCP server

| | VedIntel™ AstroAPI MCP | VedicAstroAPI MCP |
|--|------------------------|-------------------|
| Live API calls | ✓ Returns real computed data | ✗ Documentation only |
| Birth chart | ✓ Real Swiss Ephemeris results | ✗ Not available |
| AI readings | ✓ BYOLLM-powered narratives (your own key) | ✗ Not available |
| Tool count | 24 tools | 4 tools |
| Accuracy | 0.0000° verified vs Jagannatha Hora | Not published |

## Links

- [API Documentation](https://vedintelastroapi.com/docs)
- [Get free API key](https://vedintelastroapi.com/auth/signup)
- [Pricing](https://vedintelastroapi.com/pricing)
- [Model Context Protocol](https://modelcontextprotocol.io)
