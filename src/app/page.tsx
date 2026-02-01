import { scrapeEvents, EVENT_TIMEZONE } from '../scraper/scraper.ts';

const dateFormat = new Intl.DateTimeFormat('en-US', {
	timeZone: EVENT_TIMEZONE,
	dateStyle: 'medium',
	timeStyle: 'short',
});

export default async function HomePage() {
	const { events } = await scrapeEvents();

	return (
		<main>
			<h1>Pokemon Go Events</h1>
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
