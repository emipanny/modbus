
const uuid = require('node-uuid');
const vr = require("validator");
const {fs, mysql, comment, redis, WXBizDataCrypt, form}=require("../conf");
const https = require('https');
const config = require("../conf/config");

exports.getHome = async (req, res) => {
	let now = Date.now() / 1000 |0;
	let bid = req.controller.id;

	let sql = "SELECT b.id, c.count FROM t_projects as b  LEFT JOIN ( SELECT id, pid, uid, count(pid) as count FROM t_projects_talk WHERE 1 GROUP BY pid ) AS c on b.id = c.pid WHERE";
	let on = await mysql.query( sql + " b.startTime < ? and b.endTime > ? and b.bid = ?",[now,now,bid]);
	let will = await mysql.query( sql + " b.startTime >= ? and b.bid = ?",[now,bid]);
	let end = await mysql.query(sql + " b.endTime <= ? and b.bid = ?",[now,bid]);

	return res.json({on: on, will: will, end: end});
};

exports.addProject = async (req, res) => {
	let {title,startTime,schedule,amout,position,content,quota} = req.query;
	if (!title || !startTime || !schedule || !amout || !position) return res.json(11001);
	if (typeof(title) != "String") return res.json(11001);
	if (startTime.length != 10)  return res.json(11001);

	let endTime = startTime + 86400*schedule;

	let bid = req.controller.id;

	let created_at = updated_at = Date.now() / 1000 |0;

	let sql = "INSERT INTO p_user SET ? ";
	let ins = {title,startTime,endTime,schedule,amout,position,content,created_at,updated_at,bid};
	let insert = await mysql.query(sql, ins);
	console.log(insert);

};
exports.getQrcode = async (req, res) => {
	let {qrcode} = req.query;

	let quota = await mysql._query("db_net","SELECT id,goods,code FROM t_decorate_erp WHERE code = ?",qrcode);
	if (quota.length) return res.json({qrcode});
	else res.json({qrcode:0});
};
exports.createProject = async (req, res) => {
	let { title, schedule, amount, name, address, latitude, longitude, detailed_address, content, date, qrcode ,distance} = req.query;
	let bid = req.controller.id;

	title		= vr.escape(title);
	name	 	=  vr.escape(name);
	latitude 	=  vr.escape(latitude);
	longitude 	=  vr.escape(longitude);
	content 	= vr.escape(content);
	detailed_address =  vr.escape(detailed_address);

	if (vr.isEmpty(title)) return res.json(11001);
	if (vr.isEmpty(schedule)  || !vr.isInt(schedule,{min:1})) return res.json(11001);
	if (vr.isEmpty(amount) || !vr.isFloat(amount,{min:0.01})) return res.json(11001);
	if (vr.isEmpty(name)) return res.json(11001);
	if (vr.isEmpty(address)) return res.json(11001);
	if (vr.isEmpty(latitude) || !vr.isFloat(latitude)) return res.json(11001);
	if (vr.isEmpty(longitude) || !vr.isFloat(longitude)) return res.json(11001);
	if (vr.isEmpty(detailed_address)) return res.json(11001);
	if (vr.isEmpty(date) || !vr.isNumeric(date)) return res.json(11001);
	if (vr.isEmpty(distance) || !vr.isInt(distance,{min:0.01})) return res.json(11001);

	let quota = await mysql._query("db_net","SELECT id,goods FROM t_decorate_erp WHERE code = ?",qrcode);
	if (!quota.length) return res.json(11001);

	let endTime = parseInt(date) + parseInt(schedule)*86400;
	let created_at = updated_at = Date.now() / 1000 |0;

	let sql = "INSERT INTO t_projects SET ? ";
	let ins = {title, schedule, amount, name, address, latitude, longitude, detailed_address, content, startTime:date, endTime ,distance, bid, created_at, updated_at, qrcode};
	let insert = await mysql.query(sql, ins);
	let {insertId} = insert;

	let result = await fs.writeFile("file/json/project_"+insertId+".json", quota[0].goods);

	if (result) return res.json({id:insertId});

};
exports.getProject = async (req, res) => {
	let {id} = req.query;

	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);

	let result = await mysql.query("SELECT id,title FROM t_projects WHERE id = ?",id);
	if (result.length) return res.json(result[0]);
	else res.json(22001);
};
exports.getProjectsList = async (req, res) => {
	let {by} = req.query;
	let bid = req.controller.id;
	let now = Date.now() / 1000 |0;
	if (by < 0 || by > 4) return res.json(11001);

	let onList = await mysql.query("SELECT id, title, startTime, endTime, schedule FROM t_projects WHERE bid = ? and startTime < ? and endTime > ?",[bid, now, now]);
	let willList = await mysql.query("SELECT id, title, startTime, endTime, schedule FROM t_projects WHERE bid = ? and startTime >= ?",[bid, now]);
	let endList = await mysql.query("SELECT id, title, startTime, endTime, schedule FROM t_projects WHERE bid = ?  and endTime <= ?",[bid, now]);
	return res.json({onList, willList, endList});
};
exports.getProjectInfo = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let info = await mysql.query("SELECT * FROM t_projects WHERE id = ?",id);
	let sql = "SELECT a.id, a.pid, a.state, b.nickname, b.type_id FROM t_projects_user AS a LEFT JOIN p_user AS b ON a.bid = b.id LEFT JOIN t_projects AS c ON a.pid = c.id WHERE a.pid = ? and c.bid = ?";
	let user = await mysql.query( sql, [id,bid]);

	let goods = await fs.readFile("file/json/project_"+id+".json");
	return res.json({info: info[0], goods: JSON.parse(goods), user});
};
exports.getProjectGoods = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);

	let goods = await fs.readFile("file/json/project_"+id+".json");
	goods = JSON.parse(goods);
	return res.json(goods);
};
exports.confirm = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let sql = "SELECT a.* FROM t_projects_user AS a LEFT JOIN t_projects AS b ON a.pid = b.id WHERE a.id = ? and b.bid = ?";
	let user = await mysql.query( sql, [id,bid]);
	if (!user.length) return res.json(11001);

	let state = 1;
	await mysql.query("UPDATE t_projects_user SET ? WHERE ?", [{state},{id}]);
	return res.json(1);
};
exports.delUser = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let sql = "SELECT a.* FROM t_projects_user AS a LEFT JOIN t_projects AS b ON a.pid = b.id WHERE a.id = ? and b.bid = ?";
	let user = await mysql.query( sql, [id,bid]);
	if (!user.length) return res.json(11001);

	await mysql.query("DELETE FROM t_projects_user WHERE id = ?", id);
	return res.json(1);
};

