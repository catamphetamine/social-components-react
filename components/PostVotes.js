import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Padding from './Padding.js'

import PressedStateButton from './PressedStateButton.js'

import LeftArrowIcon from '../icons/left-arrow-minimal-thin.svg'

import { post } from './PropTypes.js'

import './PostVotes.css'

export default function PostVotes({
	post,
	vote,
	onVote,
	messages
}) {
	const upvotes = typeof post.upvotes === 'number' ? post.upvotes : 0
	const downvotes = typeof post.downvotes === 'number' ? post.downvotes : 0

	const onUpVote = useCallback(() => onVote(true), [onVote])
	const onDownVote = useCallback(() => onVote(false), [onVote])

	return (
		<div className="PostVotes">
			<Padding>
				<PressedStateButton
					title={messages && vote !== undefined ? messages.alreadyVoted : messages.downvote}
					disabled={vote !== undefined || !onVote}
					onClick={onDownVote}
					className={classNames('PostVote', 'PostVote--down', {
						'PostVote--voted': vote !== undefined,
						'PostVote--downvoted': vote === false
					})}>
					<LeftArrowIcon className="PostVote-icon PostVote-icon--down"/>
				</PressedStateButton>
			</Padding>
			<div className={classNames('PostVotes-count', {
				'PostVotes-count--neutral': upvotes === downvotes,
				'PostVotes-count--positive': upvotes > downvotes,
				'PostVotes-count--negative': upvotes < downvotes
			})}>
				{(downvotes > upvotes) && '−'}
				{Math.abs(upvotes - downvotes)}
			</div>
			<PressedStateButton
				title={messages && vote !== undefined ? messages.alreadyVoted : messages.upvote}
				disabled={vote !== undefined || !onVote}
				onClick={onUpVote}
				className={classNames('Padding', 'PostVote', 'PostVote--up', {
					'PostVote--voted': vote !== undefined,
					'PostVote--upvoted': vote === true
				})}>
				<LeftArrowIcon className="PostVote-icon PostVote-icon--up"/>
			</PressedStateButton>
		</div>
	)
}

PostVotes.propTypes = {
	post: post.isRequired,
	vote: PropTypes.bool,
	onVote: PropTypes.func.isRequired,
	messages: PropTypes.object
}