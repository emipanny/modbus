
const express = require('express');
const router = express.Router();
const {awaitmysql,comment} = require("../conf");
const {getSession,getError} = require("../middleware");

//用户
const home = require("./home");

router.get('/' , getError._(home.index) );


module.exports = router;
