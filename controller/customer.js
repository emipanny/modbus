
const uuid = require('node-uuid');
const vr = require("validator");
const {fs, mysql, comment, redis, WXBizDataCrypt, form}=require("../conf");
const https = require('https');
const config = require("../conf/config");
//获取项目列表
exports.getHome = async (req, res) => {
	let now = Date.now() / 1000 |0;
	let bid = req.controller.id;

	let sql = "SELECT b.id, b.title, b.startTime, b.endTime, c.count FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id LEFT JOIN ( SELECT id, pid, uid, count(pid) as count FROM t_projects_talk WHERE 1 GROUP BY pid ) AS c on b.id = c.pid WHERE";
	let list = await mysql.query( sql + " a.bid = ? order by b.endTime DESC", bid);

	return res.json({list});
};
//根据日期查看工期内容
exports.check = async (req, res) => {
	let {id, time} = req.query;
	let bid = req.controller.id;
	let sql = ("SELECT b.id, b.title, b.startTime, b.endTime FROM t_projects_user AS a LEFT JOIN t_projects AS b ON a.pid = b.id WHERE a.bid = ? and b.id = ?");
	let project = await mysql.query(sql, [bid, id]);
	if(!project.length) return res.json(11001);

	let quota_sql = "SELECT id, title, num, unit, start_time, end_time, supervisor_start, supervisor_end, designer_start, designer_end, state FROM t_projects_quota WHERE pid = ? AND start_time <= ? AND end_time >= ?";
	let quota = await mysql.query(quota_sql, [id, time, Number(time) + 86400]);
	let material = await mysql.query("SELECT id, title, num, unit, time, state FROM t_projects_material WHERE pid = ? AND time >= ? AND time < ?", [id, time, Number(time) + 86400]);
	for (let j = 0; j < material.length; j++) {
		let users = await mysql.query( "SELECT b.id, b.nickname, b.realname, b.phone  FROM t_projects_quota_user as a LEFT JOIN p_user as b ON a.uid = b.id WHERE a.mid = ?",material[j].id);
		material[j].users = users;
	}

	return res.json({project, quota, material});
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
	await fs.rename(img.uploadedPath, './upload/talk/' + img.newFilename);
	let { id } = img.fields;
	console.log(id);

	let data = {pid: id, uid: bid, created_at, value: img.newFilename, type: 2};
	await mysql.query("INSERT INTO t_projects_talk SET ?", data);

	res.send({success: 1});
	//res.writeHead(200, {'content-type': 'text/plain;charset=utf-8'});
	res.end();
};