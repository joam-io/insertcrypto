import React, { useState, useEffect } from 'react';
import blacklist from 'blacklist';

/*
 * Fuck yeah, blink tag!
 */

export default function Blink(props) {
	const [visible, setVisible] = useState(true);
	const duration = 530;
	const p = blacklist(props, 'children');

	useEffect(() => {
		setTimeout(() => {
			setVisible(!visible);
		}, duration);
	}, [visible]);

	p.style = { visibility: visible ? 'visible' : 'hidden' };

	return <span {...p}> {props.children}</span>;
}
