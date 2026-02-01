import { scrapeEvents } from '../../scraper/scraper.ts';
import { generateIcs } from '../../ics/ics.ts';

export async function GET() {
	const { events } = await scrapeEvents();
	const ics = generateIcs(events);

	return new Response(ics, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': 'attachment; filename="calendar.ics"',
		},
	});
}
