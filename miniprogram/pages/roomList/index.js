

let { loginApp } = require("../../utils/server.js");
const app = getApp();
const { BaseUrl, wxAppID, liveAppID } = app.globalData;

Page({
  data: {
    userInfo: null,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    hasUserInfo: false,
    role: ''
  },
  onLoad: function () {
    console.log(app.globalData)
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      });
      this.getRole();
    }
    // let userInfo = wx.getStorageSync("userInfo");
    // if (userInfo) {
    //   this.setData({
    //     hasUserInfo: true,
    //     userInfo: userInfo
    //   });
    // }
  },
  onShow: function () {
    this.getRoomList();
  },
/**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      console.log(res.target)
    }
    return {
      title: app.globalData.userInfo.nickName + '邀请你注册',
      path: '/pages/register/index?role=anchor',
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

  getRoomList() {
    let self = this;
    wx.request({
      url: BaseUrl + '/app/get_room_list',
      method: 'POST',
      data: {
        "session_id": wx.getStorageSync('sessionId'),
        "live_appid": liveAppID,
      },
      success(res) {
        if (res.data.ret && res.data.ret.code === 0) {
          if ( res.data.room_list && res.data.room_list.length) {
            const roomList = res.data.room_list
            .filter(item => item.room_id.startsWith('e-'))
            .map(item => {
                item.room_show_name = item.room_id.slice(2);
                console.log('show_name', item.room_show_name);
                return item;
              });;
            self.setData({
              roomList
            });
          }

        }
      },
      fail(e) {

      } 
    })
  },
  /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
  onPullDownRefresh() {
    console.log('>>>[liveroom-roomList] onPullDownRefresh');
    this.getRoomList();
  },
  stopRefresh() {
    wx.hideLoading();
    wx.stopPullDownRefresh();
  },
  // 点击进入房间
  onClickItem(e) {
    console.log(e);
    const { currentTarget: { dataset: { id, roomImg, anchorId, anchorName } } } = e;
    console.log('>>>[liveroom-roomList] onClickItem, item is: ', id);

    // 防止两次点击操作间隔太快
    let nowTime = new Date();
    if (nowTime - this.data.tapTime < 1000) {
      return;
    }

    const userID = 'anchor' + wx.getStorageSync('uid');
    if (anchorId === userID) {
      this.setData({
        tapTime: nowTime,
      }, () => {
        const url = '../room/index?roomID=' + id + '&roomName=' + id + '&loginType=anchor'
        // + '&roomImg=' + roomImg;
        wx.navigateTo({
          url: url,
        });
      })
    } else {
      this.setData({
        tapTime: nowTime,
        loginType: 'audience'
      }, function () {
        const url = '../room/index?roomID=' + id + '&roomName=' + id + '&anchorID=' + anchorId + '&anchorName=' + anchorName + '&roomImg=' + roomImg + '&loginType=audience';
  
        wx.navigateTo({
          url: url
        })
      })
    }
    
  },

  getUserInfo() {
    wx.getUserInfo({
      lang: 'zh_CN',
      success: function (res) {
        console.log('getUserInfo success', res);
      },
      fail: function (e) {
        console.error('getUserInfo fail', e);
      }
    })
  },

  getRole() {
    let self = this;
    // 登录
    loginApp(self.data.userInfo.nickName).then(role => {
      console.log('role', role);
      self.setData({ role });
    });
  },

});