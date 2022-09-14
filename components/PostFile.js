import React from 'react'
import PropTypes from 'prop-types'
import filesize from 'filesize'

import { postFile } from './PropTypes.js'

import ArchiveIcon from '../icons/archive.svg'
import DocumentIcon from '../icons/document.svg'
import DownloadIcon from '../icons/download-cloud.svg'

import './PostFile.css'

export default function PostFile({ file }) {
	return (
		<div className="PostFile">
			<FileIcon
				type={file.type}
				className="PostFile-icon"/>
			<a
				target="_blank"
				href={file.url}>
				{`${file.name || ''}${file.ext || ''}`}
			</a>
			{file.size &&
				<span className="PostFile-size">
					{filesize(file.size)}
				</span>
			}
		</div>
	)
}

PostFile.propTypes = {
	file: postFile.isRequired
}

function FileIcon({ type, ...rest }) {
	switch (type) {
		case 'text/plain':
		case 'application/pdf':
			return <DocumentIcon {...rest}/>
		case 'application/zip':
		case 'application/x-7z-compressed':
			return <ArchiveIcon {...rest}/>
		default:
			return <DownloadIcon {...rest}/>
	}
}

FileIcon.propTypes = {
	type: PropTypes.string
}

export const EXAMPLE_1 = {
	type: 'application/x-shockwave-flash',
	name: 'How to Raise a Dragon',
	// ext: '.swf',
	size: 5.5 * 1024 * 1024,
	url: 'https://google.com'
}

export const EXAMPLE_2 = {
	type: 'application/pdf',
	name: 'Industrial society and its future',
	ext: '.pdf',
	size: 350 * 1024,
	url: 'https://google.com'
}

export const EXAMPLE_3 = {
	type: 'application/zip',
	name: 'Mirrors-Edge-PC-RePack-R.G.-Mehaniki',
	ext: '.zip',
	url: 'https://google.com'
}