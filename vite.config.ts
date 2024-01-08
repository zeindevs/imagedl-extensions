import react from "@vitejs/plugin-react-swc"
import path from 'path'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: './',
        },
        {
          src: 'LICENSE',
          dest: './',
        },
      ],
    }),
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, './index.html'),
        options: path.resolve(__dirname, './options.html'),
        background: path.resolve(__dirname, './src/background.ts'),
        'image-extractor': path.resolve(__dirname, './src/utils/image-extractor.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      }
    },
  },
  resolve: {
    alias: {
      '@': `${path.resolve(__dirname, 'src')}/`,
    },
  },
})
