const { config } = require('./config.js');

//1.加载router对数据进行解析，再倒入指定的模块
const fa = './' + config.path.module + '/router.js';
const { app } = require(fa);

//1.计算callback的部分，可以把验证信息放在这里处理，保障授权访问
const getCallback = function(str) {
    const tmp = str.split('callback=');
    if (tmp.length == 1) return false;
    const dd = tmp[1].split('&');
    return dd.length == 1 ? tmp[1] : dd[0];
}

//2.启动路由之后，把参数传递给对应的模块去处理
app.start(config, (obj, req, res) => {
    if (!obj.success) return res.send(obj.message);
    console.log(JSON.stringify(obj)); //显示解析出来的请求数据

    const fb = './' + config.path.controller + '/' + obj.target + '.js';
    const { controller } = require(fb);

    controller[obj.method](obj.params, config, (dt) => {
        const callback = getCallback(req.originalUrl);
        console.log(typeof dt);
        if (!callback) {
            res.send(dt);
        } else {
            if (typeof dt == 'string') {
                res.send(callback + '({"success":true,"data":' + dt + '})');
            } else {
                const obj = { success: true, data: dt }
                res.send(callback + '(' + JSON.stringify(obj) + ')');
            }

        }
    });
});