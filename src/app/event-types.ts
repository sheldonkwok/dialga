export type EventCategory = 'community' | 'max' | 'raid' | 'rocket' | 'other';

export const CATEGORY_LABELS: Record<EventCategory, string> = {
	community: 'Community Day',
	max: 'Max Battle',
	raid: 'Raid Day',
	rocket: 'Team GO Rocket',
	other: 'Event',
};

export type CalendarEvent = {
	title: string;
	url: string;
	category: EventCategory;
	// YYYY-MM-DD in the event timezone, null when the date could not be parsed
	startDay: string | null;
	endDay: string | null;
	when: string;
};
