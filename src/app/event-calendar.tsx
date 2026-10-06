'use client';

import { useMemo, useState } from 'react';
import { CATEGORY_LABELS, type CalendarEvent } from './event-types.ts';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const monthFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' });
const dayFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' });

// Day keys are plain YYYY-MM-DD strings, so all calendar math runs in UTC to stay timezone independent
function toKey(year: number, month: number, day: number): string {
	return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseKey(key: string): Date {
	return new Date(`${key}T00:00:00Z`);
}

export function EventCalendar({ events, today }: { events: CalendarEvent[]; today: string }) {
	const todayDate = parseKey(today);
	const [view, setView] = useState({ year: todayDate.getUTCFullYear(), month: todayDate.getUTCMonth() });
	const [selected, setSelected] = useState(today);

	const cells = useMemo(() => {
		const leading = new Date(Date.UTC(view.year, view.month, 1)).getUTCDay();
		const dayCount = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
		const total = Math.ceil((leading + dayCount) / 7) * 7;

		return Array.from({ length: total }, (_, index) => {
			const day = index - leading + 1;
			if (day < 1 || day > dayCount) return null;

			const key = toKey(view.year, view.month, day);
			return {
				day,
				key,
				events: events.filter(event => event.startDay && event.endDay && event.startDay <= key && key <= event.endDay),
			};
		});
	}, [events, view]);

	const selectedEvents = events.filter(
		event => event.startDay && event.endDay && event.startDay <= selected && selected <= event.endDay,
	);

	function shiftMonth(delta: number) {
		const next = new Date(Date.UTC(view.year, view.month + delta, 1));
		setView({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
	}

	function goToToday() {
		setView({ year: todayDate.getUTCFullYear(), month: todayDate.getUTCMonth() });
		setSelected(today);
	}

	return (
		<section className="panel calendar" aria-label="Event calendar">
			<header className="calendar-bar">
				<button type="button" className="btn btn-square" onClick={() => shiftMonth(-1)} aria-label="Previous month">
					◀
				</button>
				<h2 className="calendar-title" aria-live="polite">
					{monthFormat.format(new Date(Date.UTC(view.year, view.month, 1)))}
				</h2>
				<button type="button" className="btn btn-square" onClick={() => shiftMonth(1)} aria-label="Next month">
					▶
				</button>
				<button type="button" className="btn calendar-today" onClick={goToToday}>
					Today
				</button>
			</header>

			<div className="calendar-grid">
				{WEEKDAYS.map(weekday => (
					<div key={weekday} className="calendar-weekday">
						{weekday}
					</div>
				))}
				{cells.map((cell, index) =>
					cell ? (
						<button
							key={cell.key}
							type="button"
							className="day"
							data-today={cell.key === today || undefined}
							data-past={cell.key < today || undefined}
							aria-pressed={cell.key === selected}
							aria-label={`${dayFormat.format(parseKey(cell.key))}, ${cell.events.length} ${cell.events.length === 1 ? 'event' : 'events'}`}
							onClick={() => setSelected(cell.key)}
						>
							<span className="day-number">{cell.day}</span>
							<span className="day-events">
								{cell.events.map(event => (
									<span key={event.url} className="chip" data-category={event.category}>
										{event.title}
									</span>
								))}
							</span>
						</button>
					) : (
						<div key={`blank-${index}`} className="day day-blank" />
					),
				)}
			</div>

			<div className="day-detail" aria-live="polite">
				<h3 className="day-detail-title">
					<span className="cursor" aria-hidden="true">▶</span>
					{dayFormat.format(parseKey(selected))}
				</h3>
				{selectedEvents.length === 0 ? (
					<p className="muted">No events on this day.</p>
				) : (
					<ul className="event-list">
						{selectedEvents.map(event => (
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
				)}
			</div>
		</section>
	);
}
