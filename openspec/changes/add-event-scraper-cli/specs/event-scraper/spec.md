## ADDED Requirements

### Requirement: News Page Scraping
The scraper SHALL fetch the Pokemon Go news listing page from `https://pokemongo.com/news` and extract all news entry links and titles.

#### Scenario: Successful news page fetch
- **WHEN** the scraper fetches the news listing page
- **THEN** it extracts all news entries with their titles and URLs

#### Scenario: Network error handling
- **WHEN** the news page cannot be fetched
- **THEN** the scraper exits with a non-zero exit code and logs an error message

### Requirement: Event Filtering
The scraper SHALL filter news entries to only include target events: "Dynamax Max Battle Weekends" and "Shadow Raid Day".

#### Scenario: Matching event titles
- **WHEN** a news entry title contains "Dynamax" or "Shadow Raid"
- **THEN** the entry is included in the results

#### Scenario: Non-matching titles ignored
- **WHEN** a news entry title does not match any target event pattern
- **THEN** the entry is excluded from results

### Requirement: Event Detail Extraction
The scraper SHALL follow each matching event URL to extract the event date and time information from the detail page.

#### Scenario: Extract event datetime
- **WHEN** the scraper fetches an event detail page
- **THEN** it extracts the event start date, end date, and time (if available)

#### Scenario: Detail page fetch failure
- **WHEN** an event detail page cannot be fetched
- **THEN** the event is included in output with null date fields and an error flag

### Requirement: JSON Output
The scraper SHALL output event data as JSON to stdout.

#### Scenario: JSON output format
- **WHEN** scraping completes successfully
- **THEN** output is valid JSON with structure: `{ "events": [{ "title": string, "url": string, "startDate": string|null, "startTime": string|null, "endDate": string|null, "endTime": string|null, "error": string|null }] }`

#### Scenario: Empty results
- **WHEN** no matching events are found
- **THEN** output is `{ "events": [] }`
