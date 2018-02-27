
exports.session =  {
	 "secret"				: '12345',
     "name"					: 'testapp',   //这里的name值得是cookie的name，默认cookie的name是：connect.sid
     "cookie"				: {maxAge: 1800000 },  //设置maxAge是80000ms，即80s后session和相应的cookie失效过期
     "resave"				: true,
     "rolling"				: true,
     "saveUninitialized"	: false,//sess
};
exports.db =  {
	  "host"     : 'localhost',
	  "user"     : "root",
	  "password" : "f6j7j8j9",
	  "database" : "xiaochengxu"
};
exports.db_net =  {
	  "host"     : 'localhost',
	  "user"     : "root",
	  "password" : "f6j7j8j9",
	  "database" : "net"
};
exports.db_new =  {
	  "host"     : 'localhost',
	  "user"     : "root",
	  "password" : "f6j7j8j9",
	  "database" : "new"
};
exports.wx = {
	"AppID"		: "wxd3f1aa05e20e3c16",
	"appSecret"	: "f4c78f844936ebbce9c5d30730976333"

}
exports.redis =  {
	  "port"     : '6379',
	  "host"     : "127.0.0.1",
	  "pwd" 	 : "f7j8j9j10"
};
exports.rights =  {
	  "1"     : 'boss',//项目经理
	  "2"     : "foreman",//工长
	  "3"     : "supervisor",//监理
	  "4"     : "designer",//设计
	  "5"     : "customer",//用户
	  "6"     : "purchase"//材料员
};
exports.socket =  {
	  "host"  : '192.168.1.187',
	  "port"  : "502",
};
exports.notice = {
	"id"	:   "mMfFSv_8HJ96CxkAUUg2NrshwJu6ddkFuw0XBG6s3TQ"
}