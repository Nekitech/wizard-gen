import { RoutesName, TRoutes } from '../types.ts';

export const routes: TRoutes = {
	[RoutesName.MAIN]: {
		href: '/',
		title: 'Главная',
	},
	[RoutesName.SEASON_1]: {
		href: '/season-1/',
		title: 'Сезон 1',
	},
	[RoutesName.SEASON_2]: {
		href: '/season-2/',
		title: 'Сезон 2',
	},
	[RoutesName.EPISODES]: {
		href: '/episodes/',
		title: 'Эпизоды',
	},
	[RoutesName.FILM_CREW]: {
		title: 'Cъемочная группа',
		href: '/cast/',
	},
	[RoutesName.NEWS]: {
		title: 'Новости',
		href: '/news/',
	},
} as const;

const headerLinks = [RoutesName.SEASON_1, RoutesName.SEASON_2, RoutesName.FILM_CREW, RoutesName.NEWS];
const footerLinks = [RoutesName.SEASON_1, RoutesName.SEASON_2, RoutesName.FILM_CREW, RoutesName.NEWS];

export const getHeaderLinks = (routes: TRoutes) => {
	return Object.entries(routes)
		.filter(elem => headerLinks.includes(elem[0] as RoutesName))
		.map(elem => elem[1]);
};

export const getFooterLinks = (routes: TRoutes) => {
	return Object.entries(routes)
		.filter(elem => footerLinks.includes(elem[0] as RoutesName))
		.map(elem => elem[1]);
};

export const getRouteByName = (route: RoutesName) => {
	return routes[route];
};
