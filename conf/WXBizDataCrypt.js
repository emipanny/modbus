var crypto = require('crypto')
const config=require("../conf/config.js");

exports.getData = (sessionKey, encryptedData, iv) =>  {
  sessionKey = new Buffer(sessionKey, 'base64');
  encryptedData = new Buffer(encryptedData, 'base64');
  iv = new Buffer(iv, 'base64');
  var decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv);
  // 设置自动 padding 为 true，删除填充补位
  decipher.setAutoPadding(true);
  var decoded = decipher.update(encryptedData, 'binary', 'utf8');
  decoded += decipher.final('utf8')

  decoded = JSON.parse(decoded)
  if (decoded.watermark.appid !== config.wx.AppID) {
    return 1;
  }
  return decoded;


};

