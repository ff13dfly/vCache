const redis = require('redis');
const client = redis.createClient();
client.on('error', function(err) {
    console.log('Error ' + err);
});
client.set('aaa', 'bbb');
var aa = client.exists('aaa', (err, val) => {
    console.log('error:' + err);
    console.log('callback:' + val);
});

console.log('return:' + aa);
//console.log(client);

console.log('Hash map test');
const hkey = "hkeke";
const obj = { "name": "hello", "raw": "world" };

client.hmset(hkey, obj, (err, value) => {
    console.log(err);
    console.log(value);
});

client.hget(hkey, 'raw', (err, value) => {
    console.log(err);
    console.log(value);
});