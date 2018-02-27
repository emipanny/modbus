

// mysql.js
const mysql = require('mysql');
const config=require("../conf/config.js");
const db = mysql.createConnection(config.db);

exports.query = (sql, ins) => new Promise((resolve, reject) => {
	db.query(sql, ins, (err, result, fields) => {
		err ? reject(err) : resolve(result);
	})
})
exports._query = (db_name,sql, ins) => new Promise((resolve, reject) => {

	let db_other = mysql.createConnection(config[db_name]);
	db_other.query(sql, ins, (err, result, fields) => {
		err ? reject(err) : resolve(result);
	})
})
exports.connect = () => new Promise((resolve, reject) => {
	let pool = mysql.createPool(config.db);
	pool.getConnection(function(err, connection){
		if(err) return reject(err);
		connection._query = connection.query;
		connection.query = (sql, ins) => new Promise((resolve, reject) => {
			pool.query(sql, ins, (err, result, fields) => {
				err ? reject(err) : resolve(result);
			})
		})
		return resolve(connection);
	})
})