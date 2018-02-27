// 加载依赖库，原来这个类库都封装在connect中，现在需地注单独加载
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const mysql=require("./conf/mysql.js");
const comment=require("./conf/comment.js");
const config=require("./conf/config.js");


const routes = require('./controller/index');// 加载路由控制
const app = express();

app.set('view engine', 'ejs');

console(path);
app.use(express.static('public'));
//express.use('/upload',express.static('upload'));
//app.use(express.static('upload'))
app.use(express.static(path.join(__dirname,"/upload")))

// 定义数据解析器
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', routes);
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            title: err.message,
            time: 10
        });
    });
}

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log(err);
    res.json(11002);
});

// 输出模型
app.all('*', function (req, res) {
    res.render(req.url.split('/')[1]);
});
app.listen(3000,function(){

    console.log('server start ...');
});