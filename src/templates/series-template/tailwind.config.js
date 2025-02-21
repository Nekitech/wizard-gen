export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			fontSize: {
				'4xl': '2.625rem',
				'3xl': '2.375rem',
				'base': '1rem',
				'base-medium': '1.125rem',
			},
			colors: {
				'primary': '#FF0066', // Ярко-розовый цвет
				'dark-bg': '#13131A', // Темно-серый фон
				'card-bg': '#1A1A23', // Цвет фона карточек
				'black': '#000',
				'white': '#fff',
				'main': '#1a222a',
				'secondary': '#E53B7E',
			},
			backgroundImage: {
				'hero-gradient': 'linear-gradient(to bottom, rgba(255, 0, 102, 0.2), #0A0A0F)',
			},
			fontFamily: {
				primary: ['Inter', 'Arial', 'sans-serif'],
				secondary: ['Inter', 'Arial', 'sans-serif'],
			},
			letterSpacing: {
				wide: '1.5px',
			},
		},
	},
	plugins: [],
};
