const {redis,mysql}=require("../conf");
const {config}=require("../conf");
exports.getSessionKey = async (req, res, next) => {
	try{
		let result = await redis.get(req.headers.sessionid);
		if (!result) return res.json(11003);
		let {openid} = JSON.parse(result);
		req.openid = openid;
		let user = await mysql.query("SELECT id,openid,type_id FROM p_user where openid = ?", openid);
		if (!user.length) return res.json(11001);
		req.controller = user[0];
		if (result) next();

	}
	catch (err){
		console.log(err);
		res.json(11002);
	}

};
exports.checkRights = async (req, res, next) => {

	try{
		let user = req.controller;
		let {type_id} = user;
		let path = req.path.split("/");
		let controller = Array();
		console.log(path);
		for (var i = 0; i < path.length; i++) {
			if (path[i]) controller[controller.length] = path[i];
		};
		if (config.rights[type_id] == controller[0]) next();
		else res.json(11001);
	}
	catch (err){
		console.log(err);
		res.json(11002);
	}

};