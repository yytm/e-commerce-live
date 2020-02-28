## 1 集成前提
请确保开发环境满足以下技术要求:

* 已安装[微信开发者工具 | _blank](https://mp.weixin.qq.com/debug/wxadoc/dev/devtools/devtools.html?t=2018323)
* 使用微信小程序基础库 1.7.0 及以上版本（否则不支持音视频播放、录制组件）
* [确保你自己的微信小程序符合相应的类目并开通实时音视频权限](https://developers.weixin.qq.com/miniprogram/dev/component/live-pusher.html)
![](https://storage.zego.im/sdk-doc/Pics/MiniProgram/category.png?v=Sat%20Feb%2008%202020%2020:22:28%20GMT+0800%20(CST))
![](https://storage.zego.im/sdk-doc/Pics/MiniProgram/apiconfig.jpg?v=Sat%20Feb%2008%202020%2020:22:28%20GMT+0800%20(CST))

## 2 集成步骤
### 小程序配置
* 腾讯组件中用到的接口地址（包含 HTTPS、WSS 协议），需在微信公众平台进行“合法域名”配置后

> 微信后台配置地址：[微信公众平台 | _blank](https://mp.weixin.qq.com/) -> 设置 -> 开发设置 -> 服务器域名。

> 请开发者将分配的请求域名，按照协议分类，填到指定的 `request合法域名` 或者 `socket合法域名` 中。例如：  

![](https://storage.zego.im/sdk-doc/Pics/MiniProgram/domainconfig.png?v=Mon%20Jan%2020%202020%2011:01:37%20GMT+0800%20(CST))

* 需要把小程序appid 和secret 给到腾讯,用于绑定用户,拉取商品等

### 代码集成
- 拷贝代码到自己的小程序中miniprogram文件夹下
> 解压后的文件夹包括:components,pages,utils目录
>
> 如果文件夹在现有小程序已存在,直接复制下面文件到现有文件夹下就可以;
>
> 如果文件夹下文件和自己的小程序有冲突,建议更改自己小程序下文件名称避免冲突
- 添加上一步pages页面路径到自己小程序的app.json中pages字段下
- app.js中添加全局配置
```javascript
//app.js
App({
  onLaunch: function () {

    // 获取用户信息
    wx.getSetting({
      success: res => {
        console.log(res);
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        } 
      }
    })
  },
  globalData: {
    userInfo: null,
    BaseUrl: 'https://shop-backend.yunyikao.com',
    wxAppID: 'xxxx',
    liveAppID: 0000000 
  },
})
```
> 如果是从[github仓库](https://github.com/yytm/e-commerce-live)中获取,只需要拷贝以下文件即可
 ![image](http://zego-public.oss-cn-shanghai.aliyuncs.com/sdk-doc/miniprogramCSBK.png)

### 判断用户角色
- 引入工具方法
```javascript
  let { loginApp } = require("../../utils/server.js");
 
   // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId 
        // nickName需要自己先获取
         loginApp(res.code, nickName).then(role => {
           console.log('role', role); // role的可能值‘admin’,‘anchor’,‘audience’;依次代表管理员,主播,观众
         });
      }
    })
```

### 根据角色跳转到不同页面
- 主播进入房间开播
```javascript
// roomID代表房间id
const url = 'XXX/room/index?roomID=' +roomID + '&roomName='+ roomID + '&loginType=anchor'
wx.navigateTo({ url});
```
> 为了保证同一个房间只能有一个主播,进入前建议先判断roomdId是否有重复

- 观众进入房间观看
```javascript
  // roomID代表房间id
  // anchorId代表主播id
  // anchorName代表主播昵称
  // roomImg代表主播的海报;
  // 除房间id外其他信息可以从房间列表返回中获取
const url = 'xxx/room/index?roomID=' + roomID + '&roomName=' + roomID + '&anchorID=' + anchorId + '&anchorName=' + anchorName + '&roomImg=' + roomImg + '&loginType=audience';
wx.navigateTo({ url})
```

- 管理员分享主播绑定页面
```javascript
  onShareAppMessage: function (res) {
    return {
      title: app.globalData.userInfo.nickName + '邀请你注册',
      path: '/pages/register/index?role=anchor',
      imageUrl: 'xxxx',// 邀请封面图
    }
  },
```
> 分享邀请可以通过右上角的功能按钮,也可以通过 <button open-type="share">邀请主播</button>唤起分享

### 获取直播房间列表
```javascript
const { BaseUrl, wxAppID, liveAppID } = getApp().globalData;
wx.request({
      url: BaseUrl + '/app/get_room_list',
      method: 'POST',
      data: {
        "session_id": wx.getStorageSync('sessionId'),
        "live_appid": liveAppID,
      },
      success(res) {
        if (res.data.ret && res.data.ret.code === 0) {
            const roomList = res.data.room_list
            console.log('房间列表',roomList); 
        }
      },
      fail(e) {

      },
})
```


### 商品跳转
 商品袋中的商品在小程序中是通过接口获取管理员配置的得到数据,打开对应链接是通过webview打开;
 > 小程序webview有域名白名单限制,商品地址也需要在小程序管理后台先配;
 >
 > 商品链接域名所在服务器,根域名下还需要配置小程序的校验文件
 
 ###  内容安全审核

微信小程序有内容安全要求规范，需要开发者对发布的内容进行安全审查，详见   [关于微信小程序内容安全要求规范](https://developers.weixin.qq.com/community/develop/doc/00004843288058ed4039d223951401)，可通过接入微信公众平台内容安全API（imgSecCheck、msgSecCheck、mediaCheckAsync）能力，以及通过其他技术或人工审核手段做好内容审核，校验用户输入的文本/图片，拦截政治、色情、违法等敏感词。

使用检查文本内容安全api [security.msgSecCheck](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/sec-check/security.msgSecCheck.html),
该接口支持服务端调用及云调用。

1. 引入cloudfunctions 文件夹（其中msgcheck是建立的云函数目录），
此时结构![image](http://zego-public.oss-cn-shanghai.aliyuncs.com/sdk-doc/struct.png)

在project.config.json中引入

```
  "cloudfunctionRoot": "cloudfunctions/",
```

2. 在app.json 引入

```
  "cloud": true,
```
3. 在开发者工具（>= 1.02.1904090）上“云开发”搭建云框架，环境名称（“e-commerce-cloud”），环境ID（“e-commerce-cloud-agccw”），在开发者工具右键点击msgcheck, 并上传部署（云端安装依赖）。