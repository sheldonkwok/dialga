'use client';

import { useState } from 'react';

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
		<button type="button" className="btn btn-primary" onClick={handleClick}>
			{copied ? 'Copied!' : 'Copy link'}
		</button>
	);
}
