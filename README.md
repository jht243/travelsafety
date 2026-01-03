# Is It Safe To Travel?

Get real-time travel safety information from official government sources. Search any city or country to see current travel advisories.

## Features

- 🔍 **Search by city or country** - Type "Medellin" or "Colombia" to get safety info
- 🛡️ **US State Department advisories** - Official travel advisory levels (1-4)
- 📊 **Visual safety dashboard** - Clear ratings and safety scores
- 🌍 **100+ countries supported** - Comprehensive coverage
- 📱 **Mobile-friendly** - Works on all devices

## Advisory Levels

| Level | Rating | Meaning |
|-------|--------|---------|
| 1 | 🟢 | Exercise Normal Precautions |
| 2 | 🟡 | Exercise Increased Caution |
| 3 | 🟠 | Reconsider Travel |
| 4 | 🔴 | Do Not Travel |

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Install web dependencies
cd web && pnpm install
```

### Development

```bash
cd web
pnpm run dev
```

Open http://localhost:8080 in your browser.

### Build for Production

```bash
cd web
pnpm run build
```

## Data Sources

- **US Department of State** - [travel.state.gov](https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html)

*More data sources coming soon: CDC health advisories, local crime statistics, etc.*

## Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **esbuild** - Fast bundling
- **Lucide Icons** - Beautiful icons

## Roadmap

- [ ] CDC health advisories integration
- [ ] Local crime statistics
- [ ] Weather and natural disaster alerts
- [ ] User reviews and reports
- [ ] Trip planning features

## License

MIT
