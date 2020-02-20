## 1 准备环境
请确保开发环境满足以下技术要求： 

* 已安装[微信开发者工具 | _blank](https://mp.weixin.qq.com/debug/wxadoc/dev/devtools/devtools.html?t=2018323)
* 使用微信小程序基础库 1.7.0 及以上版本（否则不支持音视频播放、录制组件）
* [确保你自己的微信小程序符合相应的类目并开通实时音视频权限](https://developers.weixin.qq.com/miniprogram/dev/component/live-pusher.html)
![](https://storage.zego.im/sdk-doc/Pics/MiniProgram/category.png?v=Sat%20Feb%2008%202020%2020:22:28%20GMT+0800%20(CST))
![](https://storage.zego.im/sdk-doc/Pics/MiniProgram/apiconfig.jpg?v=Sat%20Feb%2008%202020%2020:22:28%20GMT+0800%20(CST))

## 2 初始化
* [申请sdk账号] 由我方提供


* sdk 分配给开发者的 URL（包含 HTTPS、WSS 协议），需要在微信公众平台进行“合法域名”配置后，小程序才能正常访问。

> 微信后台配置地址：[微信公众平台 | _blank](https://mp.weixin.qq.com/) -> 设置 -> 开发设置 -> 服务器域名。

> 请开发者将分配的请求域名，按照协议分类，填到指定的 `request合法域名` 或者 `socket合法域名` 中。例如：  

![](https://storage.zego.im/sdk-doc/Pics/MiniProgram/domainconfig.png?v=Mon%20Jan%2020%202020%2011:01:37%20GMT+0800%20(CST))

## 3 集成组件
* 提供了组件模式，在demo 中封装了live-room 组件，可以在页面中引用该组件，该组件封装了直播场景，room 页面使用了该组件。可参考demo 直接使用。
 

## 4 商品袋

在示例demo中，有一个商品列表，客户可以自定义商品的相关信息（简介、图片、列表、链接等），商品链接可以使用web-view链接到自己的域名下的商品页面，但需要在[小程序管理后台](https://mp.weixin.qq.com/)配置业务域名，此时需要下载一个校验文件，将该文件放置于域名根目录下。


