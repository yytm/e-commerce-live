// miniprogram/pages/anchor/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    anchorID:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let scene = decodeURIComponent(options.scene)
    let { anchor } = options.scene ? scene : options
    this.setData({ anchorID: anchor })
    
    this.initDomReander()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },
  /**
   * 和界面有关的初始化
   */
  initDomReander() {
    let systemInfo = wx.getSystemInfoSync()
    let rect = wx.getMenuButtonBoundingClientRect()

    let { statusBarHeight } = systemInfo
    const top = rect.top
    this.setData({ top: `${top + 5}px`, tHeight: rect.height, tTop: rect.top });
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
  onShareAppMessage: function () {

  }
})