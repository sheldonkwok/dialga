export const revalidate = 1800;

import { headers } from 'next/headers';
import { scrapeEvents, NEWS_URL } from '../scraper/scraper.ts';
import { CopyButton } from './copy-button.tsx';
import { EventCalendar } from './event-calendar.tsx';
import { EventList } from './event-list.tsx';
import { CATEGORY_LABELS, type CalendarEvent, type EventCategory } from './event-types.ts';
import { toCalendarEvents, toDayKey } from './events.ts';
import { Panel, PanelTitle } from './panel.tsx';
import { PokeBall } from './pixel-sprite.tsx';
import styles from './page.module.css';

const LEGEND: EventCategory[] = ['community', 'max', 'raid', 'rocket'];

function EventLog({ title, events }: { title: string; events: CalendarEvent[] }) {
	if (events.length === 0) return null;

	return (
		<Panel>
			<PanelTitle>{title}</PanelTitle>
			<EventList events={events} />
		</Panel>
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
		<main className={styles.page}>
			<header className={styles.masthead}>
				<PokeBall />
				<div>
					<h1 className={styles.title}>Pokémon GO Events</h1>
					<p className={styles.tagline}>Community Days, Max Battles, Raid Days and Team GO Rocket takeovers.</p>
				</div>
			</header>

			<Panel className={styles.subscribe}>
				<div className={styles.subscribeText}>
					<PanelTitle>Add to your calendar</PanelTitle>
					<p>Subscribe with this link and new events show up automatically.</p>
					<code className={styles.subscribeUrl}>{calendarUrl}</code>
				</div>
				<CopyButton text={calendarUrl} />
			</Panel>

			<ul className={styles.legend} aria-label="Event types">
				{LEGEND.map(category => (
					<li key={category}>
						<span className={styles.swatch} data-category={category} />
						{CATEGORY_LABELS[category]}
					</li>
				))}
			</ul>

			<EventCalendar events={calendarEvents} today={today} />

			<EventLog title="Upcoming" events={upcoming} />
			<EventLog title="Past" events={past} />

			<footer className={styles.footer}>
				Scraped from{' '}
				<a href={NEWS_URL} target="_blank" rel="noopener noreferrer">
					pokemongo.com/news
				</a>
				. Times are local to wherever you play.
			</footer>
		</main>
	);
}
