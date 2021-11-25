const { config } = require('./config.js');

//1.load router
const fa = './' + config.path.module + '/router.js';
const { app } = require(fa);

//1.get call back from url
const getCallback = function(str) {
    const tmp = str.split('callback=');
    if (tmp.length == 1) return false;
    const dd = tmp[1].split('&');
    return dd.length == 1 ? tmp[1] : dd[0];
}

const chain = './' + config.path.module + '/chain.js';
const { ping } = require(chain);


//2.router callback the params, to the right controller to action.
app.run(config.server, () => {
    console.log('vCache is ready, start to cache anchors');
    ping(config, () => {
        app.start(config, (obj, req, res) => {
            if (!obj.success) return res.send(obj.message);
            console.log(JSON.stringify(obj)); //显示解析出来的请求数据

            const fb = './' + config.path.controller + '/' + obj.target + '.js';
            const { controller } = require(fb);
            if (!controller[obj.method]) return false;

            controller[obj.method](obj.params, config, (dt) => {
                const callback = getCallback(req.originalUrl);
                if (!callback) {
                    res.send(dt); //No JSONP exprot
                } else {
                    //JSONP support export;
                    if (typeof dt == 'string') {
                        res.send(callback + '({"success":true,"data":' + dt + '})');
                    } else {
                        const obj = { success: true, data: dt }
                        res.send(callback + '(' + JSON.stringify(obj) + ')');
                    }

                }
            });
        });
    })
});