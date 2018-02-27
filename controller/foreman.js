
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

	return res.json({on: on, will: will, end: end});
};
exports.getProject = async (req, res) => {
	let {id} = req.query;

	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);

	let sql = "SELECT a.pid as id,b.title FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id WHERE";
	let result = await mysql.query( sql + " a.pid = ?",id);
	if (result.length) return res.json(result[0]);
	else res.json(22001);
};
exports.getProjectsList = async (req, res) => {
	let {by} = req.query;
	let bid = req.controller.id;
	let now = Date.now() / 1000 |0;
	if (by < 0 || by > 4) return res.json(11001);

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
	let goods = await fs.readFile("file/json/project_"+id+".json");
	return res.json({info: info[0], goods: JSON.parse(goods)});
};
exports.getProjectGoods = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let sql = "SELECT b.*  FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id WHERE";
	let info = await mysql.query( sql + " a.pid = ? and a.bid = ?",[id,bid]);
	if(!info.length) return res.json(11001);
	let goods = await fs.readFile("file/json/project_"+id+".json");
	goods = JSON.parse(goods);

	return res.json(goods);
};
exports.getProjectStage = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let sql = "SELECT b.*  FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id WHERE";
	let info = await mysql.query( sql + " a.pid = ? and a.bid = ?",[id,bid]);
	if(!info.length) return res.json(11001);
	let goods = await fs.readFile("file/json/project_"+id+".json");
	goods = JSON.parse(goods);

	let stage = await mysql._query("db_new","SELECT id,title FROM t_product_stage WHERE father = 284 order by id asc");
	let quota = await mysql.query("SELECT id, goodsNo, order_number FROM t_projects_quota WHERE pid = ?", id);
	//let quota = Array();
	let mate = await mysql.query("SELECT id, goodsNo FROM t_projects_material WHERE pid = ?", id);
	//console.log(goods);
	return res.json({goods, stage, quota, mate});
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
exports.getUsers = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let sql = "SELECT b.*  FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id WHERE";
	let info = await mysql.query( sql + " a.pid = ? and a.bid = ?",[id,bid]);
	if(!info.length) return res.json(11001);

	let users = await mysql.query( "SELECT b.id, b.nickname, b.realname, b.phone  FROM t_projects_purchase as a LEFT JOIN p_user as b ON a.uid = b.id WHERE a.pid = ?",id);

	return res.json({users});
};
exports.save = async (req, res) => {
	let { id, quota, material, build, soft, start_time, end_time, supervisor_start, supervisor_end, designer_start, designer_end} = req.query;
	let bid = req.controller.id;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	quota = JSON.parse(quota);
	material = JSON.parse(material);
	build = JSON.parse(build);
	soft = JSON.parse(soft);
	let list = Array();
	list[0] = material;
	list[1] = build;
	list[2] = soft;

	let sql = "SELECT b.*  FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id WHERE";
	let info = await mysql.query( sql + " a.pid = ? and a.bid = ?",[id,bid]);
	let created_at = updated_at = Date.now() / 1000 |0;
	if(!info.length) return res.json(11001);

	let client = await mysql.connect();
	await client.beginTransaction();

	try{
		await client.query("UPDATE t_projects SET state = ? WHERE ?", [1,{id}]);
		let quota2 = {pid: id, goodsNo: quota.goodsNo, title: quota.title, num: quota.num, unit: quota.unit, type: quota.type, part: quota.part, start_time, end_time: Number(end_time) + 86400, created_at, updated_at, order_number: quota.order, supervisor_start, supervisor_end, designer_start, designer_end};
		let quota_add =  await client.query("INSERT INTO t_projects_quota SET ? ", quota2);

		for(let x = 0; x < list.length; x++){
			for(let i = 0; i < list[x].length; i++){
				let time = comment.formatTimeUnix(list[x][i].date + " "+ list[x][i].time);
				let data = {pid: id, qid: quota_add.insertId, goodsNo: list[x][i].goodsNo, title: list[x][i].title, num: list[x][i].num, unit: list[x][i].unit, type: list[x][i].type, part:list[x][i].part, time, created_at, updated_at}
				let mate_add =  await client.query("INSERT INTO t_projects_material SET ? ", data);
				if (list[x][i].user) {
					for (let j = 0; j < list[x][i].user.length; j++){
						let user = {mid: mate_add.insertId, uid: list[x][i].user[j].id};
						await client.query("INSERT INTO t_projects_quota_user SET ? ", user);
					}
				}
			}
		}
		await client.commit();
		return res.json(1);
	}
	catch(err){
		console.log(err);
		await client.rollback();
		return res.json(11001);
	}
};
exports.changeProjectState = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let sql = "SELECT b.*  FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id WHERE";
	let info = await mysql.query( sql + " a.pid = ? and a.bid = ?",[id,bid]);
	if(!info.length) return res.json(11001);

	await mysql.query("UPDATE t_projects SET state = ? WHERE ?", [2,{id}]);

	return res.json(1);
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
exports.checkREP = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let sql = "SELECT b.*  FROM t_projects_user as a LEFT JOIN t_projects as b ON a.pid = b.id WHERE";
	let info = await mysql.query( sql + " a.pid = ? and a.bid = ? and b.state = 2",[id,bid]);
	if(!info.length) return res.json(11001);
	let stage = await mysql._query("db_new","SELECT id,title FROM t_product_stage WHERE father = 284 order by id asc");
	if(!stage.length) return res.json(11001);

	for (let i = 0; i < stage.length; i++) {
		let quota = await mysql.query("SELECT id, goodsNo, title, num, consumption, start_time, end_time FROM t_projects_quota WHERE part = ? and pid = ? order by start_time asc", [stage[i].title, id]);
		stage[i].quota = quota;
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

	let sql_quota = "SELECT id, goodsNo, title, num, consumption, unit, start_time, end_time, supervisor_start, supervisor_start_finish, supervisor_end, supervisor_end_finish, designer_start, designer_start_finish, designer_end, designer_end_finish, state FROM t_projects_quota";
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

	let purchase = await mysql.query("SELECT id, uid FROM t_projects_quota_user WHERE mid = ?", id);
	let users = await mysql.query( "SELECT b.id, b.nickname, b.realname, b.phone  FROM t_projects_purchase as a LEFT JOIN p_user as b ON a.uid = b.id WHERE a.pid = ?", material[0].pid);

	return res.json({material: material[0], purchase, users});
};
//更改定额
exports.editQuota = async (req, res) => {
	let {id, info} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let quota = await mysql.query("SELECT id, pid FROM t_projects_quota WHERE id = ?", id);
	if(!quota.length) return res.json(11001);

	let porject = await mysql.query("SELECT id, startTime, endTime FROM t_projects WHERE id = ?", quota[0].pid);
	if(!porject.length) return res.json(11001);

	let now = Date.now() / 1000 |0;
	//判断时间，未开始的项目允许修改
	if (porject[0].startTime > now) {
		info = JSON.parse(info);
		let supervisor_start = comment.formatTimeUnix(info.supervisor_start_date + " "+ info.supervisor_start_time);
		let supervisor_end = comment.formatTimeUnix(info.supervisor_end_date + " "+ info.supervisor_end_time);
		let designer_start = comment.formatTimeUnix(info.designer_start_date + " "+ info.designer_start_time);
		let designer_end = comment.formatTimeUnix(info.designer_end_date + " "+ info.designer_end_time);
		let start_time = comment.formatDateUnix(info.start_time);
		let end_time = comment.formatDateUnix(info.end_time);
		end_time = Number(end_time) + 86400;
		let data = {supervisor_start, supervisor_end, designer_start, designer_end, start_time, end_time, updated_at: now};
		await mysql.query("UPDATE t_projects_quota SET ? WHERE ?", [data,{id}]);
		return res.json(1);
	}
	else {
		return res.json(22001);
	}
};
//更改材料
exports.editMaterial = async (req, res) => {
	let {id, info, purchase} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let material = await mysql.query("SELECT id, pid FROM t_projects_material WHERE id = ?", id);
	if(!material.length) return res.json(11001);

	let porject = await mysql.query("SELECT id, startTime, endTime FROM t_projects WHERE id = ?", material[0].pid);
	if(!porject.length) return res.json(11001);

	let now = Date.now() / 1000 |0;
	//判断时间，未开始的项目允许修改
	if (porject[0].startTime > now) {
		info = JSON.parse(info);
		purchase = JSON.parse(purchase);
		let time = comment.formatTimeUnix(info.date + " "+ info.time);
		let data = {time, updated_at: now};


		let client = await mysql.connect();
		await client.beginTransaction();

		try{
			await client.query("UPDATE t_projects_material SET ? WHERE ?", [data,{id}]);
			await client.query("DELETE FROM t_projects_quota_user WHERE mid = ?", id);

			for(let i = 0; i < purchase.length; i++){
				let data = {mid: id, uid: purchase[i]};
				await client.query("INSERT INTO t_projects_quota_user SET ? ", data);
			}
			await client.commit();
			return res.json(1);
		}
		catch(err){
			console.log(err);
			await client.rollback();
			return res.json(11001);
		}
	}
	else {
		return res.json(22001);
	}
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
		let material = await mysql.query("SELECT id, title, num, unit, time, state FROM t_projects_material WHERE pid = ? AND time >= ? AND time < ?", [projects[i].id, date, date + 86400]);
		for (let j = 0; j < material.length; j++) {
			let users = await mysql.query( "SELECT b.id, b.nickname, b.realname, b.phone  FROM t_projects_quota_user as a LEFT JOIN p_user as b ON a.uid = b.id WHERE a.mid = ?",material[j].id);
			material[j].users = users;
		}
		projects[i].quota = quota;
		projects[i].material = material;
	}
	return res.json({projects});
};

