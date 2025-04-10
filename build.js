import { existsSync, mkdirSync } from 'node:fs'
import { zip } from 'zip-a-folder'

import manifest from './manifest.json' with { type: 'json' }

const build = async () => {
	if (!existsSync('build')) {
		mkdirSync('build')
	}
	await zip('dist', `build/imagedl-extensions-v${manifest.version}.zip`)
}

build()
