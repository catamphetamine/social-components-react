import React from 'react'
import PropTypes from 'prop-types'

import { postLinkBlock } from './PropTypes.js'

import Picture from './Picture.js'

import './PostLinkBlock.css'

export default function PostLinkBlock({ link }) {
	return (
		<a
			target="_blank"
			href={link.url}
			className="PostLinkBlock">
			<section>
				{link.picture &&
					<Picture picture={link.picture}/>
				}
				<h1>
					{link.title}
				</h1>
				<p>
					{link.description}
				</p>
			</section>
		</a>
	)
}

PostLinkBlock.propTypes = {
	link: postLinkBlock.isRequired
}

export const EXAMPLE_1 = {
	title: 'Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb',
	description: 'More commonly known simply as Dr. Strangelove, is a 1964 political satire black comedy film that satirizes the Cold War fears of a nuclear conflict between the Soviet Union and the United States. The film was directed, produced, and co-written by Stanley Kubrick, stars Peter Sellers, George C. Scott and Slim Pickens. Production took place in the United Kingdom. The film is loosely based on Peter George\'s thriller novel Red Alert (1958)',
	url: 'https://en.wikipedia.org/wiki/Dr._Strangelove'
}

export const EXAMPLE_2 = {
	title: 'Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb',
	description: 'More commonly known simply as Dr. Strangelove, is a 1964 political satire black comedy film that satirizes the Cold War fears of a nuclear conflict between the Soviet Union and the United States. The film was directed, produced, and co-written by Stanley Kubrick, stars Peter Sellers, George C. Scott and Slim Pickens. Production took place in the United Kingdom. The film is loosely based on Peter George\'s thriller novel Red Alert (1958)',
	url: 'https://en.wikipedia.org/wiki/Dr._Strangelove',
	picture: {
		type: 'image/jpeg',
		width: 640,
		height: 434,
		url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Leonid_Brezhnev_and_Richard_Nixon_talks_in_1973.png/640px-Leonid_Brezhnev_and_Richard_Nixon_talks_in_1973.png'
	}
}