import { Press_Start_2P, VT323 } from 'next/font/google';
import './globals.css';

const displayFont = Press_Start_2P({ weight: '400', subsets: ['latin'], variable: '--font-display' });
const bodyFont = VT323({ weight: '400', subsets: ['latin'], variable: '--font-body' });

export const metadata = {
	title: 'Dialga — Pokemon Go Events',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
			<body>{children}</body>
		</html>
	);
}
