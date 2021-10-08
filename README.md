# vCache, a cacher for Anchor ( base on substrate )
vCache是基于nodejs开发的Anchor区块链的缓存，用于访问Anchor网络的接口。基于简单使用的目标，只有2个接口可以调用，可以快速的进行基于区块链的dApp的开发。
# vCache的作用
* 提供Anchor的访问，返回数据和区块号，可以进行独立核实
# vCache的部署
 * node.js版本要求和redis要求
 * 使用yarn安装@polkadot/api,express,redis
 * 修改配置文件config.js

# vCache的接口
* view接口
* history接口