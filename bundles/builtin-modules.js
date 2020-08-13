import module from 'module';

const {builtinModules} = module;

const blacklist = [
	'sys'
];

// eslint-disable-next-line node/no-deprecated-api
var builtinModules_1 = (builtinModules || Object.keys(process.binding('natives')))
	.filter(x => !/^_|^(internal|v8|node-inspect)\/|\//.test(x) && !blacklist.includes(x))
	.sort();
