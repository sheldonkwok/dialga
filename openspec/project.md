# Project Context

## Purpose
Create a website that has past 3 months of Pokemon Go events that I care about. 
The data is scraped from this website here https://pokemongo.com/news

I care about only these events
- Dynamax Max Battle Weekends 
- Shadow Raid Day


## Tech Stack
- typescript
- nextjs
- ics calendar

## Project Conventions

### Code Style
[Describe your code style preferences, formatting rules, and naming conventions]

### Architecture Patterns
[Document your architectural decisions and patterns]

### Testing Strategy
[Explain your testing approach and requirements]

### Git Workflow
- conventional commit
- conventional branch

## Domain Context
Scrape the main news page and identify the different news entries.
For the specific events we care about, we need to follow the url to get the date and time that the event occurs.

## Important Constraints
Always use pnpm instead of npm

## External Dependencies
[Document key external services, APIs, or systems]
