const { ApiPromise, WsProvider } = require('@polkadot/api');

const { Keyring } = require('@polkadot/keyring');
const { json } = require('express');
//const ADDR = '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy';

let isSubscribe = false; //是否已经启动订阅的方法
let isStart = true; //判断是否为第一次启动订阅任务，是的话，清理redis里的缓存
let isCache = false; //是否已经开始了缓存任务

//let db = null; //redis的实例
let wsAPI = null;

const redis = require('redis');
const client = redis.createClient();
client.on('error', function(err) {
    console.log('Error ' + err);
});

const self = {
    init: (cfg, ck) => {
        //1.自动运行，开始订阅事件，获取最新生成的数据，如果有anchor的话，进行缓存
        if (wsAPI == null) {
            const wsProvider = new WsProvider(cfg.polkadot.endpoint);
            ApiPromise.create({ provider: wsProvider }).then((api) => {
                wsAPI = api;
                self.subscribe(wsAPI, cfg);
                ck && ck(wsAPI);
            });
        } else {
            self.subscribe(wsAPI, cfg);
            ck && ck(wsAPI);
        }
    },

    getMultiBlockData: (api, ids, ck) => {
        var arr = [];
        var n = 0;
        //console.time('multiBlock');
        //console.log(ids);
        api.query.system.blockHash.multi(ids, (bks) => {
            //console.log(bks);
            for (var k in bks) {
                const hash = bks[k].toString();
                //console.log(hash);
                api.rpc.chain.getBlock(hash).then((data) => {
                    arr.push(data);
                    n++;
                    if (n == ids.length) {
                        //console.timeEnd('multiBlock');
                        ck && ck(arr);
                    }
                });
            }
        });
    },
    u8toString: (arr) => {
        let str = '0x';
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] < 16) str += '0';
            str += arr[i].toString(16);
        }
        return str;
    },
    hex2str: (hex) => {　　
        var trimedStr = hex.trim();　　
        var rawStr = trimedStr.substr(0, 2).toLowerCase() === "0x" ? trimedStr.substr(2) : trimedStr;　　
        var len = rawStr.length;　　
        if (len % 2 !== 0) { alert("Illegal Format ASCII Code!"); return ""; }　　
        var curCharCode;　　
        var resultStr = [];　　
        for (var i = 0; i < len; i = i + 2) {　　　　
            curCharCode = parseInt(rawStr.substr(i, 2), 16);　　　　
            resultStr.push(String.fromCharCode(curCharCode));　　
        }　　
        return resultStr.join("");
    },
    filterAnchor: (dt, key) => {
        let arr = [];
        //console.log(' have more than 1 extrinsics, need to check anchor.');
        dt.block.extrinsics.forEach((ex, index) => {
            if (index != 0 && self.u8toString(ex.method.callIndex) == key) {
                //console.log('Get an anchor raw data.');
                arr.push(JSON.parse(ex.toString()));
            }
        });
        return arr;
    },
    cacheAnchor: (arr, n, cfg, diretion) => {
        console.log(n + '[' + diretion + ']');
        const keys = cfg.chain;
        const fomat = self.formatAnchor;
        for (let i = 0; i < arr.length; i++) {
            const row = arr[i];
            const account = row.signature.signer.id;
            const adata = row.method.args;
            const obj = fomat(adata, n, account, keys);
            self.saveAnchor(obj, cfg.keys.pre_anchor, cfg.keys.suffix_stack, diretion);
        }

        return true;
    },
    saveAnchor: (obj, pre, suffix, diretion) => {
        console.log('ready to save anchor:' + JSON.stringify(obj));
        const obj_key = pre + obj.name;
        const list_key = pre + obj.name + suffix;
        //const client = self.getDB();

        client.exists(obj_key, (err, isSet) => {
            if (isSet) {
                //1.1.判断方向，如果是left的话，不进行更新;
                if (diretion != 'left') {
                    client.set(obj_key, JSON.stringify(obj));
                }

                //1.2.从left方向进行push操作
                if (diretion == 'left') {
                    client.lpush(list_key, JSON.stringify(obj));
                } else {
                    client.rpush(list_key, JSON.stringify(obj));
                }
                //client.lpush(list_key, JSON.stringify(obj));
            } else {
                //2.1.创建anchor的数据结构
                client.set(obj_key, JSON.stringify(obj));

                //2.1.把数据push到列表里
                if (diretion == 'left') {
                    client.lpush(list_key, JSON.stringify(obj));
                } else {
                    client.rpush(list_key, JSON.stringify(obj));
                }

            }
        });
    },

    formatAnchor: (data, n, account, keys) => {
        const hex2str = self.hex2str;
        const raw = data[keys.raw];
        const anchor = data[keys.name];
        const more = data[keys.more];
        const type = data[keys.type];

        return {
            'name': hex2str(anchor),
            //'name': anchor,
            'raw': raw,
            'more': JSON.parse(hex2str(more)),
            //'more': JSON.parse(more),
            'type': type,
            'owner': account,
            'block': n,
        }
    },

    // getDB: () => {
    //     return db;
    //     if (db == null) {
    //         const redis = require('redis');
    //         const client = redis.createClient();
    //         client.on('error', function(err) {
    //             console.log('Error ' + err);
    //         });
    //         db = client;
    //         return client;
    //     } else {
    //         return db;
    //     }
    // },
    // closeDB: (client) => {
    //     client.quit();
    //     db = null;
    // },

    cacheBlock: (api, end, step, client, cfg) => {
        const start = end < step ? 0 : (end - step);
        //console.log('cache from block ' + end + ',start:' + start + ',step:' + step);
        let ids = [];
        for (let i = 0; i < (step > end ? end : step); i++) {
            ids.push(start + i);
        }

        self.getMultiBlockData(api, ids, (arr) => {
            for (let i = 0; i < arr.length; i++) {
                const dt = arr[i];
                const id = dt.block.header.number;
                if (dt.block.extrinsics.length > 1) {
                    //console.log(dt.block)
                    const ans = self.filterAnchor(dt, cfg.callIndex);
                    if (ans.length != 0) {
                        self.cacheAnchor(ans, id, cfg, 'left'); //从左侧添加数据
                    }
                }
            }

            if (start > 0) {
                self.cacheBlock(api, start, step, client, cfg);
            } else {
                console.log('All cached');
            }
        });
    },
    subscribe: (api, cfg) => {
        if (isSubscribe) return false;
        isSubscribe = true;
        //const client = self.getDB();
        const ckey = cfg.keys.cache_index;

        api.rpc.chain.subscribeFinalizedHeads((lastHeader) => {
            //0.清除缓存，不需要的都处理掉
            if (isStart) {
                client.del(ckey);
                client.keys(cfg.keys.pre_anchor + '*', (err, list) => {
                    if (list.length != 0) client.del(list);
                });
                isStart = false;
            }

            //1.处理缓存,检索出所有的anchor并缓存
            if (!isCache) {
                //2.开始构建缓存
                client.exists(ckey, (err, isSet) => {
                    if (!isSet) {
                        const n = lastHeader.number;
                        client.set(ckey, n, (err, val) => {
                            self.cacheBlock(api, n, cfg.cacheStep, client, cfg);
                            isCache = true;
                        });
                    } else {
                        client.get(ckey, (err, num) => {
                            if (num > 0) {
                                self.cacheBlock(api, n, cfg.cacheStep, client, cfg);
                                isCache = true;
                            }
                        });
                    }
                });
            }

            //2.监听新生成的block里有没有anchor;
            console.log(lastHeader.number + ':' + lastHeader.hash.toHex());
            api.rpc.chain.getBlock(lastHeader.hash.toHex()).then((dt) => {
                if (dt.block.extrinsics.length > 1) {
                    const arr = self.filterAnchor(dt, cfg.callIndex);
                    if (arr.length != 0) {
                        self.cacheAnchor(arr, lastHeader.number, cfg, 'right');
                    }
                }
            });
        });
    },
}

