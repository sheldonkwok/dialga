import type { ComponentProps } from 'react';
import styles from './panel.module.css';

export function Panel({ className, ...props }: ComponentProps<'section'>) {
	return <section className={[styles.panel, className].filter(Boolean).join(' ')} {...props} />;
}

export function PanelTitle(props: ComponentProps<'h2'>) {
	return <h2 className={styles.title} {...props} />;
}
