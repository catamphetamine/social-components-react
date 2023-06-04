import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Button from './Button.js'

// import XIcon from '../icons/x.svg'
// import Download from '../icons/download-cloud.svg'
import ExternalIcon from '../icons/external.svg'

import ScaleFrame from '../icons/scale-frame.svg'
import Plus from '../icons/plus.svg'
import Minus from '../icons/minus.svg'

import CloseCounterform from '../icons/close-counterform.svg'
import EllipsisVerticalCounterform from '../icons/ellipsis-vertical-counterform.svg'

import CloseCounterformThickStroke from '../icons/close-counterform-thick-stroke.svg'
import EllipsisVerticalCounterformThickStroke from '../icons/ellipsis-vertical-counterform-thick-stroke.svg'

import GoToIconCounterform from '../icons/go-to-counterform.svg'

import { slideType } from './Slideshow.PropTypes.js'

import './Slideshow.Actions.css'

export default function SlideshowActions({
	slideshow,
	slides,
	slideIndex,
	showScaleButtons,
	showMoreControls,
	messages,
	goToSource,
	closeButtonRef,
	highContrastControls
}) {
	const CloseCounterForm = highContrastControls ? CloseCounterformThickStroke : CloseCounterform
	const EllipsisVerticalCounterForm = highContrastControls ? EllipsisVerticalCounterformThickStroke : EllipsisVerticalCounterform

	const onGoToSource = useCallback(() => {
		goToSource(slides[slideIndex])
	}, [goToSource, slides, slideIndex])

	return (
		<ul className="Slideshow-Actions">
			{slideshow.shouldShowMoreControls() && slideshow.shouldShowScaleButtons() &&
				<li className={classNames('Slideshow-ActionWrapper', {
					'Slideshow-ActionWrapper--group': showScaleButtons
				})}>
					{showScaleButtons &&
						<Button
							title={messages.actions.scaleDown}
							onClick={slideshow.onScaleDown}
							className="Slideshow-Action">
							<Minus className="Slideshow-ActionIcon"/>
						</Button>
					}
					<Button
						title={messages.actions.scaleReset}
						onClick={slideshow.onScaleToggle}
						className="Slideshow-Action">
						<ScaleFrame className="Slideshow-ActionIcon"/>
					</Button>
					{showScaleButtons &&
						<Button
							title={messages.actions.scaleUp}
							onClick={slideshow.onScaleUp}
							className="Slideshow-Action">
							<Plus className="Slideshow-ActionIcon"/>
						</Button>
					}
				</li>
			}

			{slideshow.shouldShowMoreControls() && slideshow.shouldShowOpenExternalLinkButton() &&
				<li className="Slideshow-ActionWrapper">
					<a
						target="_blank"
						title={messages.actions.openExternalLink}
						onKeyDown={clickTheLinkOnSpacebar}
						href={slideshow.getPluginForSlide().getExternalLink(slideshow.getCurrentSlide())}
						className="Slideshow-Action Slideshow-Action--link">
						<ExternalIcon className="Slideshow-ActionIcon"/>
					</a>
				</li>
			}

			{/*slideshow.shouldShowMoreControls() && slideshow.shouldShowDownloadButton() &&
				<li className="Slideshow-ActionWrapper">
					<a
						download
						target="_blank"
						title={messages.actions.download}
						onKeyDown={clickTheLinkOnSpacebar}
						href={slideshow.getPluginForSlide().getDownloadUrl(slideshow.getCurrentSlide())}
						className="Slideshow-Action Slideshow-Action--link">
						<Download className="Slideshow-ActionIcon"/>
					</a>
				</li>
			*/}

			{slideshow.shouldShowMoreControls() && slideshow.getOtherActions().map(({ name, icon: Icon, link, action }) => {
				const icon = <Icon className={`Slideshow-ActionIcon Slideshow-ActionIcon--${name}`}/>
				return (
					<li key={name} className="Slideshow-ActionWrapper">
						{link &&
							<a
								target="_blank"
								href={link}
								title={messages.actions[name]}
								className="Slideshow-Action Slideshow-Action--link">
								{icon}
							</a>
						}
						{!link &&
							<Button
								onClick={(event) => {
									if (!slideshow.slideshow.isLocked()) {
										action(event)
									}
								}}
								title={messages.actions[name]}
								className="Slideshow-Action">
								{icon}
							</Button>
						}
					</li>
				)
			})}

			{/* "Go to source" */}
			{goToSource &&
				<li className="Slideshow-ActionWrapper">
					<Button
						title={messages.actions.goToSource}
						onClick={onGoToSource}
						className="Slideshow-Action Slideshow-Action--counterform">
						<GoToIconCounterform className="Slideshow-ActionIcon"/>
					</Button>
				</li>
			}

			{/* "Show/Hide controls" */}
			{/* Is visible only on small screens. */}
			{!slideshow.shouldShowMoreControls() && slideshow.hasHidableControls() && slideshow.shouldShowShowMoreControlsButton() &&
				<li className="Slideshow-ActionWrapper Slideshow-ActionWrapper--toggle-controls">
					<Button
						title={showMoreControls ? messages.actions.hideControls : messages.actions.showControls}
						onClick={slideshow.onShowMoreControls}
						className={classNames('Slideshow-Action', 'Slideshow-Action--counterform', {
							'Slideshow-Action--toggled': showMoreControls
						})}>
						<EllipsisVerticalCounterForm className="Slideshow-ActionIcon"/>
					</Button>
				</li>
			}

			{slideshow.shouldShowCloseButton() &&
				<li className="Slideshow-ActionWrapper">
					<Button
						ref={closeButtonRef}
						title={messages.actions.close}
						onClick={slideshow.onRequestClose}
						className="Slideshow-Action Slideshow-Action--counterform">
						<CloseCounterForm className="Slideshow-ActionIcon"/>
					</Button>
				</li>
			}
		</ul>
	)
}

SlideshowActions.propTypes = {
	slides: PropTypes.arrayOf(slideType).isRequired,
	slideIndex: PropTypes.number.isRequired,
	slideshow: PropTypes.object.isRequired,
	showScaleButtons: PropTypes.bool,
	showMoreControls: PropTypes.bool,
	messages: PropTypes.object.isRequired,
	goToSource: PropTypes.func,
	closeButtonRef: PropTypes.object
}

function clickTheLinkOnSpacebar(event) {
	switch (event.keyCode) {
		// "Spacebar".
		// Play video
		case 32:
			event.preventDefault()
			event.target.click()
	}
}