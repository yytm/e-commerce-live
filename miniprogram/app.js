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
  onShow: function() {
    console.log('App onShow');
    wx.setKeepScreenOn({
      keepScreenOn: true,
      success: (result)=>{
        console.log('setKeepScreenOn', result);
      },
      fail: ()=>{},
      complete: ()=>{}
    });
  },
  globalData: {
    userInfo: null,
    BaseUrl: 'https://shop-backend.yunyikao.com',
    wxAppID: 'wxda1343baad77dc86',
    liveAppID: 1078978582
  },
})