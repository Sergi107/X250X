/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				pmc: {
					950: '#0a0a0b', // Fondo principal (Casi negro)
					900: '#18181b', // Fondo secundario
					800: '#27272a', // Bordes
					accent: '#f59e0b', // Naranja Táctico (Amber-500)
					dim: '#a1a1aa', // Texto gris
				},
			},
			fontFamily: {
				sans: ['Onest Variable', ...defaultTheme.fontFamily.sans],
				mono: ['JetBrains Mono Variable', ...defaultTheme.fontFamily.mono],
			},
			backgroundImage: {
				'grid-pattern': "linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)",
			}
		},
	},
	plugins: [],
}