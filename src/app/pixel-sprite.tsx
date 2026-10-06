import styles from './pixel-sprite.module.css';

const POKE_BALL = [
	'....KKKKKK....',
	'..KKRRRRRRKK..',
	'.KRRWWRRRRRRK.',
	'.KRWWRRRRRRRK.',
	'KRRWRRRRRRRRRK',
	'KRRRRKKKKRRRRK',
	'KKKKKKWWKKKKKK',
	'KKKKKKWWKKKKKK',
	'KWWWWKKKKWWWWK',
	'KWWWWWWWWWWWWK',
	'.KWWWWWWWWWWK.',
	'.KWWWWWWWWWGK.',
	'..KKWWWWWWKK..',
	'....KKKKKK....',
];

const PALETTE: Record<string, string> = {
	K: '#10162b',
	R: '#e0344a',
	W: '#f6f1dc',
	G: '#b9b39b',
};

export function PokeBall({ size = 56 }: { size?: number }) {
	const width = POKE_BALL[0]!.length;

	return (
		<svg
			className={styles.sprite}
			width={size}
			height={size}
			viewBox={`0 0 ${width} ${POKE_BALL.length}`}
			shapeRendering="crispEdges"
			aria-hidden="true"
		>
			{POKE_BALL.flatMap((row, y) =>
				[...row].map((pixel, x) =>
					pixel === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PALETTE[pixel]} />,
				),
			)}
		</svg>
	);
}
