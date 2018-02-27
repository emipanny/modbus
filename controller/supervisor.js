
const uuid = require('node-uuid');
const vr = require("validator");
const {fs, mysql, comment, redis, WXBizDataCrypt, form}=require("../conf");
const https = require('https');
const config = require("../conf/config");

exports.getHome = async (req, res) => {
	let now = Date.now() / 1000 |0;
	let bid = req.controller.id;

	let sql = "SELECT a.id, c.count FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id LEFT JOIN ( SELECT id, pid, uid, count(pid) as count FROM t_projects_talk WHERE 1 GROUP BY pid ) AS c on b.id = c.pid WHERE";
	let on = await mysql.query( sql + " b.startTime < ? and b.endTime > ? and a.bid = ?",[now,now,bid]);
	let will = await mysql.query( sql + " b.startTime >= ? and a.bid = ?",[now,bid]);
	let end = await mysql.query(sql + " b.endTime <= ? and a.bid = ?",[now,bid]);

	return res.json({on, will, end});
};
exports.getProjectsList = async (req, res) => {
	let {by} = req.query;
	let bid = req.controller.id;
	let now = Date.now() / 1000 |0;
	if (by < 0 || by > 4) return res.json(11001);
	console.log(by);

	let sql = "SELECT b.id,b.title, b.startTime, b.endTime, b.schedule, a.state  FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id WHERE";
	let onList = await mysql.query( sql + " a.bid = ? and b.startTime < ? and b.endTime > ?",[bid, now, now]);
	let willList = await mysql.query( sql + " a.bid = ? and b.startTime >= ?",[bid, now]);
	let endList = await mysql.query( sql + " a.bid = ?  and b.endTime <= ?",[bid, now]);
	return res.json({onList, willList, endList});
};
exports.getProjectInfo = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let sql = "SELECT b.*  FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id WHERE";
	let info = await mysql.query( sql + " a.pid = ? and a.bid = ?",[id,bid]);
	if(!info.length) return res.json(11001);
	return res.json({info: info[0]});
};
exports.getPreview = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let sql = "SELECT b.*  FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id WHERE";
	let info = await mysql.query( sql + " a.pid = ? and a.bid = ? and b.state = 2",[id,bid]);
	if(!info.length) return res.json(11001);
	let goods = await fs.readFile("file/json/project_"+id+".json");
	goods = JSON.parse(goods);
	let stage = await mysql._query("db_new","SELECT id,title FROM t_product_stage WHERE father = 284 order by id asc");
	if(!stage.length) return res.json(11001);

	for (let i = 0; i < stage.length; i++) {
		let quota = await mysql.query("SELECT id, goodsNo, title, num, unit, part, start_time, end_time, order_number FROM t_projects_quota WHERE part = ? and pid = ? order by start_time asc", [stage[i].title, id]);
		let material = await mysql.query("SELECT id, goodsNo, title, num, unit, part, time FROM t_projects_material WHERE part = ? and pid = ? order by time asc", [stage[i].title, id]);
		stage[i].quota = quota;
		stage[i].material = material;
	};
	for (var i = 0; i < stage.length; i++) {
		let quota = stage[i].quota;
		if (quota.length){
			quota.sort(comment.compareAsc("start_time"));
			let start_time = quota[0].start_time;
			quota.sort(comment.compareDesc("end_time"));
			let end_time = quota[0].end_time;
			stage[i].start_time = start_time;
			stage[i].end_time = end_time;
		}
	};
	return res.json({stage});
};
//获取单个定额信息
exports.checkQuota = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let sql_quota = "SELECT id, goodsNo, title, num, unit, start_time, end_time, supervisor_start, supervisor_start_finish, supervisor_end, supervisor_end_finish, designer_start, designer_start_finish, designer_end, designer_end_finish, state FROM t_projects_quota";
	let quota = await mysql.query(sql_quota + " WHERE id = ?", id);
	if(!quota.length) return res.json(11001);

	return res.json(quota[0]);
};
//获取单个材料信息
exports.checkMaterial = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let sql_material = "SELECT id, pid, goodsNo, title, num, unit, time, arrive, state FROM t_projects_material";
	let material = await mysql.query(sql_material + " WHERE id = ?", id);
	if(!material.length) return res.json(11001);

	let purchase = await mysql.query("SELECT b.id, b.nickname, b.realname, b.phone FROM t_projects_quota_user as a LEFT JOIN p_user as b ON a.uid = b.id WHERE a.mid = ?", id);

	return res.json({material: material[0], purchase});
};
exports.getProjectsListOn = async (req, res) => {
	let {by} = req.query;
	let bid = req.controller.id;
	let now = Date.now() / 1000 |0;
	if (by < 0 || by > 4) return res.json(11001);

	let sql = "SELECT a.id, a.pid, b.title, b.startTime, b.endTime, b.schedule  FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id WHERE";
	let onList = await mysql.query( sql + " a.bid = ? and b.startTime < ? and b.endTime > ?",[bid, now, now]);

	let date = comment.formatUnixToDate(now);
	date =  comment.formatDateUnix(date);
	for (let key in onList) {
		let sign = await mysql.query("SELECT id, time FROM t_sign WHERE pid=? and time > ? and time < ?", [ onList[key].id, date, date + 86400]);
		onList[key].sign = sign;
	};
	return res.json(onList);
};
exports.sign = async (req, res) => {
	let {id} = req.query;
	let lat1 = req.query.latitude;
	let lng1 = req.query.longitude;
	let bid = req.controller.id;

	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	if (vr.isEmpty(lat1) || !vr.isFloat(lat1)) return res.json(11001);
	if (vr.isEmpty(lng1) || !vr.isFloat(lng1)) return res.json(11001);

	let sql = "SELECT b.latitude, b.longitude, b.distance  FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id WHERE";
	let info = await mysql.query( sql + " a.id = ? and a.bid = ?",[id,bid]);
	if(!info.length) return res.json(11001);

	let lat2 = info[0].latitude;
	let lng2 = info[0].longitude;
	let {distance} = info[0];

	let c = comment.GetDistance( lat1, lng1, lat2, lng2);
	if (c <= distance) {
		let time = Date.now() / 1000 |0;

		let sql = "INSERT INTO t_sign SET ? ";
		let ins = {uid: bid, pid: id, time};
		await mysql.query(sql, ins);
		return res.json({success: 1, time});
	}
	else return res.json({errcode:1})
};
//获取今天待办事项
exports.getToday = async (req, res) => {
	let bid = req.controller.id;
	let now = Date.now() / 1000 |0;
	let date = comment.formatUnixToDate(now);
	date = comment.formatTimeUnix(date);
	let sql = ("SELECT b.id, b.title FROM t_projects_user AS a LEFT JOIN t_projects AS b ON a.pid = b.id WHERE a.bid = ? AND b.startTime < ? AND b.endTime > ?");
	let projects = await mysql.query(sql, [bid, now, now]);

	for (let i = 0; i < projects.length; i++) {
		let quota_sql = "SELECT id, title, num, unit, start_time, end_time, supervisor_start, supervisor_end, designer_start, designer_end, state FROM t_projects_quota WHERE pid = ? AND start_time <= ? AND end_time >= ?";
		let quota = await mysql.query(quota_sql, [projects[i].id, date, date + 86400]);
		projects[i].quota = quota;
	}
	return res.json({projects});
};
//监理完成交低
exports.updateQuotaStartState = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let quota = await mysql.query("SELECT * FROM t_projects_quota WHERE id = ?", id);
	if(!quota.length) return res.json(11001);

	let porject = await mysql.query("SELECT id, startTime, endTime FROM t_projects WHERE id = ?", quota[0].pid);
	if(!porject.length) return res.json(11001);
	//判断该用户是否可以修改状态
	let user = await mysql.query("SELECT * FROM t_projects_user WHERE bid = ? and pid = ?",[bid, quota[0].pid]);
	if(!user.length) return res.json(11001);

	let supervisor_start_finish = Date.now() / 1000 |0;
	let data = {supervisor_start_finish};
	await mysql.query("UPDATE t_projects_quota SET ? WHERE ?", [data, {id}]);
	return res.json({supervisor_start_finish});
};
//监理完成验收
exports.updateQuotaEndState = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let quota = await mysql.query("SELECT * FROM t_projects_quota WHERE id = ?", id);
	if(!quota.length) return res.json(11001);

	let porject = await mysql.query("SELECT id, startTime, endTime FROM t_projects WHERE id = ?", quota[0].pid);
	if(!porject.length) return res.json(11001);
	//判断该用户是否可以修改状态
	let user = await mysql.query("SELECT * FROM t_projects_user WHERE bid = ? and pid = ?",[bid, quota[0].pid]);
	if(!user.length) return res.json(11001);

	let supervisor_end_finish = Date.now() / 1000 |0;
	let data = {supervisor_end_finish};
	await mysql.query("UPDATE t_projects_quota SET ? WHERE ?", [data, {id}]);
	return res.json({supervisor_end_finish});
};
//监理完成项目
exports.updateQuotaState = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let quota = await mysql.query("SELECT * FROM t_projects_quota WHERE id = ?", id);
	if(!quota.length) return res.json(11001);

	let porject = await mysql.query("SELECT id, startTime, endTime FROM t_projects WHERE id = ?", quota[0].pid);
	if(!porject.length) return res.json(11001);
	//判断该用户是否可以修改状态
	let user = await mysql.query("SELECT * FROM t_projects_user WHERE bid = ? and pid = ?",[bid, quota[0].pid]);
	if(!user.length) return res.json(11001);

	let updated_at = Date.now() / 1000 |0;
	let data = {state: 1, updated_at};
	await mysql.query("UPDATE t_projects_quota SET ? WHERE ?", [data, {id}]);
	return res.json(1);
};
//获取项目留言列表
exports.getTalkList = async (req, res) => {
	let {by} = req.query;
	let bid = req.controller.id;
	let now = Date.now() / 1000 |0;
	if (by < 0 || by > 4) return res.json(11001);

	let sql = "SELECT b.id,b.title, b.startTime, b.endTime, b.schedule, a.state, c.count FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id left join ( SELECT id, pid, uid, count(pid) as count from t_projects_talk where 1 group by pid ) AS c on b.id = c.pid WHERE";
	let onList = await mysql.query( sql + " a.bid = ? and b.startTime < ? and b.endTime > ?",[bid, now, now]);
	let willList = await mysql.query( sql + " a.bid = ? and b.startTime >= ?",[bid, now]);
	let endList = await mysql.query( sql + " a.bid = ?  and b.endTime <= ?",[bid, now]);

	return res.json({onList, willList, endList});
};
exports.getTalks = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let sql = "SELECT a.uid, a.type, a.value, a.created_at, a.id, b.realname, b.type_id  FROM t_projects_talk AS a LEFT JOIN p_user AS b ON a.uid = b.id WHERE  a.pid = ? order by a.created_at desc";
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
