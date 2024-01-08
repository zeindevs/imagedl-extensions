import { existsSync, mkdirSync } from 'fs'
import { zip } from 'zip-a-folder'

import manifest from './manifest.json' assert { type: 'json' }

const build = async () => {
	if (!existsSync('build')) {
		mkdirSync('build')
	}
	await zip('dist', `build/imagedl-extensions-v${manifest.version}.zip`)
}

build()
