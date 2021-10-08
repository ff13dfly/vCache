exports.controller = {
    view: (obj, cfg, ck) => {
        const chain = '../' + cfg.path.module + '/chain.js';
        const { view } = require(chain);

        view(obj, cfg, (dt) => {

            ck && ck(dt);
        });
    },

    history: (obj, cfg, ck) => {
        const chain = '../' + cfg.path.module + '/chain.js';
        const { history } = require(chain);
        history(obj, cfg, (dt) => {
            ck && ck(dt);
        });
    },

    ids: (obj, cfg, ck) => {
        const chain = '../' + cfg.path.module + '/chain.js';
        const { ids } = require(chain);
        ids(obj.ids, cfg, ck);
    },
    write: (obj, cfg, ck) => {
        const chain = '../' + cfg.path.module + '/chain.js';
        const { write } = require(chain);
        write('hello', cfg, ck);
        //write(obj.ids, cfg, ck);
    },
}