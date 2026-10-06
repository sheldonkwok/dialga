'use client';

import { useState } from 'react';
import { Button } from './button.tsx';

export function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	function handleClick() {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text).then(() => flash());
		} else {
			const textarea = document.createElement('textarea');
			textarea.value = text;
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			flash();
		}
	}

	function flash() {
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<Button variant="primary" onClick={handleClick}>
			{copied ? 'Copied!' : 'Copy link'}
		</Button>
	);
}
