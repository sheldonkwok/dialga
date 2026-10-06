export const revalidate = 1800;

import { headers } from 'next/headers';
import { scrapeEvents, NEWS_URL } from '../scraper/scraper.ts';
import { CopyButton } from './copy-button.tsx';
import { EventCalendar } from './event-calendar.tsx';
import { CATEGORY_LABELS, type CalendarEvent, type EventCategory } from './event-types.ts';
import { toCalendarEvents, toDayKey } from './events.ts';
import { PokeBall } from './pixel-sprite.tsx';

const LEGEND: EventCategory[] = ['community', 'max', 'raid', 'rocket'];

function EventLog({ title, events }: { title: string; events: CalendarEvent[] }) {
	if (events.length === 0) return null;

	return (
		<section className="panel">
			<h2 className="panel-title">{title}</h2>
			<ul className="event-list">
				{events.map(event => (
					<li key={event.url} className="event-row">
						<span className="badge" data-category={event.category}>
							{CATEGORY_LABELS[event.category]}
						</span>
						<a href={event.url} target="_blank" rel="noopener noreferrer">
							{event.title}
						</a>
						<span className="event-when">{event.when}</span>
					</li>
				))}
			</ul>
		</section>
	);
}

export default async function HomePage() {
	const [{ events }, hdrs] = await Promise.all([scrapeEvents(), headers()]);
	const host = hdrs.get('host') ?? 'localhost:3000';
	const protocol = hdrs.get('x-forwarded-proto') ?? 'http';
	const calendarUrl = `${protocol}://${host}/calendar.ics`;

	const today = toDayKey(new Date());
	const calendarEvents = toCalendarEvents(events);
	const upcoming = calendarEvents.filter(event => !event.endDay || event.endDay >= today);
	const past = calendarEvents.filter(event => event.endDay && event.endDay < today).reverse();

	return (
		<main className="page">
			<header className="masthead">
				<PokeBall />
				<div>
					<h1>Pokémon GO Events</h1>
					<p className="tagline">Community Days, Max Battles, Raid Days and Team GO Rocket takeovers.</p>
				</div>
			</header>

			<section className="panel subscribe">
				<div className="subscribe-text">
					<h2 className="panel-title">Add to your calendar</h2>
					<p>Subscribe with this link and new events show up automatically.</p>
					<code className="subscribe-url">{calendarUrl}</code>
				</div>
				<CopyButton text={calendarUrl} />
			</section>

			<ul className="legend" aria-label="Event types">
				{LEGEND.map(category => (
					<li key={category}>
						<span className="swatch" data-category={category} />
						{CATEGORY_LABELS[category]}
					</li>
				))}
			</ul>

			<EventCalendar events={calendarEvents} today={today} />

			<EventLog title="Upcoming" events={upcoming} />
			<EventLog title="Past" events={past} />

			<footer className="footer">
				Scraped from{' '}
				<a href={NEWS_URL} target="_blank" rel="noopener noreferrer">
					pokemongo.com/news
				</a>
				. Times are local to wherever you play.
			</footer>
		</main>
	);
}
