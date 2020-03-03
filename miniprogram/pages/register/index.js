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
    inviCode: '',
    role: '',
    focus: false,
    Length: 6,        //输入框个数  
    isFocus: true,    //聚焦  
    inputValue: "",        //输入的内容  
    ispassword: false, //是否密文显示 true为密文， false为明文。
    comp: false,
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
        });
        this.goToAnchor();

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
    const _role = wx.getStorageSync('role');
    if (_role === 'anchor') {
      wx.redirectTo({
        url: '/pages/roomList/index'
      });
    }
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
      this.goToAnchor();
    } else {
      wx.showModal({
        title: '提示',
        content: '需获取信息用于登录，请重新登录',
      })
    }
  },
  passwordInput: function (e) {
    var that = this;
    console.log(e.detail.value);
    var inputValue = e.detail.value;
    that.setData({
      inputValue: inputValue
    }, () => {
      if (that.data.inputValue.length == 6) {
        that.setData({
          comp: true
        })
      }
    })
  },

  Tap() {
    var that = this;
    that.setData({
      isFocus: true,
    })
  },

  getFocus: function () {
    this.setData({
      focus: !this.data.focus
    })
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
      self.judgeIdentity(() => {
        self.setAnchor();
      })
      // wx.login({
      //   success: res => {
      //     // 发送 res.code 到后台换取 openId, sessionKey, unionId
      //     console.log(res, BaseUrl, wxAppID);
      //     // console.log(loginApp(res.code, self.data.userInfo.nickName))
      //      loginApp(res.code, self.data.userInfo.nickName).then(role => {
      //        console.log('role', role);
      //       //  self.setData({ role });
      //       self.setAnchor();
      //      });
      //   }
      // })
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
        "code": this.data.inputValue,
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
            duration: 500
          });
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/roomList/index'
            });
          }, 500);
        } else if (result.ret.code === 4) {
          console.error('param error');
          wx.showModal({
            title: '提示',
            content: '绑定码错误，请重新输入'
          });
          self.setData({
            inputValue: ''
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
  },

  judgeIdentity(callback) {
    let self = this;
    loginApp(self.data.userInfo.nickName).then(role => {
      console.log('role', role);
      callback();
    });
  },

  goToAnchor() {
    this.judgeIdentity(() => {
      const _role = wx.getStorageSync('role');
      if (_role === 'anchor') {
        wx.redirectTo({
          url: '/pages/roomList/index'
        });
      }
    });
  }

})