//更改定额状态
exports.updateQuotaState = async (req, res) => {
	let {id, consumption} = req.query;
	if (vr.isEmpty(id) || vr.isEmpty(consumption)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let quota = await mysql.query("SELECT * FROM t_projects_quota WHERE id = ?", id);
	if(!quota.length) return res.json(11001);

	let porject = await mysql.query("SELECT id, startTime, endTime FROM t_projects WHERE id = ?", quota[0].pid);
	if(!porject.length) return res.json(11001);
	//判断该用户是否可以修改状态
	let user = await mysql.query("SELECT * FROM t_projects_user WHERE bid = ? and pid = ?",[bid, quota[0].pid]);
	if(!user.length) return res.json(11001);

	let updated_at = Date.now() / 1000 |0;
	let data = {state: 1, consumption, updated_at};
	await mysql.query("UPDATE t_projects_quota SET ? WHERE ?", [data, {id}]);
	return res.json(1);
};
//更改材料状态
exports.updateMaterialState = async (req, res) => {
	let {id, arrive} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;

	let material = await mysql.query("SELECT * FROM t_projects_material WHERE id = ?", id);
	if(!material.length) return res.json(11001);

	let porject = await mysql.query("SELECT id, startTime, endTime FROM t_projects WHERE id = ?", material[0].pid);
	if(!porject.length) return res.json(11001);
	//判断该用户是否可以修改状态
	let user = await mysql.query("SELECT * FROM t_projects_user WHERE bid = ? and pid = ?",[bid, material[0].pid]);
	if(!user.length) return res.json(11001);

	if(arrive)
	{
		arrive = comment.formatTimeUnix(arrive);
		let updated_at = Date.now() / 1000 |0;
		let data = {state: 1, updated_at, arrive};
		await mysql.query("UPDATE t_projects_material SET ? WHERE ?", [data, {id}]);
		return res.json(1);
	}
	else res.json(11001);
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
//获取留言列表
exports.getTalks = async (req, res) => {
	let {id} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;
	let {type_id, openid} = req.controller.type_id;

	let sql = "SELECT a.uid, a.type, a.value, a.created_at, b.realname, b.type_id  FROM t_projects_talk AS a LEFT JOIN p_user AS b ON a.uid = b.id WHERE  a.pid = ? order by a.created_at desc";
	let content = await mysql.query( sql, id);

	return res.json({content, id: bid, type_id});
};
//发布文字留言
exports.sendTalkText = async (req, res) => {
	let {id, value, formId} = req.query;
	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	let bid = req.controller.id;
	let created_at = Date.now() / 1000 |0;

	let data = {pid: id, uid: bid, created_at, value, type: 1};
	await mysql.query("INSERT INTO t_projects_talk SET ?", data);

	return res.json(1);
};
//发布图片留言
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
exports.webSocket = async (req, res) => {
	console.log(4444);
	var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer({ port: 8181 });
	wss.on('connection', function (ws) {
	    console.log('client connected');
	    ws.on('message', function (message) {
	        console.log(message);
	    });
	});
};
