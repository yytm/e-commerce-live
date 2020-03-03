// miniprogram/pages/enterLive/index.js
const app = getApp();
const { BaseUrl, liveAppID } = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputValue: '',
    roomID: '',
    roomName: '',
    loginType: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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
  onShareAppMessage: function () {

  },

  // 输入的房间 ID
  bindKeyInput(e) {
    this.setData({
      roomID: e.detail.value,
      roomName: e.detail.value,
    })
  },

  createRoom: function () {
    var self = this;
    console.log('>>>[liveroom-roomList] onCreateRoom, roomID is: ' + self.data.roomID);

    if (self.data.roomID.length === 0) {
      wx.showToast({
        title: '创建失败，房间 ID 不可为空',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (self.data.roomID.match(/^[ ]+$/)) {
      wx.showToast({
        title: '创建失败，房间 ID 不可为空格',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    self.setData({
      loginType: 'anchor'
    });
    wx.request({
      url: BaseUrl + '/app/get_room_list',
      method: 'POST',
      data: {
        "session_id": wx.getStorageSync('sessionId'),
        "live_appid": liveAppID,
      },
      success(res) {
        if (res.data.ret && res.data.ret.code === 0) {
          var roomList = res.data.room_list;

          const userID = 'anchor' + wx.getStorageSync('uid');
          console.log('userID', userID);
          for (var index in roomList) {
            console.log(roomList[index]);
            if (roomList[index].room_id === 'e-' + self.data.roomID && roomList[index].anchor_id_name !== userID) {
              wx.showToast({
                title: '创建失败，相同 ID 房间已存在，请重新创建',
                icon: 'none',
                duration: 3000
              });
              return;
            }
          }
          const url = '../room/index?roomID=' + 'e-' + self.data.roomID + '&roomName=' + self.data.roomName + '&loginType=' + self.data.loginType 
          // + '&roomImg=' + roomImg;

          wx.navigateTo({
            url: url,
          });
        }
      },
      fail(e) {
        console.error(e);
      }
    })
  },
})