
const uuid = require('node-uuid');
const vr = require("validator");
const {fs, mysql, comment, redis, WXBizDataCrypt}=require("../conf");
const https = require('https');
const config = require("../conf/config");
//获取项目列表
exports.getHome = async (req, res) => {
	let {time} = req.query;
	let bid = req.controller.id;

	let sql = "SELECT b.id, b.title, b.goodsNo, b.time, b.num, b.unit, b.arrive, b.state, c.detailed_address FROM t_projects_quota_user AS a LEFT JOIN t_projects_material AS b ON a.mid = b.id LEFT JOIN t_projects AS c ON b.pid = c.id WHERE";
	let material = await mysql.query( sql + " a.uid = ? AND time >= ? AND time < ? ORDER BY b.time ASC", [ bid, time, Number(time) + 86400 ]);

	return res.json({material});
};
exports.sign = async (req, res) => {
	let {id} = req.query;
	let lat1 = req.query.latitude;
	let lng1 = req.query.longitude;
	let bid = req.controller.id;

	if (vr.isEmpty(id)  || !vr.isInt(id,{min:1})) return res.json(11001);
	if (vr.isEmpty(lat1) || !vr.isFloat(lat1)) return res.json(11001);
	if (vr.isEmpty(lng1) || !vr.isFloat(lng1)) return res.json(11001);

	let sql = "SELECT b.latitude, b.longitude, b.distance  FROM t_projects_material as a LEFT JOIN t_projects as b ON a.pid = b.id WHERE";
	let info = await mysql.query( sql + " a.id = ? ", id);
	if(!info.length) return res.json(11001);

	let lat2 = info[0].latitude;
	let lng2 = info[0].longitude;
	let {distance} = info[0];

	let c = comment.GetDistance( lat1, lng1, lat2, lng2);
	if (c <= distance) {
		let arrive = Date.now() / 1000 |0;
		let data = {arrive, state: 1}
		await mysql.query("UPDATE t_projects_material SET ? WHERE ?", [data, {id}]);
		return res.json({success: 1, arrive});
	}
	else return res.json({errcode:1})
};
exports.getUser = async (req, res) => {
	let bid = req.controller.id;
	let user = await mysql.query("SELECT id, realname, phone FROM p_user WHERE id = ?", bid);
	if(!user.length) return res.json(11001);
	return res.json(user[0]);
};
exports.updateUser = async (req, res) => {
	let bid = req.controller.id;
	let {realname, phone} = req.query;
	await mysql.query("UPDATE p_user SET ? WHERE id = ?", [{realname, phone}, bid]);
	return res.json({success: 1});
};