//获取项目留言列表
exports.getTalkList = async (req, res) => {
	let {by} = req.query;
	let bid = req.controller.id;
	let now = Date.now() / 1000 |0;
	if (by < 0 || by > 4) return res.json(11001);

	let sql = "SELECT b.id,b.title, b.startTime, b.endTime, b.schedule, c.count FROM t_projects as b  LEFT JOIN ( SELECT id, pid, uid, count(pid) as count from t_projects_talk where 1 group by pid ) AS c on b.id = c.pid WHERE";
	let onList = await mysql.query( sql + " b.bid = ? and b.startTime < ? and b.endTime > ?",[bid, now, now]);
	let willList = await mysql.query( sql + " b.bid = ? and b.startTime >= ?",[bid, now]);
	let endList = await mysql.query( sql + " b.bid = ?  and b.endTime <= ?",[bid, now]);

	return res.json({onList, willList, endList});
};
exports.getTalks = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let sql = "SELECT a.uid, a.type, a.value, a.created_at, b.realname, b.type_id  FROM t_projects_talk AS a LEFT JOIN p_user AS b ON a.uid = b.id WHERE  a.pid = ? order by a.created_at desc";
	let content = await mysql.query( sql, id);

	return res.json({content, id: bid});
};
exports.sendTalkText = async (req, res) => {
	let {id, value} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;
	let created_at = Date.now() / 1000 |0;

	let data = {pid: id, uid: bid, created_at, value, type: 1};
	await mysql.query("INSERT INTO t_projects_talk SET ?", data);

	return res.json(1);
};
exports.sendTalkImg = async (req, res) => {
	let bid = req.controller.id;
	let created_at = Date.now() / 1000 |0;

	//接收图片
	let img = await form.parseOne(req);
	if(img.error) {
		console.log(111);
		res.send({error: 1});
		res.end();
	}
	else {
		await fs.rename(img.uploadedPath, './upload/talk/' + img.newFilename);
		let { id } = img.fields;
		console.log(id);

		let data = {pid: id, uid: bid, created_at, value: img.newFilename, type: 2};
		await mysql.query("INSERT INTO t_projects_talk SET ?", data);

		res.send({success: 1});
		//res.writeHead(200, {'content-type': 'text/plain;charset=utf-8'});
		res.end();
	}
};

