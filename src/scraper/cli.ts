import { scrapeEvents } from './scraper.ts';

async function main() {
	try {
		const result = await scrapeEvents();
		console.log(JSON.stringify(result, null, 2));
	} catch (error) {
		console.error('Scraper failed:', error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

main();
