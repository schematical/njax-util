var fs = require('njax-fs');
var path = require('path');

module.exports = NJaxUtil = function(){
	return NJaxUtil;
}

/**
 * Finds the file that contains the function that calls this
 * @returns {*}
 */
NJaxUtil.prototype.getCaller = function(options){
	options = options || {};
	var stackTrace = require('stack-trace');
	var trace = stackTrace.get();
	for(var i = 0; i < (options.stackDepth || 2); i++) {
		trace.shift();
	}

	var callerPath = trace[0].getFileName();
	return callerPath;

}
NJaxUtil.prototype.getCallerNotInThisModule = function(options){

	options = options || {};
	var stackTrace = require('stack-trace');
	var trace = stackTrace.get();
	for(var i in trace){
		if(path.dirname(trace[i].getFileName()) != __dirname){
			return trace[i].getFileName()
		}
	}

	var callerPath = trace[0].getFileName();
	return callerPath;

}



NJaxUtil.prototype.module = function (options, callback) {
	if(!callback && _.isFunction(options)){
		callback = options;
		options = null;
	}
	if(!callback){
		throw new Error("Must pass in a valid `callback`");
	}
	var dir = path.dirname(options.dir || NJaxUtil.getCallerNotInThisModule());
	return fs.walkOutUntil(
			dir,
			function(searchDir, next){
				if(fs.existsSync(path.join(searchDir, 'package.json'))){
					return next(true);
				}
				return next(false)
			},
			function(err, foundInDir){
				if(err) return callback(err);
				if(!foundInDir){
					return callback();
				}

				return new NJaxUtil.Module(foundInDir);
			}
	);

}


NJaxUtil.prototype.parent = function (callback) {
	return NJaxUtil.module(function (err, myPackage) {
		if (err) return callback(err);
		if (!myPackage) return callback(null, null);

		var parts = myPackage.split('/');
		parts.pop();
		if(parts.length == 1){
			console.log('njax-util.walkOutUntil - hit the end of the road', parts);
			return callback();
		}
		NJaxUtil.module(
			{
				dir:parts.join('/')
			},
			callback
		);
	})
}

NJaxUtil.Module = function(root){
	this.root = root;
	return this;
}
NJaxUtil.Module.prototype.package = function(callback){
	return fs.readJSON(
			path.join(this.root, 'package.json'),
			callback
	);
}