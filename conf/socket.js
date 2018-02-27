

// mysql.js
const net = require('net');
const config=require("../conf/config.js");
//const callback;
var socket1 = new net.Socket({
    readable:true,
    writable:true,
    allowHalfOpen:true
});
socket1.connect({
    host: config.socket.host,
    port: config.socket.port
},function(){
	console.log(" server connected");
});
/*
socket1.on("data",reback =>{
	//console.log(this.callback)
	//console.log(reback)
    if(this.callback) this.callback(reback);
    //console.log("recived from server:"+data.toString());
});
exports.cb = (cb) =>{
	this.callback = cb;
	//console.log(this)
}*/
exports.send = (data) => new Promise((resolve, reject) => {
	socket1.write(data);
	console.log(111);
	socket1.on("data",function(reback){
		//console.log(reback);
		return resolve(reback)
	    //console.log("recived from server:"+data.toString());
	});
})
