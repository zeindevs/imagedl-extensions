import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

import packageJson from './package.json' with { type: 'json' }

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		viteStaticCopy({
			targets: [
				{
					src: 'manifest.json',
					dest: './',
					transform: (contents) => {
						const parsed = JSON.parse(contents)
						parsed.$schema = null
						parsed.version = packageJson.version
						return JSON.stringify(parsed, null, 2)
					},
				},
				{
					src: 'LICENSE',
					dest: './',
				},
			],
		}),
	],
	build: {
		outDir: 'dist',
		rollupOptions: {
			input: {
				popup: path.resolve(__dirname, './index.html'),
				background: path.resolve(__dirname, './src/background.ts'),
				inject: path.resolve(__dirname, './src/inject.ts'),
			},
			output: {
				entryFileNames: '[name].js',
				assetFileNames: '[name].[ext]',
			},
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
})
