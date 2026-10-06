import type { ComponentProps } from 'react';
import styles from './button.module.css';

type ButtonProps = ComponentProps<'button'> & { variant?: 'primary' | 'square' };

export function Button({ variant, className, ...props }: ButtonProps) {
	return (
		<button
			type="button"
			className={[styles.btn, variant && styles[variant], className].filter(Boolean).join(' ')}
			{...props}
		/>
	);
}
