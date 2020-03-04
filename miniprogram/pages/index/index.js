// miniprogram/pages/index/index.js
let { loginApp } = require("../../utils/server.js");
const app = getApp();
const { BaseUrl, wxAppID, liveAppID } = app.globalData;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    hasUserInfo: false,
    role: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(app.globalData)
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      });
      this.getRole();
    }
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
      title: this.data.userInfo.nickName + '邀请你注册',
      path: '/pages/register/index',
      imageUrl: '../../resource/invi.png',
    }
  },

  bindGetUserInfo(e) {
    console.log(e, e.detail.userInfo);
    if (e.detail.userInfo) {
      app.globalData.userInfo = e.detail.userInfo;
      this.setData({
        userInfo: e.detail.userInfo
      })
      this.getRole();
    } else {
      wx.showModal({
        title: '提示',
        content: '需获取信息用于登录，请重新登录',
      })
    }
  },

  goTo(e) {
    console.log('goTo', e);
    const { target: { id }} = e;
    let path;
    switch(id) {
      case 'create':
        path = '../enterLive/index?role=' + this.data.role;
        break;
      case 'list': 
        path = '../roomList/index?role=' + this.data.role;
        break;
      default:
        break;
    }
    path && wx.navigateTo({
      url: path
    });
  },

  getRole() {
    let self = this;
    // 登录
    loginApp(self.data.userInfo.nickName).then(role => {
      console.log('role', role);
      self.setData({ role });
    });
  },
})