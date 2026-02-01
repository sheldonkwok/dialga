import type { EventData } from '../scraper/scraper.ts';
import { EVENT_TIMEZONE } from '../scraper/scraper.ts';

type VEvent = {
	summary: string;
	description: string;
	url: string;
	dtstart: string;
	dtend: string;
	uid: string;
};

function formatIcsDate(date: Date): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: EVENT_TIMEZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	}).formatToParts(date);

	const get = (type: string) => parts.find(p => p.type === type)!.value;
	return `${get('year')}${get('month')}${get('day')}T${get('hour')}${get('minute')}${get('second')}`;
}

function generateUid(event: EventData): string {
	const slug = event.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
	const dateStr = event.startDate ? formatIcsDate(event.startDate).split('T')[0] : 'nodate';
	return `${dateStr}-${slug}@dialga`;
}

function escapeIcsText(text: string): string {
	return text
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\n/g, '\\n');
}

function foldLine(line: string): string {
	const maxLen = 75;
	if (line.length <= maxLen) return line;

	const parts: string[] = [line.slice(0, maxLen)];
	let i = maxLen;
	while (i < line.length) {
		parts.push(' ' + line.slice(i, i + maxLen - 1));
		i += maxLen - 1;
	}
	return parts.join('\r\n');
}

function eventToVEvent(event: EventData): VEvent | null {
	if (!event.startDate) return null;

	return {
		summary: event.title,
		description: event.url,
		url: event.url,
		dtstart: formatIcsDate(event.startDate),
		dtend: formatIcsDate(event.endDate ?? event.startDate),
		uid: generateUid(event),
	};
}

function serializeVEvent(vevent: VEvent): string {
	const lines = [
		'BEGIN:VEVENT',
		`DTSTART;TZID=${EVENT_TIMEZONE}:${vevent.dtstart}`,
		`DTEND;TZID=${EVENT_TIMEZONE}:${vevent.dtend}`,
		`SUMMARY:${escapeIcsText(vevent.summary)}`,
		`DESCRIPTION:${escapeIcsText(vevent.description)}`,
		`URL:${vevent.url}`,
		`UID:${vevent.uid}`,
		'END:VEVENT',
	];
	return lines.map(foldLine).join('\r\n');
}

export function generateIcs(events: EventData[]): string {
	const vevents = events
		.map(eventToVEvent)
		.filter((v): v is VEvent => v !== null);

	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Dialga//Pokemon GO Events//EN',
		'CALSCALE:GREGORIAN',
		'X-WR-CALNAME:Pokemon Go Events',
		...vevents.map(serializeVEvent),
		'END:VCALENDAR',
	];

	return lines.join('\r\n') + '\r\n';
}
