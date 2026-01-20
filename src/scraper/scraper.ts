import * as cheerio from 'cheerio';
import pMap from 'p-map';

const BASE_URL = 'https://pokemongo.com';
const NEWS_URL = `${BASE_URL}/news`;

export type NewsEntry = {
	title: string;
	url: string;
	postedDate: string | null;
};

export type EventData = {
	title: string;
	url: string;
	startDate: string | null;
	startTime: string | null;
	endDate: string | null;
	endTime: string | null;
};

export type ScraperOutput = {
	events: EventData[];
};

const EVENT_PATTERNS = [
	/(giganta|dyna)max .* max battle/i,
	/raid day/i,
];

function matchesEventPattern(title: string): boolean {
	return EVENT_PATTERNS.some(pattern => pattern.test(title));
}

export async function fetchNewsPage(): Promise<NewsEntry[]> {
	const response = await fetch(NEWS_URL);
	if (!response.ok) {
		throw new Error(`Failed to fetch news page: ${response.status}`);
	}

	const html = await response.text();
	const $ = cheerio.load(html);
	const entries: NewsEntry[] = [];

	$('a[href^="/news/"], a[href^="/en/post/"]').each((_, element) => {
		const $el = $(element);
		const href = $el.attr('href');
		const title = $el.text().trim();

		// Find the date from pg-date-format element's timestamp attribute (unix ms)
		const $parent = $el.closest('[class*="card"], [class*="article"], article, li, div').first();
		const timestamp = $parent.find('pg-date-format').attr('timestamp');
		let postedDate: string | null = null;
		if (timestamp) {
			const date = new Date(parseInt(timestamp, 10));
			postedDate = date.toISOString().split('T')[0]!;
		}

		if (href && title) {
			const url = href.startsWith('http') ? href : `${BASE_URL}${href}`;
			entries.push({ title, url, postedDate });
		}
	});

	return entries;
}

function isRecentPost(entry: NewsEntry): boolean {
	if (!entry.postedDate) {
		// If no date found, include it to be safe
		return true;
	}

	const postedDate = new Date(entry.postedDate);
	const threeMonthsAgo = new Date();
	threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

	return postedDate >= threeMonthsAgo;
}

export function filterEvents(entries: NewsEntry[]): NewsEntry[] {
	return entries
		.filter(entry => matchesEventPattern(entry.title))
		.filter(entry => isRecentPost(entry));
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DATE_REGEX = new RegExp(`(${MONTHS.join('|')})\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?`, 'gi');
const TIME_REGEX = /(\d{1,2}:\d{2})\s*(a\.?m\.?|p\.?m\.?)/gi;

function extractDates(text: string, fallbackYear: string): string[] {
	return [...text.matchAll(DATE_REGEX)].map(([, month, day, year]) => {
		const monthIndex = MONTHS.findIndex(m => m.toLowerCase() === month!.toLowerCase()) + 1;
		return `${year ?? fallbackYear}-${String(monthIndex).padStart(2, '0')}-${day!.padStart(2, '0')}`;
	});
}

function extractTimes(text: string): string[] {
	return [...text.matchAll(TIME_REGEX)].map(([, time, period]) =>
		`${time} ${period!.replace(/\./g, '').toLowerCase()}`
	);
}

function parseDateTime(text: string): { startDate: string | null; startTime: string | null; endDate: string | null; endTime: string | null } {
	const fallbackYear = text.match(/\b(202\d)\b/)?.[1] ?? String(new Date().getFullYear());
	const dates = extractDates(text, fallbackYear);
	const times = extractTimes(text);

	return {
		startDate: dates[0] ?? null,
		startTime: times[0] ?? null,
		endDate: dates[1] ?? dates[0] ?? null,
		endTime: times[1] ?? null,
	};
}

export async function fetchEventDetails(entry: NewsEntry): Promise<EventData> {
	const response = await fetch(entry.url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${entry.url}: ${response.status}`);
	}

	const html = await response.text();
	const $ = cheerio.load(html);

	const textContent = $('h1, h2, h3, p').text();
	const dateTime = parseDateTime(textContent);

	return {
		...entry,
		...dateTime,
	};
}

export async function scrapeEvents(): Promise<ScraperOutput> {
	const allEntries = await fetchNewsPage();
	const matchingEntries = filterEvents(allEntries);

	const events = await pMap(matchingEntries, fetchEventDetails, { concurrency: 10 });

	return { events };
}
