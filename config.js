exports.config = {
    'callIndex': '0x1d00', //anchor对应extrinsics的ID号
    'cacheStep': 300, //每次处理block的数量
    'path': {
        'controller': 'mod',
        'module': 'lib',
    },
    'chain': { //对应取值的键名
        'name': '_key',
        'raw': '_data',
        'more': '_metadata',
        'type': '_type',
    },
    'keys': {
        'cache_index': 'caceiii',
        'pre_anchor': 'ppl_',
        'suffix_stack': '_kkb',
    },
    'polkadot': {
        'endpoint': 'ws://127.0.0.1:9944',
        //'endpoint': 'ws://45.32.38.236:9944',
        'account': '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
    },
    'server': {
        'port': 3322,
        'address': '',
    },
    'check': { //可用方法的白名单，防止调用非法文件
        'anchor': {
            'view': true,
        },
        'account': {
            'view': true,
        }
    },
}