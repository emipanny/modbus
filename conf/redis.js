

// redis.js
const redis = require('redis');
const config=require("../conf/config.js");
const RDS_PORT = config.redis.port,		//端口号
RDS_HOST = config.redis.host,	//服务器IP
RDS_OPTS = {auth_pass: config.redis.pwd},			//设置项
client = redis.createClient(RDS_PORT,RDS_HOST,RDS_OPTS);

client.on('connect',function(){});

exports.set = (key, value, time) => new Promise((resolve, reject) => {
	client.set(key,value,(err,response)=>{
		if (err) reject(err);
		else {
			client.expire(key, time);
			resolve();
		}
	});
})
exports.get = (key) => new Promise((resolve, reject) => {
	client.get(key,(err, reply)=>{
		err ? reject(err) : resolve(reply);
	});
})