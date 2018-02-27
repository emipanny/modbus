
const https = require('https');
const iconv = require("iconv-lite");
const {fs}=require("../conf");
const config = require("../conf/config");

exports.checkLogin = (session) => new Promise((resolve, reject) => {

	session ? reject(err) : resolve(result);
})

exports.https = (tourl) => new Promise((resolve, reject) => {
	https.get(tourl, (res) => {

		var datas = [];
		var size = 0;
		res.on('data', (d) => {
            datas.push(d);
            size += d.length;

		});
        res.on("end", function () {
            var buff = Buffer.concat(datas, size);
            var result = iconv.decode(buff, "utf8");
            resolve(result);
        });

	}).on('error', (e) => {
	  reject(e);
	});
})
exports.GetDistance = (lat1, lng1, lat2, lng2) =>{
  var radLat1 = Rad(lat1);
  var radLat2 = Rad(lat2);
  var a = radLat1 - radLat2;
  var b = Rad(lng1) - Rad(lng2);
  var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
  s = s * 6378.137;// EARTH_RADIUS;
  //s = Math.round(s * 10000) / 10000; //输出为公里
  s = Math.round(s * 1000) ; //输出为米
  //s=s.toFixed(4);
  return s;
}
function Rad(d){
  return d * Math.PI / 180.0;//经纬度转换成三角函数中度分表形式。
}

exports.formatTime = (date) => {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}
exports.formatDate = (date) => {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()



  return [year, month, day].map(formatNumber).join('-')
}
exports.formatDateUnix = (date) => {
  date = date + " 00:00:00";
  date = Date.parse(new Date(date)) / 1000;
  return date;
}
exports.formatTimeUnix = (date) => {
  date = Date.parse(new Date(date)) / 1000;
  return date;
}
exports.formatUnixToDate = (date) => {
  date = new Date(date * 1000).toLocaleString("zh");
  date = date.split(" ");
  return date[0];
}
exports.formatUnixToTime = (date) => {
  date = new Date(date * 1000).toLocaleString("zh", { hour12:false});
  date = date.split(" ");
  return date[1];
}
exports.formatUnixToDT = (date) => {
  date = new Date(date * 1000).toLocaleString("zh", { hour12: false });
  return date;
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}
exports.sortAsc = (a,b) => {
  return a - b
}
exports.sortDesc = (a,b) => {
  return b - a
}

exports.compareAsc = (property) => {
  return  (a, b) => {
    var value1 = a[property];
    var value2 = b[property];
    return value1 - value2;
  }
}
exports.compareDesc = (property) => {
  return  (a, b) => {
    var value1 = a[property];
    var value2 = b[property];
    return value2 - value1;
  }
}


 