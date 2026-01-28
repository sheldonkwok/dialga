import { test, expect } from 'vitest';
import { generateIcs } from './ics.ts';
import type { EventData } from '../scraper/scraper.ts';

// Feb 8 2025 10:00 AM PST = Feb 8 18:00 UTC (PST is UTC-8)
const FEB_8_10AM_PST = new Date(Date.UTC(2025, 1, 8, 18, 0));
// Feb 9 2025 8:00 PM PST = Feb 10 04:00 UTC
const FEB_9_8PM_PST = new Date(Date.UTC(2025, 1, 10, 4, 0));
// Jul 12 2025 2:00 PM PDT = Jul 12 21:00 UTC (PDT is UTC-7)
const JUL_12_2PM_PDT = new Date(Date.UTC(2025, 6, 12, 21, 0));
// Jul 13 2025 6:00 PM PDT = Jul 14 01:00 UTC
const JUL_13_6PM_PDT = new Date(Date.UTC(2025, 6, 14, 1, 0));

function makeEvent(overrides: Partial<EventData> = {}): EventData {
	return {
		title: 'Dynamax Max Battle Weekend',
		url: 'https://pokemongo.com/en/post/dynamax-battle',
		startDate: FEB_8_10AM_PST,
		endDate: FEB_9_8PM_PST,
		...overrides,
	};
}

test('generates valid ICS calendar wrapper', () => {
	const ics = generateIcs([]);

	expect(ics).toContain('BEGIN:VCALENDAR');
	expect(ics).toContain('VERSION:2.0');
	expect(ics).toContain('PRODID:-//Dialga//Pokemon GO Events//EN');
	expect(ics).toContain('CALSCALE:GREGORIAN');
	expect(ics).toContain('END:VCALENDAR');
});

test('uses CRLF line endings', () => {
	const ics = generateIcs([]);

	// Every line should end with \r\n, not bare \n
	const lines = ics.split('\r\n');
	expect(lines.length).toBeGreaterThan(1);
	expect(ics).not.toMatch(/[^\r]\n/);
});

test('generates VEVENT with correct PST date formatting', () => {
	const ics = generateIcs([makeEvent()]);

	expect(ics).toContain('BEGIN:VEVENT');
	expect(ics).toContain('DTSTART;TZID=America/Los_Angeles:20250208T100000');
	expect(ics).toContain('DTEND;TZID=America/Los_Angeles:20250209T200000');
	expect(ics).toContain('SUMMARY:Dynamax Max Battle Weekend');
	expect(ics).toContain('URL:https://pokemongo.com/en/post/dynamax-battle');
	expect(ics).toContain('END:VEVENT');
});

test('generates VEVENT with correct PDT date formatting', () => {
	const event = makeEvent({
		title: 'Shadow Raid Day',
		startDate: JUL_12_2PM_PDT,
		endDate: JUL_13_6PM_PDT,
	});
	const ics = generateIcs([event]);

	expect(ics).toContain('DTSTART;TZID=America/Los_Angeles:20250712T140000');
	expect(ics).toContain('DTEND;TZID=America/Los_Angeles:20250713T180000');
});

test('generates stable UID from title and date', () => {
	const ics = generateIcs([makeEvent()]);

	expect(ics).toContain('UID:20250208-dynamax-max-battle-weekend@dialga');
});

test('skips events with null startDate', () => {
	const ics = generateIcs([makeEvent({ startDate: null })]);

	expect(ics).not.toContain('BEGIN:VEVENT');
});

test('uses startDate as endDate fallback when endDate is null', () => {
	const ics = generateIcs([makeEvent({ endDate: null })]);

	expect(ics).toContain('DTSTART;TZID=America/Los_Angeles:20250208T100000');
	expect(ics).toContain('DTEND;TZID=America/Los_Angeles:20250208T100000');
});

test('escapes special characters in summary', () => {
	const ics = generateIcs([makeEvent({ title: 'Event; with, special\\chars\nand newline' })]);

	expect(ics).toContain('SUMMARY:Event\\; with\\, special\\\\chars\\nand newline');
});

test('handles multiple events', () => {
	const events = [
		makeEvent(),
		makeEvent({
			title: 'Shadow Raid Day',
			url: 'https://pokemongo.com/en/post/shadow-raid',
			startDate: JUL_12_2PM_PDT,
			endDate: JUL_13_6PM_PDT,
		}),
	];
	const ics = generateIcs(events);

	const veventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
	expect(veventCount).toBe(2);
});

test('folds lines longer than 75 characters', () => {
	const longTitle = 'A'.repeat(100);
	const ics = generateIcs([makeEvent({ title: longTitle })]);

	// Each physical line (split by CRLF) should be at most 75 chars
	const lines = ics.split('\r\n');
	for (const line of lines) {
		expect(line.length).toBeLessThanOrEqual(75);
	}
});
