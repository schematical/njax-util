"use strict";
var fs = require('njax-fs');
var path = require('path');
var async = require('async');
var _ = require('underscore');
class NJaxUtil {
	constructor(){
	}
	static module(options, callback) {
		options = options || {};
		var dir = options.dir || path.dirname(module.parent.id);
		var p = new Promise((resolve, reject) => {
			return fs.walkOutUntil(
				dir,
				function (searchDir, next) {
					var searchLoc = path.join(searchDir, 'package.json');

					if (fs.existsSync(searchLoc)) {
						return next(null, true);
					}
					return next (null, false)
				},
				function (err, foundInDir) {
					if (err) return reject(err);
					if (!foundInDir) {
						return resolve();
					}
					return resolve(new NJaxUtil.Module(foundInDir));
				}
			);
		});
		if (callback) {
			p.then((result) => {
				return callback(null, result);
			}).catch(e => {
				return reject(e);
			});
		}
		return p;

	}

	static parent(callback) {
		var dir = path.dirname(module.parent.parent.id); //NJaxUtil.getCallerNotInThisModule({ max_hop_count:2});
		var p = NJaxUtil.module({
			dir: dir
		});
		if (callback) {
			p.then((result) => {
				return callback(null, result);
			}).catch(e => {
				reject(e);
			});
		}
		return p;
	}

	static get Module() {
		return Module;
	}
	static get Package(){
		return Package;
	}
}
class Package{
	constructor(packageData, packagePath){
		this.packageData = packageData;
		this.path = packagePath;
		Object.keys(this.packageData).forEach((key)=>{
			Object.defineProperty(this, key, {
				get: () =>{
					return this.packageData[key];
				},
				set:(val)=>{
					this.packageData[key];
				}
			});

		})
		_.extend(this, packageData);
	}
	set(key, val){
		this.packageData[key] = val;
	}
	save(){
		return new Promise((resolve, reject)=>{
			return fs.writeJSON(
				this.path,
				this.packageData,
				(err, result) =>{
					console.log(err, result);
					if(err) return reject(err);
					return resolve(result);
				}
			)
		});
	}

}

class Module {
	constructor(root) {
		//console.log('root', root);
		this.root = root;
		return this;
	}
	package(callback) {
		var packagePath = path.join(this.root, 'package.json')
		var p = new Promise((resolve, reject)=> {
			return fs.readJSON(
				packagePath,
				(err, body)=> {
					if (err) return reject(err);
					return resolve(
						new NJaxUtil.Package(
							body,
							packagePath
						));
				}
			);
		});
		if (callback) {
			p.then((result) => {
				return callback(null, result);
			}).catch(e => {
				reject(e);
			});
		}
		return p;
	}
}
module.exports = NJaxUtil;