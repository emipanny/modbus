const net = require('net');
const uuid = require('node-uuid');
const vr = require("validator");
const {fs, socket, comment,WXBizDataCrypt}=require("../conf");
const https = require('https');
const config=require("../conf/config");
const path = require('path');  
const mineType = require('mime-types');  
const iconv = require('iconv-lite');

/*
function ModbusMaster-MakeRequest(devId,funcCode,startAddress,regNum){
	this.devId=0x01;
	this.funcCode=0x03;
	this.startAddress;
	this.regNum;

	this.setFuncCode=function(){

	}


	this.toBuffer=function(){

		return buffer;
	}
}
function ModbusMaster-parseReceivedFrame(Buffer){

}*/

//                文件路径  硬件地址  功能码    起始地址  寄存器数量 内容长度
function modbus({filePath, hardware, funcCode, startAddress, regNum, byteNum, info}) {
 	this.filePath = filePath || "";
 	this.length = 0;
	this.header = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00]);
	this.count = 0;
	this.hardware = hardware || Buffer.from([0x01]);
	this.funcCode = funcCode || Buffer.from([0x10]);
	this.startAddress = startAddress || "";
	this.regNum = regNum || Buffer.alloc(0);
	this.byteNum = byteNum || Buffer.alloc(0);
	this.info = info || Buffer.alloc(0);
	this.infoCode;

	this.getBuf = () =>{
		let byteBufferLength;
		this.byteNum.length ? byteBufferLength = Number(this.byteNum.readUInt8(0).toString()) : byteBufferLength = 0;
		this.infoCode = Buffer.alloc(byteBufferLength);
		this.info.copy(this.infoCode, 0);
		this.count = this.hardware.length + this.funcCode.length
			 		+ this.startAddress.length + this.regNum.length + this.byteNum.length + byteBufferLength;
		let count = this.count;
		this.count = Buffer.from([this.count]);
		let totalLength = count +　this.header.length + this.count.length;
		let buf = Buffer.concat([this.header, this.count, this.hardware, this.funcCode, this.startAddress, 
			this.regNum, this.byteNum, this.infoCode], totalLength);
		//console.log(buf.length);
		return buf;

 
	}
}
function getFile({buf, sendbuf}){
	this.buf = buf;
	this.sendbuf = sendbuf;
	this.fileInfoArray = [];
	this.count = 0;
	this.len = 0;

	this.getCount = () => {
		let { buf } = this;
		let low = buf.slice(9,11)
		let height = buf.slice(11)
		let len = Buffer.concat([height, low]);
		len = len.toString("hex");
		this.len = parseInt(len,16);
		this.count =  Math.ceil( this.len / (123 *2) );
		console.log("count", this.count)
	}
	this.getfileInfo = async () => {
		for (let i = 0; i < this.count; i++) {
			let reFileInfo = await socket.send(this.sendbuf);
			//console.log(reFileInfo);
			reFileInfo = reFileInfo.slice(9);
			this.fileInfoArray.push(reFileInfo);
		}
		let fileInfo = Buffer.concat(this.fileInfoArray, 123 * 2 * this.count);

		console.log(fileInfo.length);
		fileInfo = fileInfo.slice(0, this.len);
		//console.log(fileInfo);
		console.log("filelength", fileInfo.length)
		let str=iconv.decode(fileInfo,'gb2312');
		let time = Date.now() / 1000 |0;
		let filename = "./upload/temp/" + time + ".txt";
		await fs.writeFile(filename, str);
	}
}

