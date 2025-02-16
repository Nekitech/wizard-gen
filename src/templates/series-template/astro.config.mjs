import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import robotsTxt from 'astro-robots-txt';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const { NODE_ENV } = loadEnv(process.env.NODE_ENV, process.cwd(), '');

const isProduction = NODE_ENV === 'production';

const robotsTxtOptions = !isProduction
	? {
			policy: [
				{
					disallow: '/',
				},
			],
		}
	: {};

// https://astro.build/config
export default defineConfig({
	integrations: [tailwind(), sitemap(), robotsTxt(robotsTxtOptions)],
	trailingSlash: 'always',
	site: !isProduction ? 'https://obl1v1onzzz.github.io' : 'https://igravkalmara.live',
	base: !isProduction ? 'squid-game-2' : '',
	vite: {
		build: {
			rollupOptions: {
				output: {
					assetFileNames: 'assets/generated/[name].[hash][extname]',
				},
			},
		},
	},

});
