
// let requestRoomListUrl = 'https://liveroom1739272706-api.zego.im/demo/roomlist?appid=1739272706';

let { loginApp } = require("../../utils/server.js");
const app = getApp();
const { BaseUrl, wxAppID, liveAppID } = app.globalData;

Page({
  data: {
    roomID: '',
    roomName: '',

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
    // this.fetchRoomList();
    this.getRoomList();
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
    // this.getUserInfo();
    // wx.request({
    //   url: requestRoomListUrl,
    //   method: "GET",
    //   success(res) {
    //     console.log(">>>[liveroom-roomList] fetchRoomList before create room, result is: ");
    //     if (res.statusCode === 200) {
    //       var roomList = res.data.data.room_list;
    //       // self.setData({
    //       //     roomList: roomList
    //       // })

    //       for (var index in roomList) {
    //         if (roomList[index].room_id === self.data.roomID) {
    //           wx.showToast({
    //             title: '创建失败，相同 ID 房间已存在，请重新创建',
    //             icon: 'none',
    //             duration: 3000
    //           });
    //           return;
    //         }
    //       }
    //       const url = '../room/index?roomID=' + 'e-' + self.data.roomID + '&roomName=' + self.data.roomName + '&loginType=' + self.data.loginType;

    //       wx.navigateTo({
    //         url: url,
    //       });
    //     }
    //   }
    // });
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

          for (var index in roomList) {
            if (roomList[index].room_id === self.data.roomID) {
              wx.showToast({
                title: '创建失败，相同 ID 房间已存在，请重新创建',
                icon: 'none',
                duration: 3000
              });
              return;
            }
          }
          const url = '../room/index?roomID=' + 'e-' + self.data.roomID + '&roomName=' + self.data.roomName + '&loginType=' + self.data.loginType;

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
    this.fetchRoomList();
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

    this.setData({
      tapTime: nowTime,
      loginType: 'audience'
    }, function () {
      // const url = '../play-room/index?roomID=' + id + '&roomName=' + id + '&loginType=audience';
      const url = '../room/index?roomID=' + id + '&roomName=' + id + '&anchorID=' + anchorId + '&anchorName=' + anchorName +  '&loginType=audience';

      wx.navigateTo({
        url: url
      })
    })
  },

  // 输入的房间 ID
  bindKeyInput(e) {
    this.setData({
      roomID: e.detail.value,
      roomName: e.detail.value,
    })
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
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log(res, BaseUrl, wxAppID);
        // console.log(loginApp(res.code, self.data.userInfo.nickName))
         loginApp(res.code, self.data.userInfo.nickName).then(role => {
           console.log('role', role);
           self.setData({ role });
         });
      }
    })
  },

  // 获取房间列表
  fetchRoomList() {
    let self = this;
    console.log(">>>[liveroom-roomList] begin to fetchRoomList");
    wx.showLoading({
      title: '获取房间列表'
    })
    wx.request({
      url: requestRoomListUrl,
      method: "GET",
      success(res) {
        self.stopRefresh();
        console.log(">>>[liveroom-roomList] fetchRoomList, result is: ");
        if (res.statusCode === 200) {
          console.log(res.data);
          const roomList = res.data.data.room_list.
            filter(item => item.room_id.startsWith('e-')).
            map(item => {
              item.room_show_name = item.room_id.slice(2);
              console.log('show_name', item.room_show_name);
              return item;
            });
          console.log('roomList', roomList);
          self.setData({
            roomList
          });
        } else {
          wx.showToast({
            title: '获取房间列表失败，请稍后重试',
            icon: 'none',
            duration: 2000
          })
        }
      }
    })
  },
  onGotUserInfo: function (e) {
    let userInfo = e.detail.userInfo || {};
    const { currentTarget: { dataset: { id } } } = e;
    console.log('id', id);
    console.log('onGotUserInfo', e);
    // store data for next launch use
    wx.setStorage({
      key: 'userInfo',
      data: userInfo,
    })
    // this.onJoin(userInfo);
    if (id === 'create') {
      this.createRoom();
    } else {
      this.onClickItem(id);
    }

  },
});