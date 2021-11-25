let cache = null;

const getFuns = function(path, ck) {
    const chain = '../' + path + '/chain.js';
    const { view, history, ids, write } = require(chain);
    cache = {
        view: view,
        history: history,
        ids: ids,
        write: write,
    }
    ck && ck();
}

exports.controller = {
    view: (obj, cfg, ck) => {
        if (cache == null) {
            getFuns(cfg.path.module, () => {
                cache.view(obj, cfg, ck);
            });
        } else {
            cache.view(obj, cfg, ck);
        }
    },

    history: (obj, cfg, ck) => {
        if (cache == null) {
            getFuns(cfg.path.module, () => {
                cache.history(obj, cfg, ck);
            });
        } else {
            cache.history(obj, cfg, ck);
        }
    },

    ids: (obj, cfg, ck) => {
        if (cache == null) {
            getFuns(cfg.path.module, () => {
                cache.ids(obj, cfg, ck);
            });
        } else {
            cache.ids(obj, cfg, ck);
        }
    },
    write: (obj, cfg, ck) => {
        if (cache == null) {
            getFuns(cfg.path.module, () => {
                cache.write(obj, cfg, ck);
            });
        } else {
            cache.write(obj, cfg, ck);
        }
    },

}