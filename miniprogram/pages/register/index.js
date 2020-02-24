// miniprogram/pages/register/index.js
const app = getApp();
const { BaseUrl, liveAppID, wxAppID } = app.globalData;
let { loginApp } = require("../../utils/server.js");

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    inviCode: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    app.globalData.userInfo && this.setData({
      userInfo: app.globalData.userInfo
    });
    wx.getUserInfo({
      success: res => {
        // 可以将 res 发送给后台解码出 unionId
        app.globalData.userInfo = res.userInfo

        this.setData({
          userInfo: res.userInfo
        })
        // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
        // 所以此处加入 callback 以防止这种情况
        if (this.userInfoReadyCallback) {
          this.userInfoReadyCallback(res)
        }
      }
    })
    const { role } = options;
    console.log(role);
    this.setData({
      role
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  

  bindGetUserInfo(e) {
    console.log(e, e.detail.userInfo);
    if (e.detail.userInfo) {
      app.globalData.userInfo = e.detail.userInfo;
      this.setData({
        userInfo: e.detail.userInfo
      })
      const admins = ['Cloud', 'zhc'];
      if (admins.indexOf(this.data.userInfo.nickName) >= -1) {

      }
    } else {
      wx.showModal({
        title: '提示',
        content: '需获取信息用于登录，请重新登录',
      })
    }
  },

  bindKeyInput(e) {
    this.setData({
      inviCode: e.detail.value
    })
  },
  authorize() {
    console.log('authorize');
    let self = this;
    // const code = this.data.inviCode;
    const sessionId = wx.getStorageSync('sessionId');
    console.log(sessionId);
    if (!sessionId) {
      wx.login({
        success: res => {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          console.log(res, BaseUrl, wxAppID);
          // console.log(loginApp(res.code, self.data.userInfo.nickName))
           loginApp(res.code, self.data.userInfo.nickName).then(role => {
             console.log('role', role);
            //  self.setData({ role });
            self.setAnchor();
           });
        }
      })
    }

    self.setAnchor();
  },

  setAnchor() {
    let self = this;
    wx.request({
      url: BaseUrl + '/app/register_anchor',
      method: 'POST',
      data: {
        "session_id": wx.getStorageSync('sessionId'),
        "live_appid": liveAppID,
        "code": this.data.inviCode,
      },
      success(res) {
        console.log(res);
        const result = res.data;
        if (!result.ret) return;
        if (result.ret.code === 0) {
          console.log('success');
          wx.showToast({
            title: '绑定成功，你已经是主播了',
            icon: 'none',
            duration: 2000
          });
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/roomList/index'
            });
          }, 2000);
        } else if (result.ret.code === 4) {
          console.error('param error');
          wx.showModal({
            title: '提示',
            content: '绑定失败，请重新操作'
          });
          self.setData({
            inviCode: ''
          })
        } else if (result.ret.code === 1002) {
          wx.showModal({
            title: '警告',
            content: '绑定授权验证码已使用'
          })
        }
      },
      fail(e) {
        console.error(e);
      }
    })
  }

})