import * as cheerio from 'cheerio';
import pMap from 'p-map';
import { getCache } from '@vercel/functions';

const BASE_URL = 'https://pokemongo.com';
export const NEWS_URL = `${BASE_URL}/news`;

export type NewsEntry = {
	title: string;
	url: string;
	postedDate: string | null;
};

export type EventData = {
	title: string;
	url: string;
	startDate: Date | null;
	endDate: Date | null;
};

export const EVENT_TIMEZONE = 'America/Los_Angeles';

export type ScraperOutput = {
	events: EventData[];
};

const EVENT_PATTERNS = [
	/(giganta|dyna)max .* max battle/i,
	/raid day/i,
  /community day\:/i,
];

function matchesEventPattern(entry: NewsEntry): boolean {
	return EVENT_PATTERNS.some(pattern => pattern.test(entry.title)) || /raid-day/i.test(entry.url);
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
		.filter(entry => matchesEventPattern(entry))
		.filter(entry => isRecentPost(entry));
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DATE_REGEX = new RegExp(`(${MONTHS.join('|')})\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?`, 'gi');
const TIME_REGEX = /(\d{1,2}:\d{2})\s*(a\.?m\.?|p\.?m\.?)/gi;

type DateComponents = { year: number; month: number; day: number };
type TimeComponents = { hours: number; minutes: number };

function extractDates(text: string, fallbackYear: number): DateComponents[] {
	return [...text.matchAll(DATE_REGEX)].map(([, month, day, year]) => ({
		year: year ? parseInt(year, 10) : fallbackYear,
		month: MONTHS.findIndex(m => m.toLowerCase() === month!.toLowerCase()) + 1,
		day: parseInt(day!, 10),
	}));
}

function extractTimes(text: string): TimeComponents[] {
	return [...text.matchAll(TIME_REGEX)].map(([, time, period]) => {
		const [h, m] = time!.split(':').map(Number);
		const p = period!.replace(/\./g, '').toLowerCase();
		let hours = h!;
		if (p === 'pm' && hours !== 12) hours += 12;
		if (p === 'am' && hours === 12) hours = 0;
		return { hours, minutes: m! };
	});
}

const pacificFormatter = new Intl.DateTimeFormat('en-US', {
	timeZone: EVENT_TIMEZONE,
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	hour12: false,
});

function createPacificDate(date: DateComponents, time: TimeComponents | undefined): Date {
	const { year, month, day } = date;
	const hours = time?.hours ?? 0;
	const minutes = time?.minutes ?? 0;

	// Initial guess assuming PST (UTC-8)
	let utcMs = Date.UTC(year, month - 1, day, hours + 8, minutes);

	// Iteratively correct using Intl (handles PST vs PDT)
	for (let i = 0; i < 2; i++) {
		const parts = pacificFormatter.formatToParts(new Date(utcMs));
		const get = (type: string) => {
			let v = parseInt(parts.find(p => p.type === type)!.value, 10);
			if (type === 'hour' && v === 24) v = 0;
			return v;
		};

		let hourDiff = hours - get('hour');
		const dayDiff = day - get('day');
		if (dayDiff !== 0) hourDiff += dayDiff * 24;

		if (hourDiff === 0) break;
		utcMs += hourDiff * 3_600_000;
	}

	return new Date(utcMs);
}

function parseDateTime(text: string): { startDate: Date | null; endDate: Date | null } {
	const fallbackYear = parseInt(text.match(/\b(202\d)\b/)?.[1] ?? String(new Date().getFullYear()), 10);
	const dates = extractDates(text, fallbackYear);
	const times = extractTimes(text);

	const startDateComponents = dates[0];
	const endDateComponents = dates[1] ?? dates[0];

	return {
		startDate: startDateComponents ? createPacificDate(startDateComponents, times[0]) : null,
		endDate: endDateComponents ? createPacificDate(endDateComponents, times[1]) : null,
	};
}

export async function fetchEventDetails(entry: NewsEntry): Promise<EventData> {
	const cache = getCache();
	const cacheKey = `event-details:${entry.url}`;

	const cached = await cache.get(cacheKey);
	if (cached) {
		const data = cached as Record<string, unknown>;
		return {
			...data,
			startDate: data['startDate'] ? new Date(data['startDate'] as string) : null,
			endDate: data['endDate'] ? new Date(data['endDate'] as string) : null,
		} as EventData;
	}

	const response = await fetch(entry.url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${entry.url}: ${response.status}`);
	}

	const html = await response.text();
	const $ = cheerio.load(html);

	const h2Title = $('h2').first().text().trim();
	const textContent = $('main p').first().text();

	const dateTime = parseDateTime(textContent);

	const result: EventData = {
		...entry,
		...(h2Title && { title: h2Title }),
		...dateTime,
	};

	await cache.set(cacheKey, result, {
		ttl: 3600,
		tags: ['event-details'],
	});

	return result;
}

export async function scrapeEvents(): Promise<ScraperOutput> {
	const allEntries = await fetchNewsPage();
	const matchingEntries = filterEvents(allEntries);

	const events = await pMap(matchingEntries, fetchEventDetails, { concurrency: 20 });

	return { events };
}
