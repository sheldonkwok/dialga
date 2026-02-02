export const revalidate = 1800;

import { headers } from 'next/headers';
import { scrapeEvents, EVENT_TIMEZONE, NEWS_URL } from '../scraper/scraper.ts';
import { CopyButton } from './copy-button.tsx';


const dateFormat = new Intl.DateTimeFormat('en-US', {
	timeZone: EVENT_TIMEZONE,
	dateStyle: 'medium',
	timeStyle: 'short',
});

export default async function HomePage() {
	const [{ events }, hdrs] = await Promise.all([scrapeEvents(), headers()]);
	const host = hdrs.get('host') ?? 'localhost:3000';
	const protocol = hdrs.get('x-forwarded-proto') ?? 'http';
	const calendarUrl = `${protocol}://${host}/calendar.ics`;

	return (
		<main>
			<h1>Pokemon Go Events</h1>
      <p>News from <a href={NEWS_URL} target="_blank" rel="noopener noreferrer">{NEWS_URL}</a></p>
			<p><CopyButton text={calendarUrl} /></p>
			<table>
				<thead>
					<tr>
						<th>Title</th>
						<th>Start</th>
						<th>End</th>
					</tr>
				</thead>
				<tbody>
					{events.map((event) => (
						<tr key={event.url}>
							<td>
								<a href={event.url} target="_blank" rel="noopener noreferrer">
									{event.title}
								</a>
							</td>
							<td>{event.startDate ? dateFormat.format(event.startDate) : '—'}</td>
							<td>{event.endDate ? dateFormat.format(event.endDate) : '—'}</td>
						</tr>
					))}
				</tbody>
			</table>
		</main>
	);
}