exports.view = function(obj, cfg, ck) {
    //console.time('redis_read');

    self.init(cfg, (api) => {
        const vkey = cfg.keys.pre_anchor + obj.key;
        //const client = self.getDB();
        //return ck && ck('hello world');
        //console.time('redis_exists');
        client.exists(vkey, (err, isSet) => {
            //console.timeEnd('redis_exists');
            if (err) return ck && ck(err);
            if (!isSet) return ck && ck(false);

            //console.time('redis_get');
            client.get(vkey, (err, value) => {
                //console.timeEnd('redis_get');
                if (err) return ck && ck(err);

                ck && ck(value);
            });
        });
    });
}

exports.history = function(obj, cfg, ck) {
    self.init(cfg, (api) => {
        const vkey = cfg.keys.pre_anchor + obj.key;
        //const client = self.getDB();
        client.exists(vkey, (err, isSet) => {
            if (err) return ck && ck(err);
            if (!isSet) return ck && ck(false);

            client.lrange(vkey + cfg.keys.suffix_stack, 0, -1, (err, value) => {
                if (err) return ck && ck(err);
                ck && ck(value);
            });
        });
    });
}

exports.ids = function(ids, cfg, ck) {
    self.init(cfg, (api) => {
        self.getMultiBlockData(api, ids, ck);
    });
}

exports.write = function(name, cfg, ck) {
    self.init(cfg, (api) => {

        // const keyring = new Keyring({ type: 'sr25519' });
        // const pkey = keyring.addFromUri('//Alice');
        // console.log(pkey.addressRaw.toString());

        // const key = "hello";
        // const raw = "AABBCCDD";
        // const meta = "{}";
        // const type = 1;

        // api.tx.anchor.setAnchor(key, raw, meta, type).signAndSend(pkey);
    });
}