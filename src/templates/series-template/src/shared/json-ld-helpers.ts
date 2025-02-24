import { CastMember, Episode, NewsItem } from '../content/config.ts';

export const getEpisodeJsonLd = (episode: Episode, season: number) => {
	return {
		'@type': 'TVEpisode',
		'name': episode.title,
		'datePublished': episode.releaseDate,
		'description': episode.description,
		'thumbnailUrl': `${import.meta.env.FULL_BASE_URL}${episode.thumbnail.src}`,
		'url': `${import.meta.env.FULL_BASE_URL}/season-${season}/${episode.slug}/`,
	};
};

export const getSeasonJsonLd = (episodes: Episode[] | undefined, season: number) => {
	return {
		'@type': 'TVSeason',
		'name': `Сезон ${season}`,
		'seasonNumber': season,
		'episode': episodes
			?.map(episode => getEpisodeJsonLd(episode, season)),
		'url': `${import.meta.env.FULL_BASE_URL}/season-${season}/`,
	};
};

export const getPersonJsonLd = (cast: CastMember) => {
	return {
		'@type': 'Person',
		'name': cast.name,
		'image': `${import.meta.env.FULL_BASE_URL}${cast.image.src}`,
		'url': `${import.meta.env.FULL_BASE_URL}/cast/${cast.slug}/`,
		// "birthDate": new Date(cast.birth).toISOString(), invalid date
		'jobTitle': cast.role,
	};
};

export const getNewsJsonLd = (item: NewsItem) => {
	return {
		'@type': 'NewsArticle',
		'name': item.title,
		'datePublished': new Date(item.date).toISOString(),
		'description': item.description,
		'thumbnailUrl': `${import.meta.env.FULL_BASE_URL}${item.image.src}`,
		'url': `${import.meta.env.FULL_BASE_URL}/news/${item.slug}/`,
		'author': {
			// url or sameAs is recommended
			'@type': 'Person',
			'name': item.source,
		},
		'image': `${import.meta.env.FULL_BASE_URL}${item.image.src}`,
		'publisher': {
			// url or sameAs is recommended
			'@type': 'Person',
			'name': item.source,
		},
		'headline': item.title,
		'dateModified': new Date(item.date).toISOString(),
		'mainEntityOfPage': `${import.meta.env.FULL_BASE_URL}/news/${item.slug}/`,
	};
};

export const createBreadcrumbListJsonLD = (routes: {
	name: string;
	url: string;
}[]) => {
	return {
		'@type': 'BreadcrumbList',
		'itemListElement':
            routes.map((route, index) => {
            	return {
            		'@type': 'ListItem',
            		'position': index + 1,
            		'item': {
            			'@id': `${route.url}`,
            			'name': route.name,
            		},
            	};
            }),
	};
};
