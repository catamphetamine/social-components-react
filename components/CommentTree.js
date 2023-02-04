import React, { useRef, useMemo, useState, useCallback, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import useLayoutEffectSkipMount from '../hooks/useLayoutEffectSkipMount.js'

import removeLeadingPostLink from 'social-components/utility/post/removeLeadingPostLink.js'

import Button from './Button.js'

import { scrollIntoView } from 'web-browser-window'

import './CommentTree.css'

/**
 * Renders a tree of comments.
 * Each comment can have a `.replies[]` list consisting of other comments.
 * When replies of a comment are expanded/un-expanded, the tree's `state` changes.
 * On more details on how `state` is structured, see the comments on `propTypes` below.
 * Basically, `state` simply stores "are children expanded" state of each branch of the tree.
 * By default, the `state` is stored in an "instance variable", and "is expanded" state
 * of each branch is additionally stored as a `boolean` flag in a `useState()` variable,
 * so that the branch is re-rendered on expand/un-expand.
 * The default `state` storage is implemented an instance variable
 * rather than a `useState()` variable, because if `useState()` was used
 * instead of an instance variable, the whole tree would re-render when
 * some (arbitrarily deep) branch was expanded/un-expanded.
 */
export default function CommentTree({
	flat,
	comment,
	parentComment,
	isFirstLevelTree,
	component: Component,
	getComponentProps,
	initialState,
	onStateChange,
	initialShowReplies,
	onShowReply,
	onDidToggleShowReplies,
	toggleShowRepliesOnTreeBranchesClick,
	dialogueTraceStyle,
	getState,
	setState,
	className,
	...rest
}) {
	// Initially, there was an idea of "managing state outside of this component",
	// but that turned out to have a consequence of re-rendering the whole tree
	// when expanding/un-expanding any arbitrarily-deep reply branch, which is not optimal
	// compared to the "internal" managing of the state, which only re-renders a specific
	// reply branch.

	// `elementRef` is only used to scroll to the parent comment
	// when the user hides its replies tree.
	const elementRef = useRef()

	// `toggleShowRepliesButtonRef` is only used to focus the
	// "toggle show/hide replies tree" button when the user
	// hides reply branches by clicking on the "thread" lines
	// to the left of the comments, rather than the toggle button.
	// (the lines act as a clickable "hide thread" button).
	const toggleShowRepliesButtonRef = useRef()

	// Suppose a subtree has 3 child subtrees.
	// That would be an equivalent of a comment having 3 replies.
	//
	// When the subtree is not expanded (replies aren't shown), the subtree state is:
	// `{ replies: undefined }`.
	//
	// When the subtree gets expanded (replies are shown), the subtree state becomes:
	// `{ replies: [undefined, undefined, undefined] }`
	//
	// When the second reply gets expanded, the subtree state becomes:
	// `{ replies: [undefined, { replies: undefined }, undefined] }`
	//
	// Therefore, `state` is recursive.

	// Create `initialState` in case of `initialShowReplies: true`.
	if (!initialState) {
		if (initialShowReplies) {
			if (comment.replies) {
				initialState = getShowRepliesState(comment)
			}
		}
	}

	// Set default `initialState`.
	if (!initialState) {
		initialState = {}
	}

	// The tree state is stored in an "instance variable".
	const rootState = useRef(initialState)

	const getRootState = useCallback(() => rootState.current, [])

	const setRootState = useCallback((newState) => {
		// If it's the root of the tree, then save the tree state in an internal variable.
		// There's no need to re-render the tree because it has already been re-rendered.
		rootState.current = newState
		if (onStateChange) {
			onStateChange(newState)
		}
	}, [
		onStateChange
	])

	if (!parentComment) {
		if (getState || setState) {
			throw new Error('`<CommentTree/>` doesn\'t accept `getState()` or `setState()` properties')
		}
		getState = getRootState
		setState = setRootState
	}

	// Gets the state of a child branch of the current branch of the tree.
	const getChildSubtreeState = useCallback((i) => {
		return getState().replies[i]
	}, [getState])

	// Sets the state of a child branch of the current branch of the tree.
	const setChildSubtreeState = useCallback((i, childSubtreeState) => {
		const replies = getState().replies.slice()
		replies[i] = childSubtreeState
		setState({
			...getState(),
			replies
		})
	}, [
		getState,
		setState
	])

	// This thing caches `getState()` functions
	// for each child branch of the current branch of the tree.
	const childSubtreeStateGetters = useRef([])

	const getChildSubtreeStateGetter = useCallback((i) => {
		if (!childSubtreeStateGetters.current[i]) {
			childSubtreeStateGetters.current[i] = () => {
				return getChildSubtreeState(i)
			}
		}
		return childSubtreeStateGetters.current[i]
	}, [])

	// This thing caches `setState()` functions
	// for each child branch of the current branch of the tree.
	const childSubtreeStateSetters = useRef([])

	const getChildSubtreeStateSetter = useCallback((i) => {
		if (!childSubtreeStateSetters.current[i]) {
			childSubtreeStateSetters.current[i] = (state) => {
				setChildSubtreeState(i, state)
			}
		}
		return childSubtreeStateSetters.current[i]
	}, [])

	// `getState()` and `setState()` properties are always defined
	// for a subtree of a tree. They aren't defined for the root of the tree.

	const [shouldShowReplies, setShowReplies] = useState(
		Boolean((parentComment ? getState() : initialState).replies)
	)

	const onShowRepliesChange = useCallback((showReplies) => {
		// The "expanded?" state of replies is derived from the `state` as:
		// * If state is `{}`, then replies are not expanded.
		// * Otherwise, replies are expanded, and there's a `replies[]` property.

		// A subtree state doesn't necessarily only contain the `replies` property.
		// It could contain other "custom" subtree state properties as well:
		// those could be set by the component by calling `componentProps.updateState(state => ({ ... }))`.
		//
		// Clone the subtree state so that it doesn't get "mutated".
		// We don't do "deep" cloning here because there's no need.
		//
		const newState = { ...getState() }

		if (showReplies) {
			// Calling `onShowReply()` for each reply should be the first thing
			// to do in this code block, because `onShowReply()` might somehow
			// "parse" the content of those replies. Below, `getStateOfReplies()`
			// function gets called, which might call `onShowReply()` for replies of replies.
			// If `onShowReply()` function depends on the order (from parent to child)
			// then it's important that it gets called for each higher-level reply first.
			//
			// An example is `anychan` parsing comment content in `onShowReply()` function,
			// and replies of replies might contain "autogenerated" quotes that depend on the
			// parsed comment content, so child replies depend on parent replies being already parsed.
			//
			if (onShowReply) {
				comment.replies.forEach(onShowReply)
			}
			newState.replies = getStateOfReplies(comment, { onShowReply })
		} else {
			delete newState.replies
		}

		setState(newState)
		setShowReplies(showReplies)
	}, [
		comment,
		onShowReply,
		getState,
		setState,
		setState,
		setShowReplies
	])

	const onToggleShowReplies = useCallback(() => {
		const showReplies = !shouldShowReplies
		let promise = Promise.resolve()
		// On expand replies — no scroll.
		// On un-expand replies — scroll to the original comment if it's not visible.
		if (!showReplies) {
			if (elementRef.current && toggleShowRepliesButtonRef.current) {
				promise = scrollToCommentIfToggleButtonIsNotVisible(
					elementRef.current,
					toggleShowRepliesButtonRef.current
				)
			}
		}
		promise.then(() => {
			onShowRepliesChange(showReplies)
		})
	}, [
		shouldShowReplies,
		onShowRepliesChange
	])

	// `onDidToggleShowReplies()` calls `onRenderedContentDidChange()`
	// that instructs `virtual-scroller` to re-measure the item's height.
	// Therefore, it should happen immedately after a re-render,
	// hence the use of `useLayoutEffect()` instead of `useEffect()`.
	useLayoutEffectSkipMount(() => {
		// Skip the initial render.
		if (onDidToggleShowReplies) {
			onDidToggleShowReplies()
		}
	}, [shouldShowReplies])

	let showReplies = shouldShowReplies
	// Expand replies without left padding if this is the only reply
	// for the comment and the comment is not a root-level one
	// and it's the only reply for the comment's parent comment.
	const _isMiddleDialogueChainLink = isMiddleDialogueChainLink(comment, parentComment)
	// Automatically expand dialogue comment chains.
	if (_isMiddleDialogueChainLink) {
		showReplies = true
	}

	const componentProps = getComponentProps ? getComponentProps({
		// If the initial state is "empty" then it's gonna be an empty object `{}`.
		initialState: getState(),
		updateState: (transformState) => setState(transformState(getState()))
	}) : undefined

	const repliesWithRemovedLeadingPostLink = useMemo(() => {
		return comment.replies && comment.replies.map((reply) => {
			return removeLeadingPostLink(reply, comment.id)
		})
	}, [
		comment.id,
		comment.replies
	])

	function getChildCommentTreeProps(i) {
		return {
			...rest,
			getState: getChildSubtreeStateGetter(i),
			setState: getChildSubtreeStateSetter(i),
			comment: repliesWithRemovedLeadingPostLink[i],
			parentComment: comment,
			component: Component,
			dialogueTraceStyle,
			getComponentProps,
			onShowReply,
			onDidToggleShowReplies
		}
	}

	return (
		<div className={classNames('CommentTree', {
			'CommentTree--nested': parentComment && !flat,
			// If comments don't have any side padding
			// then the root replies branch line would be ineligible
			// because it would be drawn at the very screen edge (mobile devices).
			// This CSS class can be used for styling such special case.
			'CommentTree--first-level': isFirstLevelTree
		})}>
			{parentComment && !flat &&
				<div className="CommentTree-branch"/>
			}
			{parentComment && !flat &&
				<div className="CommentTree-trunk"/>
			}
			{/* The comment. */}
			<Component
				{...rest}
				{...componentProps}
				className={classNames(className, {
					'CommentTree-comment--expanded': showReplies,
					'CommentTree-comment--nested': parentComment
				})}
				comment={comment}
				parentComment={parentComment}
				elementRef={elementRef}
				showingReplies={showReplies}
				onToggleShowReplies={comment.replies ? onToggleShowReplies : undefined}
				toggleShowRepliesButtonRef={toggleShowRepliesButtonRef}
			/>
			{/* Reply link marker for a single reply. */}
			{showReplies && _isMiddleDialogueChainLink &&
				<div className={classNames('CommentTreeDialogueTrace', {
					'CommentTreeDialogueTrace--side': dialogueTraceStyle === 'side',
					'CommentTreeDialogueTrace--through': dialogueTraceStyle === 'through'
				})}/>
			}
			{/* If there's only a single reply then there won't be (visually) the actual
		      reply "tree" rendered: a "dialogue chain" will be rendered instead. */}
			{showReplies && _isMiddleDialogueChainLink &&
				<CommentTree
					{...getChildCommentTreeProps(0)}
					flat
					isFirstLevelTree={isFirstLevelTree}
				/>
			}
			{/* If there're more than a single reply then show the replies tree. */}
			{showReplies && !_isMiddleDialogueChainLink &&
				<div className="CommentTree-replies">
					{/* Comment tree branch which is also a "Show"/"Hide" replies tree toggler. */}
					<Button
						tabIndex={-1}
						disabled={!toggleShowRepliesOnTreeBranchesClick}
						onClick={onToggleShowReplies}
						className="CommentTree-toggler"
					/>
					{/* The replies. */}
					{comment.replies.map((reply, i) => (
						<CommentTree
							{...getChildCommentTreeProps(i)}
							key={reply.id}
							isFirstLevelTree={!parentComment}
						/>
					))}
				</div>
			}
		</div>
	)
}

const commentTypeStub = PropTypes.object

const commentType = PropTypes.shape({
	id: PropTypes.any.isRequired,

	// Can't use recursive type definition here.
	// replies: PropTypes.arrayOf(commentType)
	replies: PropTypes.arrayOf(commentTypeStub)
})

CommentTree.propTypes = {
	// When `flat` is set to `true`, there won't be any side margin
	// (indentation) added to expanded replies' elements.
	// The default value is `false`.
	flat: PropTypes.bool,

	comment: commentType.isRequired,
	parentComment: commentType,

	// This flag is only for correctly styling root-level dialogue chains:
	// they require some left padding for eligibility on mobile devices.
	isFirstLevelTree: PropTypes.bool,

	component: PropTypes.func.isRequired,
	getComponentProps: PropTypes.func,

	// Whether the tree branches should be clickable.
	// If they're clickable, clicking on them will un-expand the corresponding tree of replies.
	toggleShowRepliesOnTreeBranchesClick: PropTypes.bool,

	// `state` is a recursive structure.
	// For a comment, `state` is an object.
	// If a comment's replies are expanded, it's `state.replies[]` property
	// is an array having the same count of elements as the replies count for the comment.
	// `state.replies === undefined` means "the comment's replies are not expanded".
	//  (or it could mean that there're no replies to this comment).
	//
	// Example:
	//
	// State:
	// {
	// 	replies: [
	// 		{},
	// 		{},
	// 		{
	// 			replies: [
	// 				{},
	// 				{
	// 					replies: [
	// 						{}
	// 					]
	// 				}
	// 			]
	// 		},
	// 		{}
	// 	]
	// }
	//
	// Representation:
	// |---------|
	// | Comment |
	// |---------|
	// |  |---------|
	// |--| Comment |
	// |  |---------|
	// |  |---------|
	// |--| Comment |
	// |  |---------|
	// |  |---------|
	// |--| Comment |
	// |  |---------|
	// |  |  |---------|
	// |  |--| Comment |
	// |  |  |---------|
	// |  |  |---------|
	// |  |--| Comment |
	// |     |---------|
	// |     |  |---------|
	// |     |--| Comment |
	// |        |---------|
	// |  |---------|
	// |--| Comment |
	//    |---------|
	// "Dialogue" reply chains are always expanded
	// when the first reply in the chain is expanded.
	initialState: PropTypes.object,
	onStateChange: PropTypes.func,

	initialShowReplies: PropTypes.bool,
	onShowReply: PropTypes.func,

	// `getState()`/`setState()` properties are only passed to child comment trees.
	setState: PropTypes.func,
	getState: PropTypes.func,

	// Determines how the visual traces between comments of a "dialogue" are gonna look like:
	// * "side" — Paints the connection lines on the left side of the comments of a "dialogue".
	// * "through" — Paints the connection line going directly through the comments of a "dialogue".
	//
	// "Dialogue" is a list of comments, each next comment being an only reply to the previous one.
	//
	// Example of a "dialogue":
	//
	// {
	// 	id: 1,
	// 	replies: [{
	// 		id: 5,
	// 		replies: [{
	// 			id: 10,
	// 			replies: [{
	// 				id: 11,
	// 				replies: [...]
	// 			}]
	// 		}]
	// 	}]
	// }
	//
	dialogueTraceStyle: PropTypes.oneOf(['side', 'through']).isRequired
}

CommentTree.defaultProps = {
	toggleShowRepliesOnTreeBranchesClick: true,
	dialogueTraceStyle: 'side'
}

export function isMiddleDialogueChainLink(comment, parentComment) {
	return comment.replies && comment.replies.length === 1 &&
			parentComment && parentComment.replies.length === 1
}

function expandDialogueChainReplies(subtreeState, comment, { onShowReply }) {
	let parentComment = comment
	let parentCommentState = subtreeState
	let reply
	// Keep expanding the reply tree while the reply
	// to the `comment` has itself a single reply too.
	while (
		(reply = parentComment.replies[0]) &&
		reply.replies && reply.replies.length === 1
	) {
		const subtreeState = {
			replies: [{}]
		}
		parentCommentState.replies[0] = subtreeState
		parentCommentState = subtreeState
		parentComment = reply
		if (onShowReply) {
			onShowReply(reply.replies[0])
		}
	}
}

// Returns a `Promise`.
function scrollToCommentIfToggleButtonIsNotVisible(commentElement, toggleButton) {
	// const postRect = commentElement.getBoundingClientRect()
	const toggleShowRepliesButtonRect = toggleButton.getBoundingClientRect()
	// if (postRect.top < 0) {
	if (toggleShowRepliesButtonRect.top < 0) {
		// const scrolledDistance = Math.abs(postRect.top)
		const scrolledDistance = Math.abs(toggleShowRepliesButtonRect.top)
		return scrollIntoView(commentElement, {
			duration: Math.min(140 + scrolledDistance / 2, 320)
		}).then(() => {
			// Focus the "Toggle show replies" button if the component is still mounted.
			if (toggleButton.isConnected) {
				toggleButton.focus()
			}
		})
	}
	return Promise.resolve()
}

function getStateOfReplies(comment, { onShowReply }) {
	const state = {
		replies: getInitialStateOfReplies(comment.replies.length)
	}
	// "Dialogue" reply chains are always expanded
	// when the first reply in the chain is expanded.
	// If this is such auto-expanded dialoglue chain
	// then update `state` in accordance.
	if (comment.replies.length === 1) {
		expandDialogueChainReplies(state, comment, { onShowReply })
	}
	return state.replies
}

function getInitialStateOfReplies(repliesCount) {
	// Not using `.fill({})` here, because it would
	// fill the array with the same object reference,
	// which would later lead to item states messing up each other.
	// https://stackoverflow.com/a/28507704/970769
	// Instead, create a new empty object for every element of the array.
	const replies = new Array(repliesCount)
	let i = 0
	while (i < replies.length) {
		replies[i] = {}
		i++
	}
	return replies
}

// This function is used in `anychan`.
export function getShowRepliesState(comment) {
	if (comment.replies) {
		return {
			replies: getInitialStateOfReplies(comment.replies.length)
		}
	}
	return {}
}