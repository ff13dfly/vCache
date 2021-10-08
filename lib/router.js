const express = require('express');
const app = express();

//检查目标方法是否可用
function check(target, method, check) {

}

exports.app = {
    start: function(cfg, ck) {
        //1.系统路由，解析成统一的格式提供给下步调用

        //1.1.默认的路由
        app.get('/', function(req, res) {
            const obj = {
                target: 'chain',
                method: 'status',
                params: {},
                success: false,
                message: 'This is the cache server for Anchor, please check the doc.'
            }
            ck && ck(obj, req, res);
        });

        //1.2.anchor的直接访问
        app.get('/:anchor', function(req, res) {
            if (req.params.anchor == 'favicon.ico') return false;
            const obj = {
                target: 'anchor',
                method: 'view',
                params: { key: req.params.anchor },
                success: true,
            }
            ck && ck(obj, req, res);
        });

        app.get('/write/:name', function(req, res) {
            const obj = {
                target: 'anchor',
                method: 'write',
                params: { name: req.params.name },
                success: true,
            }
            ck && ck(obj, req, res);
        });

        app.get('/history/:anchor', function(req, res) {
            //console.log(req.params.list);
            const obj = {
                target: 'anchor',
                method: 'history',
                params: { key: req.params.anchor },
                success: true,
            }
            ck && ck(obj, req, res);
        });

        app.get('/ids/:list', function(req, res) {
            console.log(req.params.list);
            const obj = {
                target: 'anchor',
                method: 'ids',
                params: { ids: JSON.parse(req.params.list) },
                success: true,
            }
            ck && ck(obj, req, res);
        });

        //2.启动服务器，绑定指定端口
        const server = app.listen(cfg.server.port, function() {
            const host = server.address().address;
            const port = server.address().port;
            console.log("Server start at http://%s:%s", host, port);
        });
    },
}