exports.index = async (req, res) => {
	//let path = "/JSON/ShowCfg.TXT";
	let path = "/JSON/DAT00001.BIN";
	//写入文件名

	let ms2 = new modbus({
		startAddress: Buffer.from([0xf4, 0x02]), 
		regNum: Buffer.from([0x00, 0xc8]),
		byteNum: Buffer.from([0x90]),
		info: Buffer.from(path)
	});
	let buf2 = ms2.getBuf();
	console.log(buf2);
	let str = buf2.toString("hex");
	let str2 = "";
	for (var i = 1 ; i <= str.length; i++) {
		 i % 2 ? str2 += " " + str[i-1] : str2 += str[i-1];
	}
	console.log(str2);
	let reback2 = await socket.send(buf2);

	//获取文件长度
	
	let ms = new modbus({
		funcCode: Buffer.from([0x03]), 
		startAddress: Buffer.from([0xf4, 0x00]), 
		regNum: Buffer.from([0x00, 0x02]),
	});
	let buf3 = ms.getBuf();
	let str3 = buf3.toString("hex");
	let str4 = "";
	for (var i = 1 ; i <= str3.length; i++) {
		 i % 2 ? str4 += " " + str3[i-1] : str4 += str3[i-1];
	}
	console.log(str4);
	let reback = await socket.send(buf3);
	console.log("2",reback)
	//console.log(reback);
	//获取文件内容

	ms.funcCode = Buffer.from([0x03]);
	ms.startAddress = Buffer.from([0xf4, 0x82]);
	ms.regNum = Buffer.from([0x00, 0x7b]);
	let buf4 = ms.getBuf();

	let gf = new getFile({
		buf:reback,
		sendbuf: buf4
	})
	gf.getCount();
	gf.getfileInfo();
	//写入文件名
	/*
	let ms2 = new modbus({
		startAddress: Buffer.from([0xf4, 0x02]), 
		regNum: Buffer.from([0x00, 0xc8]),
		byteNum: Buffer.from([0x90]),
		info: Buffer.from(path)
	});
	let buf2 = ms2.getBuf();
	socket.cb((data) => {
		recv(data, getfilelength);
	});
	let reback2 = socket.send(buf2);*/
	//console.log(reback2);
	//console.log(buf2)
	//获取文件长度
	/*
	let ms3 = new modbus({
		funcCode: Buffer.from([0x03]), 
		startAddress: Buffer.from([0xf4, 0x00]), 
		regNum: Buffer.from([0x00, 0x02]),
	});
	let buf3 = ms3.getBuf();
	let reback3 = await socket.send(buf3);
	console.log(reback3);
	//获取文件内容
	
	let ms = new modbus({
		funcCode: Buffer.from([0x03]), 
		startAddress: Buffer.from([0xf4, 0x00]), 
		regNum: Buffer.from([0x00, 0x02]),
	});
	let buf = ms.getBuf();
	let reback = await socket.send(buf);
	console.log(reback)
	let low = reback.slice(9,11)
	let height = reback.slice(11)
	let len = Buffer.concat([height, low]);
	console.log(len)
	len = len.toString("hex");
	len = parseInt(len,16);
	let backnum =  Math.ceil( len / (123 *2) ); 
	console.log(len);
	let fileInfoArray = [];
	ms.funcCode = Buffer.from([0x03]);
	ms.startAddress = Buffer.from([0xf4, 0x82]);
	ms.regNum = Buffer.from([0x00, 0x7b]);
	let buf4 = ms.getBuf();
	console.log(buf4);
	//console.log(backnum);
	for (let i = 0; i < backnum; i++) {
		let reFileInfo = await socket.send(buf4);
		//console.log(reFileInfo);
		reFileInfo = reFileInfo.slice(9);
		fileInfoArray.push(reFileInfo);
	}
	let fileInfo = Buffer.concat( fileInfoArray, 123 * 2 * backnum);
	console.log(fileInfo.length);
	fileInfo = fileInfo.toString("utf8");
	console.log(fileInfo);

	let now = Date.now() / 1000 |0;
	await fs.writeFile("./upload/temp/" + now + ".json", fileInfo);
*/
	res.render('index', { title: "成功" });

};
recv = (data, next) => {
	console.log("recv", this)
	console.log(data);
	next(data);
}
getfilelength = (data) => {
	let ms = new modbus({
		funcCode: Buffer.from([0x03]), 
		startAddress: Buffer.from([0xf4, 0x00]), 
		regNum: Buffer.from([0x00, 0x02]),
	});
	let buf = ms.getBuf();
	socket.cb((reback) => {

		let low = reback.slice(9,11)
		let height = reback.slice(11)
		let len = Buffer.concat([height, low]);
		console.log(len)
		len = len.toString("hex");
		len = parseInt(len,16);
		let backnum =  Math.ceil( len / (123 *2) ); 
		console.log(len);
		this.len = len;
		let fileInfoArray = [];
		ms.funcCode = Buffer.from([0x03]);
		ms.startAddress = Buffer.from([0xf4, 0x82]);
		ms.regNum = Buffer.from([0x00, 0x7b]);
		let buf4 = ms.getBuf();
		console.log(buf4);
		//console.log(backnum);
		this.fileInfo = Buffer.alloc( backnum * 123 * 2);
		getfileInfo(buf4, backnum, 1);
	});
	socket.send(buf);
}
const fileInfos = [];
getfileInfo = async (data, max, now) => {
	if (now == 1) fileInfos.splice(0, fileInfos.length);
	//console.log(now);
	//console.log(max);
	if (max >= now){
		socket.cb((reback) => {
			//console.log(reback.length);
			//fs.writeFile("./upload/temp/" + now + ".json", reback);
			reback = reback.slice(9);
			fileInfos.push(reback);
			getfileInfo(data, max, now+1);
		});
		socket.send(data);
	}
	else if(max < now){
		let time = Date.now() / 1000 |0;
		console.log("fileInfos",fileInfos.length)
		let fileInfo = Buffer.concat( fileInfos, 123 * 2 * max);
		/*
		for (var i =0 ;i< fileInfos.length; i++) {

			let filename = "./upload/temp/" + i + ".json";
			await fs.writeFile(filename, fileInfos[i]);
		}*/
		console.log("filelength", fileInfo.length)
		fileInfo = fileInfo.slice(0,this.len);
		console.log(fileInfo);
		console.log("filelength", fileInfo.length)
		var str=iconv.decode(fileInfo,'gb2312');
		fileInfo = fileInfo.toString();
		let filename = "./upload/temp/" + time + ".txt";

		await fs.writeFile(filename, str);
	}
}
exports.index2 = async (req, res) => {
	//console.log("buf1\'s content: ", buf1);
	/*
	var data = '';
	let readerStream  = await fs.createReadStream("../www/upload/temp/DAT00000.BIN"); 

	//console.log(buf);
	readerStream.setEncoding("16");

	// 处理流事件 --> data, end, and error
	readerStream.on('data', function(chunk) {
	   data += chunk;
	});

	readerStream.on('end',function(){
	   console.log(data);
	});

	readerStream.on('error', function(err){
	   console.log(err.stack);
	});

	console.log("程序执行完毕");*/
	//const buf = Buffer.from([0xb2, 0xe2]);
	//let text  = await fs.readFile(filePath); 
	//let data = new Buffer(text).readUInt8(0).toString("16");
	
	let filePath = "../www/upload/temp/DAT00000.BIN";
	let data = [];
	let size = 0;
	let i = 0;
	const rs = fs.createReadStream(filePath);
	rs.on('data', function(chunk) {
		data.push(chunk);
		size += chunk.length;
		//console.log(chunk.length)
	    //console.log(chunk);
	})
	rs.on('end', function() {
		console.log(data);
		let buf = new Buffer(size);
		for(let i = 0, len = 0 ; i < data.length; i++){
			console.log(buf.length);
			data[i].copy(buf, len);
			len += data[i].length;
		}
		console.log(buf);
	    console.log('结束了');
		console.log(buf.length);

		console.log(buf[0])

		/*
		let filePath2 = "../www/upload/temp/panny.BIN";
		const wstream = fs.createWriteStream(filePath2);
 		let fileData = buf;
		wstream.on('open', () => {
		const blockSize = 128;
		const nbBlocks = Math.ceil(fileData.length / (blockSize));
		for (let i = 0; i < nbBlocks; i += 1) {
		const currentBlock = fileData.slice(
		 blockSize * i,
		 Math.min(blockSize * (i + 1), fileData.length),
		);
		wstream.write(currentBlock);
		}

		wstream.end();
		});
		wstream.on('error', (err) => {});
		wstream.on('finish', () => { console.log('结束了')});*/
	})
	//let base64 = 'data:' + mineType.lookup(filePath) + ';base64,' + data;  
	//console.log(mineType);
	//let buf = new Buffer(text);
	//console.log(buf.toString("16"));
	//let buf = new Buffer(text);
	//console.log(buf.toString("16"));
	//console.log(buf.readUInt8(1).toString("16"));

	// Prints: -546f87a9cbee
	//console.log(buf.readIntLE(0, 6).toString(16));
  res.render('index', { title: "" });
};


