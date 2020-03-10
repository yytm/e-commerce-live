

const app = getApp();
let { loginApp } = require("../../utils/server.js");
const { BaseUrl, wxAppID, liveAppID } = app.globalData;

Page({
  data: {
    living: false,
    isFirst: true,
    userInfo: null,
    role: '',
    roomList: [],
    isShowModal: false,
    list: [{
      "text": "直播列表",
      "iconPath": "/resource/room_list.png",
      "selectedIconPath": "/resource/room_list_selected.png",
      dot: true
    },
    {
      "text": "个人中心",
      "iconPath": "/resource/per_center.png",
      "selectedIconPath": "/resource/per_center_selected.png",
      badge: 'New'
    }]
  },
  onLoad: function (options) {

    // const { role } = options;
    // this.setData({
    //   role
    // })
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      });
      this.getRole();
    } else {
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo;
          this.setData({
            hasUserInfo: true,
            userInfo: res.userInfo
          });
          this.getRole();
        },
        fail: e => {
          console.error(e);
          this.setData({
            isShowModal: true
          });
        }
      })

    }
  },
  onShow: function () {
    console.log('sessionId', wx.getStorageSync('sessionId'));
    if (wx.getStorageSync('sessionId')) {
      this.getRoomList();
    }
  },
  onUnload: function () {
    this.stopRefresh();
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {

  },

  getRoomList() {
    let self = this;
    console.log(">>>[liveroom-roomList] begin to getRoomList");
    wx.showLoading({
      title: '获取房间列表'
    })
    wx.request({
      url: BaseUrl + '/app/get_room_list',
      method: 'POST',
      data: {
        "session_id": wx.getStorageSync('sessionId'),
        "live_appid": liveAppID,
      },
      success(res) {
        self.stopRefresh();
        if (res.data.ret && res.data.ret.code === 0) {
          console.error('roomList ', res.data.room_list);
          if (res.data.room_list && res.data.room_list.length) {
            const roomList = res.data.room_list
              .filter(item => item.room_id.startsWith('e-'))
              .map(item => {
                item.room_show_name = item.room_id.slice(2);
                console.log('show_name', item.room_show_name);
                item.roomState = '直播中';
                return item;
              });;
            if (self.data.isFirst) {
              roomList.forEach(item => {
                if (item.anchor_id_name === 'anchor' + wx.getStorageSync('uid')) {
                  self.setData({
                    // living: true,
                    isFirst: false,
                    livingRoomID: item.room_id,
                    livingRoomName: item.room_name
                  })
                }
              })
            }
            self.setData({
              roomList
            });
          } else {
            self.setData({
              roomList: []
            })
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
    const { currentTarget: { dataset: { id, name, roomImg, anchorId, anchorName, avatar } } } = e;
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
        const url = '../room/index?roomID=' + id + '&roomName=' + name + '&loginType=anchor' + '&nickName=' + anchorName + '&avatar=' + avatar
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
        const url = '../room/index?roomID=' + id + '&roomName=' + name + '&anchorID=' + anchorId + '&nickName=' + anchorName + '&avatar=' + avatar + '&roomImg=' + roomImg + '&loginType=audience';

        wx.navigateTo({
          url: url
        })
      })
    }

  },
  endLive() {
    console.log('endLive');
    this.setData({
      living: false
    })
  },
  enterLive() {
    const url = '../room/index?roomID=' + this.data.livingRoomID + '&roomName=' + this.data.livingRoomName + '&loginType=anchor';
    wx.navigateTo({
      url
    });
  },
  goToAdmin() {
    wx.navigateTo({
      url: "../index/index",
      success: (result) => {
        console.log('nav suc', result);
      },
      fail: () => { },
      complete: () => { }
    });
  },
  createRoom() {
    console.log('createRoom');
    wx.navigateTo({
      url: '../enterLive/index?role=anchor'
    })
  },
  bindGetUserInfo(e) {
    console.log('bindGetUserInfo', e);
    app.globalData.userInfo = e.detail.userInfo;
    this.setData({
      userInfo: e.detail.userInfo,
      isShowModal: false
    });
    this.getRole(() => {
      this.getRoomList();
    });
  },
  getRole(callback) {
    let self = this;
    // 登录
    loginApp(self.data.userInfo.nickName).then(role => {
      console.log('role', role);
      self.setData({ role });
      callback && callback();
    });
  },
  tabChange(e) {
    console.log('tab change', e)
  }
});