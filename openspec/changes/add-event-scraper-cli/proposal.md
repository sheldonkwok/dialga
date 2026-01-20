# Change: Add Event Scraper CLI

## Why
Need to extract Pokemon Go event data (Dynamax Max Battle Weekends, Shadow Raid Day) from pokemongo.com/news to populate the events website. A CLI tool allows running the scraper on-demand and outputs JSON for downstream processing.

## What Changes
- Add a CLI script that scrapes the Pokemon Go news page
- Filter for target events (Dynamax Max Battle Weekends, Shadow Raid Day)
- Follow event links to extract event date/time details
- Output structured JSON to console

## Impact
- Affected specs: `event-scraper` (new capability)
- Affected code: New `src/scraper/` directory with CLI entry point
- Dependencies: cheerio, node-fetch (or native fetch)
