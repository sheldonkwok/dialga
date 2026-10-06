import { CATEGORY_LABELS, type CalendarEvent } from './event-types.ts';
import styles from './event-list.module.css';

export function EventList({ events }: { events: CalendarEvent[] }) {
	return (
		<ul className={styles.list}>
			{events.map(event => (
				<li key={event.url} className={styles.row}>
					<span className={styles.badge} data-category={event.category}>
						{CATEGORY_LABELS[event.category]}
					</span>
					<a href={event.url} target="_blank" rel="noopener noreferrer">
						{event.title}
					</a>
					<span className={styles.when}>{event.when}</span>
				</li>
			))}
		</ul>
	);
}
