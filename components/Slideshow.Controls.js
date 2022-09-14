import React from 'react'
import PropTypes from 'prop-types'

import SlideshowPagination from './Slideshow.Pagination.js'
import SlideshowActions from './Slideshow.Actions.js'
import DragAndScaleModeControls from './Slideshow.DragAndScaleModeControls.js'
import SlideshowPropTypes from './Slideshow.PropTypes.js'

import Button from './Button.js'

// import LeftArrow from '../icons/left-arrow-minimal.svg'
// import RightArrow from '../icons/right-arrow-minimal.svg'

import LeftArrowCounterform from '../icons/left-arrow-minimal-counterform.svg'
import RightArrowCounterform from '../icons/right-arrow-minimal-counterform.svg'

import LeftArrowCounterformThickStroke from '../icons/left-arrow-minimal-counterform-thick-stroke.svg'
import RightArrowCounterformThickStroke from '../icons/right-arrow-minimal-counterform-thick-stroke.svg'

import './Slideshow.Controls.css'

export default function SlideshowControls({
	slideshow,
	slides,
	slideIndex,
	scale,
	messages,
	dragAndScaleMode,
	showActions,
	showScaleButtons,
	showMoreControls,
	showPagination,
	goToSource,
	closeButtonRef,
	previousButtonRef,
	nextButtonRef,
	highContrastControls
}) {
	const LeftArrowCounterForm = highContrastControls ? LeftArrowCounterformThickStroke : LeftArrowCounterform
	const RightArrowCounterForm = highContrastControls ? RightArrowCounterformThickStroke : RightArrowCounterform
	return (
		<div className="Slideshow-Controls">
			<DragAndScaleModeControls
				slideshow={slideshow}
				messages={messages}
				scale={scale}
				dragAndScaleMode={dragAndScaleMode}/>

			{showActions &&
				<SlideshowActions
					slideshow={slideshow}
					slides={slides}
					slideIndex={slideIndex}
					messages={messages}
					showScaleButtons={showScaleButtons}
					showMoreControls={showMoreControls}
					goToSource={goToSource}
					closeButtonRef={closeButtonRef}
					highContrastControls={highContrastControls}/>
			}

			{showActions && slides.length > 1 && slideIndex > 0 && slideshow.shouldShowPreviousNextButtons() &&
				<Button
					ref={previousButtonRef}
					title={messages.actions.previous}
					onClick={slideshow.onShowPrevious}
					className="Slideshow-Action Slideshow-Action--counterform Slideshow-Previous">
					<LeftArrowCounterForm className="Slideshow-ActionIcon"/>
				</Button>
			}

			{showActions && slides.length > 1 && slideIndex < slides.length - 1 && slideshow.shouldShowPreviousNextButtons() &&
				<Button
					ref={nextButtonRef}
					title={messages.actions.next}
					onClick={slideshow.onShowNext}
					className="Slideshow-Action Slideshow-Action--counterform Slideshow-Next">
					<RightArrowCounterForm className="Slideshow-ActionIcon"/>
				</Button>
			}

			{slides.length > 1 && showPagination &&
				<SlideshowPagination
					slideIndex={slideIndex}
					count={slides.length}
					isDisabled={slideshow.isLocked}
					onGoToSlide={slideshow.goToSlide}
					highContrast={highContrastControls}
					paginationDotsMaxSlidesCount={slideshow.props.paginationDotsMaxSlidesCount}
					className="Slideshow-ControlGroup--center Slideshow-ControlGroup--bottom"/>
			}
		</div>
	)
}

SlideshowControls.propTypes = {
	slides: SlideshowPropTypes.slides.isRequired,
	slideIndex: PropTypes.number.isRequired,
	scale: PropTypes.number.isRequired,
	showActions: PropTypes.bool,
	messages: SlideshowPropTypes.messages,
	dragAndScaleMode: PropTypes.bool,
	showScaleButtons: PropTypes.bool,
	showMoreControls: PropTypes.bool,
	showPagination: PropTypes.bool,
	goToSource: PropTypes.func,
	closeButtonRef: PropTypes.object,
	previousButtonRef: PropTypes.object,
	nextButtonRef: PropTypes.object,
	highContrastControls: PropTypes.bool,
	slideshow: PropTypes.object.isRequired
}