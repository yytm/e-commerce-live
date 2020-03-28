

const app = getApp();
let { loginApp } = require("../../utils/server.js");
const { BaseUrl, wxAppID, liveAppID } = app.globalData;

Page({
  data: {
    living: false,
    isFirst: true,
    userInfo: null,
    role: '',
    roomList: [
      // {
      //   room_id: 'room651585275243553',
      //   room_name: 'Givenchy/纪梵希高定香榭天鹅',
      //   room_img: '../../resource/m0.png',
      //   anchor_id_name: "xcxU1582085277557",
      //   anchor_nick_name: "zhc",
      //   play_count: 2345,
      //   playback_duration: '05:03:34',
      //   is_private: true,
      //   room_password: "124563",
      //   room_state: '回放',
      // },
    ],
    isShowPassword: false,
    isShowModal: false,
    title: '当前直播未结束，是否重新进入？',
    cancelText: '结束直播',
    confirmText: '进入直播',
    bottom: '30',
    state: 'list',
    list: [{
      "text": "直播列表",
      "id": "list",
      "iconPath": "/resource/room_list.png",
      "selectedIconPath": "/resource/room_list_selected.png",
      dot: true
    },
    {
      "text": "个人中心",
      "id": "center",
      "iconPath": "/resource/per_center.png",
      "selectedIconPath": "/resource/per_center_selected.png",
      badge: 'New'
    }],
    selectRoomID: '',
    replayList: []
    // replayList: [
    //   { 
    //     room_id: '123',
    //     room_name: 'Givenchy/纪梵希高定香榭天鹅',
    //     room_img: '../../resource/m0.png',
    //     play_count: 2345,
    //     playback_duration: '05:03:34',
    //     is_private: true,
    //     room_password: "124563",
    //     room_state: '回放',
    //   },
    //   {
    //     room_id: '123',
    //     room_name: 'OACH蔻驰Charlie 27 Carryal单肩斜挎手提包女包包2952过长样式挎手提包女包包2952过',
    //     room_img: '../../resource/m0.png',
    //     play_count: 2345,
    //     playback_duration: '05:03:34',
    //     is_private: true,
    //     room_password: "124563",
    //     room_state: '回放',
    //   },
    //   {
    //     room_id: '123',
    //     room_name: 'Vero Moda2020春夏新款褶皱收腰蕾丝拼接雪纺连衣裙',
    //     room_img: '../../resource/m0.png',
    //     play_count: 2345,
    //     playback_duration: '05:03:34',
    //     is_private: true,
    //     room_password: "124563",
    //     room_state: '回放',
    //   },
    //   {
    //     room_id: '123',
    //     room_name: 'Vero Moda2020春夏新款褶皱收腰蕾丝拼接雪纺连衣裙',
    //     room_img: '../../resource/m0.png',
    //     play_count: 2345,
    //     playback_duration: '05:03:34',
    //     is_private: true,
    //     room_password: "124563",
    //     room_state: '回放',
    //   },
    //   {
    //     room_id: '123',
    //     room_name: 'Vero Moda2020春夏新款褶皱收腰蕾丝拼接雪纺连衣裙',
    //     room_img: '../../resource/m0.png',
    //     play_count: 2345,
    //     playback_duration: '05:03:34',
    //     is_private: true,
    //     room_password: "124563",
    //     room_state: '回放',
    //   },
    //   {
    //     room_id: '123',
    //     room_name: 'Vero Moda2020春夏新款褶皱收腰蕾丝拼接雪纺连衣裙',
    //     room_img: '../../resource/m0.png',
    //     play_count: 2345,
    //     playback_duration: '05:03:34',
    //     is_private: true,
    //     room_password: "124563",
    //     room_state: '回放',
    //   },
    // ],
  },
  onLoad: function (options) {
    console.log('onLoad', options);
    let rect = wx.getMenuButtonBoundingClientRect();
    const top = rect.top;
    const height = rect.height;
    this.setData({
      top,
      height
    });
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
    // this.fetchRooms();
  },
  onUnload: function () {
    this.stopRefresh();
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {

  },

  fetchRooms() {
    //return
    if (wx.getStorageSync('sessionId')) {
      if (this.data.state === 'list') {
        this.getRoomList(18);
      } else if (this.data.state === 'center') {
        this.getRoomList(16, wx.getStorageSync('uid'));
      }
    }
  },
  /**
   * 
   * @param {*} uid 
   * @param {*} status 1未开始; 2 直播中; 4 已结束; 8 禁播; 16 可回放, 多个累加
   */
  getRoomList(status = undefined, uid = undefined) {
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
        "uid": uid,
        "status": status
      },
      success(res) {
        self.stopRefresh();
        if (res.data.ret && res.data.ret.code === 0) {
          console.error('roomList ', res.data.room_list);
          if (res.data.room_list && res.data.room_list.length) {
            const roomList = res.data.room_list
              //.filter(item => item.room_id.startsWith('e-'))
              .map(item => {
                item.room_show_name = item.room_id.slice(2);
                console.log('show_name', item.room_show_name);
                // item.roomState = '直播中';
                item.has_playback = true;
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
        this.stopRefresh()
      }
    })
  },
  /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
  // onPullDownRefresh() {
  //   console.log('>>>[liveroom-roomList] onPullDownRefresh');
  //   this.getRoomList();
  // },
  refresh() {
    console.log('>>>[liveroom-roomList] refresh');
    this.fetchRooms();
  },
  stopRefresh() {
    wx.hideLoading();
    wx.stopPullDownRefresh();
  },
  // 点击进入房间
  onClickItem(e) {
    console.log(e);
    const { currentTarget: { dataset: { id, name, roomImg, anchorId, anchorName, avatar, roomPassword } } } = e;
    console.log('>>>[liveroom-roomList] onClickItem, item is: ', id);

    // 防止两次点击操作间隔太快
    let nowTime = new Date();
    if (nowTime - this.data.tapTime < 1000) {
      return;
    }
    this.setData({
      tapTime: nowTime,
      selectRoomID: id
    })
    if (roomPassword) {
      this.setData({
        isShowPassword: true,
      })
      return;
    }
    this.enterRoom();

  },
  enterRoom() {
    const selectRoom = this.data.roomList.find(item => item.room_id === this.data.selectRoomID);
    console.log('selectRoom', selectRoom);
    const { room_id, room_name, nickname, avatar, anchor_id_name, room_img } = selectRoom;
    const userID = 'anchor' + wx.getStorageSync('uid');
    if (anchor_id_name === userID) {

      const url = '../room/index?roomID=' + room_id + '&roomName=' + room_name + '&loginType=anchor' + '&nickName=' + nickname + '&avatar=' + avatar
      // + '&roomImg=' + roomImg;
      wx.navigateTo({
        url: url,
      });

    } else {
      const url = '../room/index?roomID=' + room_id + '&roomName=' + room_name + '&anchorID=' + anchor_id_name + '&nickName=' + nickname + '&avatar=' + avatar + '&roomImg=' + room_img + '&loginType=audience';

      wx.navigateTo({
        url: url
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
  cancelPassword() {

  },
  confirmPassword(e) {
    let self = this;
    const { password } = e.detail;
    console.log('password', password);
    wx.request({
      url: BaseUrl + '/app/check_room_password',
      method: 'POST',
      data: {
        "session_id": wx.getStorageSync('sessionId'),
        "live_appid": liveAppID,
        "uid": wx.getStorageSync('uid'),
        "room_id": self.data.selectRoomID,
        "room_password": password
      },
      success(res) {
        if (res.statusCode === 200) {
          console.log('del playback suc', res);
          self.enterRoom();
        }
      },
      fail(e) {
        console.error('del playback fail', e);
      }
    })
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
      this.fetchRooms();
    });
  },
  getRole(callback = this.fetchRooms.bind(this)) {
    let self = this;
    // 登录
    loginApp(self.data.userInfo.nickName).then(role => {
      console.log('role', role);
      self.setData({
        role,
      });
      callback && callback();
    });
  },
  tabChange(e) {
    const { index, item } = e.detail;
    console.log('tab change', e)
    const state = this.data.list[index].id;
    this.setData({
      state
    }, () => {
      this.fetchRooms();
    });
  },
  delReplay(e) {
    const { room_id } = e.detail.content;
    console.log('delReplay', room_id);
    wx.request({
      url: BaseUrl + '/app/delete_playback',
      method: 'POST',
      data: {
        "session_id": wx.getStorageSync('sessionId'),
        "live_appid": liveAppID,
        "uid": wx.getStorageSync('uid'),
        "room_id": room_id,
      },
      success(res) {
        console.log('del playback suc', res);
      },
      fail(e) {
        console.error('del playback fail', e);
      }
    })
  }
});