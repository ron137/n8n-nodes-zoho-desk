const { src, dest } = require('gulp');
const path = require('path');

function buildIcons() {
	return src('nodes/**/*.svg')
		.pipe(dest('dist/nodes'));
}

exports['build:icons'] = buildIcons;
exports.default = buildIcons;
