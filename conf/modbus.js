
const https = require('https');
const iconv = require("iconv-lite");
const {fs}=require("../conf");
const config = require("../conf/config");


exports.getFile = function (filePath, fileName) {


} 
    this.getFile.writeFileName = function() {
      let begin = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00]);
      let count = Buffer.from([97]);
      let hardware = Buffer.from([0x01]);
      let fun = Buffer.from([0x10]);
      let address = Buffer.from([0xf4, 0x02]);
      let readNum = Buffer.from([0x00, 20]);
      let byteNum = Buffer.from([0x28]);
      let file = Buffer.from( filePath + fileName );
      console.log(file);


    }


 