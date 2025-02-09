export interface ILink {
	title: string;
	href: string;
}

export enum RoutesName {
	MAIN = 'MAIN',
	SEASON_1 = 'SEASON_1',
	SEASON_2 = 'SEASON_2',
	EPISODES = 'EPISODES',
	FILM_CREW = 'FILM_CREW',
	NEWS = 'NEWS',
}

export type TRoutes = Record<RoutesName, ILink>;
