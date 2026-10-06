import { EVENT_TIMEZONE, type EventData } from '../scraper/scraper.ts';
import type { CalendarEvent, EventCategory } from './event-types.ts';

const CATEGORY_PATTERNS: Array<[EventCategory, RegExp]> = [
	['community', /community\s*-?day/i],
	['max', /max[\s-]*battle|dynamax|gigantamax/i],
	['raid', /raid[\s-]*day/i],
	['rocket', /rocket|taken[\s-]*over|save shadow|tgr/i],
];

function categorize(event: EventData): EventCategory {
	const haystack = `${event.title} ${event.url}`;
	return CATEGORY_PATTERNS.find(([, pattern]) => pattern.test(haystack))?.[0] ?? 'other';
}

const dayKeyFormat = new Intl.DateTimeFormat('en-CA', {
	timeZone: EVENT_TIMEZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

const dayFormat = new Intl.DateTimeFormat('en-US', {
	timeZone: EVENT_TIMEZONE,
	weekday: 'short',
	month: 'short',
	day: 'numeric',
});

const timeFormat = new Intl.DateTimeFormat('en-US', {
	timeZone: EVENT_TIMEZONE,
	hour: 'numeric',
	minute: '2-digit',
});

export function toDayKey(date: Date): string {
	return dayKeyFormat.format(date);
}

function formatWhen(start: Date | null, end: Date | null): string {
	if (!start) return 'Date TBD';

	const startText = `${dayFormat.format(start)} · ${timeFormat.format(start)}`;
	if (!end || end.getTime() === start.getTime()) return startText;

	if (toDayKey(start) === toDayKey(end)) return `${startText} – ${timeFormat.format(end)}`;
	return `${startText} – ${dayFormat.format(end)} · ${timeFormat.format(end)}`;
}

export function toCalendarEvents(events: EventData[]): CalendarEvent[] {
	return events
		.map(event => ({
			title: event.title,
			url: event.url,
			category: categorize(event),
			startDay: event.startDate ? toDayKey(event.startDate) : null,
			endDay: event.startDate ? toDayKey(event.endDate ?? event.startDate) : null,
			when: formatWhen(event.startDate, event.endDate),
		}))
		.sort((a, b) => (a.startDay ?? '9999').localeCompare(b.startDay ?? '9999'));
}
