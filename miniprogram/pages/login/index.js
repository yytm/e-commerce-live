// miniprogram/pages/login/index.js
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    app.globalData.userInfo && this.setData({
      userInfo: app.globalData.userInfo
    })
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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      console.log(res.target)
    }
    return {
      title: '自定义转发标题',
      path: '/pages/register/index?id=123'
    }
  },

  bindGetUserInfo(e) {
    console.log(e, e.detail.userInfo);
    if (e.detail.userInfo) {
      app.globalData.userInfo = e.detail.userInfo;
      this.setData({
        userInfo: e.detail.userInfo
      })
      // this.getAdmins();
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

  getAdmins() {
    const url = '';
    const data = {}
    wx.request({
      url,
      data,
      header: {
        'content-type': 'text/plain'
      },
      success(result) {
        console.log(">>>[liveroom-room] " + result.data);
        if (result.statusCode != 200) {
          return;
        }
      },
      fail(e) {
        console.log(">>>[liveroom-room]: ")
        console.log(e);
      }
    })
  }
})