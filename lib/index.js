var fs = require('njax-fs');
var path = require('path');
var async = require('async');
var _ = require('underscore');
module.exports = NJaxUtil = function () {
	return NJaxUtil;
}

/**
 * Finds the file that contains the function that calls this
 * @returns {*}
 */
NJaxUtil.getCaller = function (options) {
	options = options || {};
	var stackTrace = require('stack-trace');
	var trace = stackTrace.get();
	for (var i = 0; i < (options.stackDepth || 2); i++) {
		trace.shift();
	}

	var callerPath = trace[0].getFileName();
	return callerPath;

}
NJaxUtil.getCallerNotInThisModule = function (options) {

	options = options || {};
	var stackTrace = require('stack-trace');
	var trace = stackTrace.get();
	var comp_dir = options.start_dir || __dirname;
	var hop_count = 0;
	var max_hop_count = options.max_hop_count || 1;
	for (var i in trace) {
		console.log(path.dirname(trace[i].getFileName()), '!=', comp_dir);
		if (path.dirname(trace[i].getFileName()) != comp_dir) {
			hop_count += 1;

			comp_dir = trace[i].getFileName()
			if(hop_count >= max_hop_count) {
				return comp_dir;
			}
		}
	}

	var callerPath = trace[0].getFileName();
	return callerPath;

}


NJaxUtil.module = function (options, callback) {
	if (!callback && _.isFunction(options)) {
		callback = options;
		options = {};
	}

	if (!callback) {
		throw new Error("Must pass in a valid `callback`");
	}

	var dir = path.dirname(options.dir || NJaxUtil.getCallerNotInThisModule());


	return fs.walkOutUntil(
			dir,
			function (searchDir, next) {
				if (fs.existsSync(path.join(searchDir, 'package.json'))) {
					return next(true);
				}
				return next(false)
			},
			function (err, foundInDir) {

				if (err) return callback(err);
				if (!foundInDir) {
					return callback();
				}

				return callback(null, new NJaxUtil.Module(foundInDir));
			}
	);

}


NJaxUtil.parent = function (callback) {
	var dir = NJaxUtil.getCallerNotInThisModule({ max_hop_count:2});
	//dir = path.resolve(dir,'..')
	console.log('dir', dir);
	return NJaxUtil.module({
				dir: dir
			},
			function (err, myPackage) {
				if (err) return callback(err);
				if (!myPackage) return callback(null, null);

				return callback(null, myPackage);
			})
}

NJaxUtil.Module = function (root) {
	console.log('root', root);
	this.root = root;
	return this;
}
NJaxUtil.Module.prototype.package = function (callback) {
	return fs.readJSON(
			path.join(this.root, 'package.json'),
			callback
	);
}