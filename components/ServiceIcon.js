import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import WikipediaIcon from '../icons/services/wikipedia.svg'
import GoogleIcon from '../icons/services/google.svg'
import YandexIcon from '../icons/services/yandex.svg'
import YouTubeIcon from '../icons/services/youtube.svg'
import VimeoIcon from '../icons/services/vimeo.svg'
import FacebookIcon from '../icons/services/facebook.svg'
import InstagramIcon from '../icons/services/instagram.svg'
import VKIcon from '../icons/services/vk.svg'
import DiscordIcon from '../icons/services/discord.svg'
import TelegramIcon from '../icons/services/telegram.svg'
import TwitterIcon from '../icons/services/twitter.svg'
import TwitchIcon from '../icons/services/twitch.svg'
import SteamIcon from '../icons/services/steam.svg'
import GitHubIcon from '../icons/services/github.svg'
import GitLabIcon from '../icons/services/gitlab.svg'
import RedditIcon from '../icons/services/reddit.svg'

import './ServiceIcon.css'

export default function ServiceIcon({
	service,
	monochrome,
	icons,
	title,
	className,
	...rest
}) {
	const serviceIcon = getIcon(service, icons)
	if (!serviceIcon) {
		return null
	}
	return React.createElement(serviceIcon, {
		...rest,
		title: title === undefined ? service : title,
		className: classNames(className, 'ServiceIcon', monochrome && 'ServiceIcon--monochrome')
	})
}

ServiceIcon.propTypes = {
	service: PropTypes.string.isRequired,
	serviceIcons: PropTypes.objectOf(PropTypes.elementType),
	title: PropTypes.string,
	className: PropTypes.string
}

const SERVICE_ICONS = {
	'youtube': YouTubeIcon,
	'vimeo': VimeoIcon,
	'facebook': FacebookIcon,
	'instagram': InstagramIcon,
	'vk': VKIcon,
	'discord': DiscordIcon,
	'twitter': TwitterIcon,
	'telegram': TelegramIcon,
	'github': GitHubIcon,
	'gitlab': GitLabIcon,
	'reddit': RedditIcon,
	'google': GoogleIcon,
	'yandex': YandexIcon,
	'twitch': TwitchIcon,
	'steam': SteamIcon,
	'wikipedia': WikipediaIcon
}

export function hasIcon(service, icons) {
	return getIcon(service, icons) !== undefined
}

function getIcon(service, icons) {
	return (icons && icons[service]) || SERVICE_ICONS[service]
}