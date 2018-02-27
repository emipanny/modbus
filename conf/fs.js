

// mysql.js
const fs = require('fs');

exports.query = (sql, ins) => new Promise((resolve, reject) => {
	db.query(sql, ins, (err, result, fields) => {
		err ? reject(err) : resolve(result);
	})
})
exports.writeFile = (name, str) => new Promise((resolve, reject) => {
	 fs.writeFile(name,str,function (err) {
		err ? reject(err) : resolve(true);
	 }) ;
})
exports.readFile = (name, code = "utf8") => new Promise((resolve, reject) => {
	fs.readFile(name, code, function (err,data){
		err ? reject(err) : resolve(data);
	}) ;
})

exports.rename = (uploadedPath,dstPath) => new Promise((resolve, reject) => {
	fs.rename(uploadedPath,dstPath, function (err) {
		err ? reject(err) : resolve();
	}) ;
})
