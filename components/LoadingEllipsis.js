import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './LoadingEllipsis.css';

const LoadingEllipsis = ({
  square = true,
  className
}) => {
  return (
    <div className={classNames(className, 'LoadingEllipsis', {
      'LoadingEllipsis--square': square
    })}>
      <div className="LoadingEllipsis-dot"/>
      <div className="LoadingEllipsis-dot"/>
      <div className="LoadingEllipsis-dot"/>
    </div>
  );
};

LoadingEllipsis.propTypes = {
  // Pass `true` for the `<LoadingEllipsis/>` element to occupy square space.
  // By default, this flag is `true`.
  // If this flag is set to `false`, the `<LoadingEllipsis/>` element will be a flat one
  // with the excessive space on top and bottom trimmed.
  square: PropTypes.bool,
  className: PropTypes.string
};

export default LoadingEllipsis;