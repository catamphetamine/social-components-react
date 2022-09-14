import React from 'react'

import { postQuote } from './PropTypes.js'

import PostInlineContent from './PostInlineContent.js'

import './PostQuote.css'

export default function PostQuote({ children: quote }) {
	return (
		<div className="PostQuote">
			<blockquote
				cite={quote.url || quote.source}
				className="PostQuote-text">
				<PostInlineContent>
					{quote.content}
				</PostInlineContent>
			</blockquote>
			{quote.source &&
				<div className="PostQuote-source">
					{!quote.url && quote.source}
					{quote.url &&
						<a href={quote.url} target="_blank">
							{quote.source}
						</a>
					}
				</div>
			}
		</div>
	)
}

PostQuote.propTypes = {
	children: postQuote.isRequired
}