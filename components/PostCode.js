import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter'

import { postCode } from './PropTypes.js'

import './PostCode.css'

/**
 * Renders some code.
 * Could also highlight the syntax:
 * https://github.com/catamphetamine/captchan/issues/4#issuecomment-513475218
 */
export default function PostCode({
	block,
	language,
	className: _className,
	children
}) {
	const codeTagProps = useMemo(() => ({
		className: `language-${language}`
	}), [language])
	const className = classNames(
		_className,
		'PostCode',
		block && 'PostCode--block',
		!block && 'PostCode--inline',
		!block && language && `language-${language}`
	)
	if (language && typeof children === 'string') {
		if (SyntaxHighlighter.supportedLanguages.includes(language)) {
			// `<SyntaxHighlighter/>` can produce warnings when unmounted.
			// https://github.com/react-syntax-highlighter/react-syntax-highlighter/issues/352
			return (
				<SyntaxHighlighter
					inline={!block}
					useInlineStyles={false}
					wrapLongLines
					language={language}
					className={classNames(className, 'PostCode--highlighted')}
					codeTagProps={codeTagProps}>
					{children}
				</SyntaxHighlighter>
			)
		}
	}
	if (!block) {
		return (
			<code className={className}>
				{children}
			</code>
		)
	}
	// It's only semantially valid to place code in a `<code/>` element,
	// therefore adding a nested `<code/>` inside `<pre/>` for code.
	// https://html.spec.whatwg.org/multipage/grouping-content.html#the-pre-element
	return (
		<pre className={className}>
			{language &&
				<code className={`language-${language}`}>
					{children}
				</code>
			}
			{!language && children}
		</pre>
	)
}

PostCode.propTypes = {
	block: PropTypes.bool.isRequired,
	language: PropTypes.string,
	className: PropTypes.string,
	children: PropTypes.node
}