// miniprogram/components/set-room/index.js
const app = getApp();
const { BaseUrl, liveAppID } = app.globalData;

Component({

  /**
   * 页面的初始数据
   */
  data: {
    inputValue: '',
    roomID: '',
    roomName: '',
    loginType: '',
    coverImg: '',
    filePath: '',
    isFocus: false,
  },

  ready() {
    console.log('ready');
    this.getUserInfo();
    const coverImg = wx.getStorageSync('roomImg');
    if (coverImg) {
      this.setData({
        coverImg,
        // filePath: coverImg
      })
    }
  },

  methods: {
    getUserInfo() {
      let userInfo = app.globalData.userInfo;
      console.log('getUserInfo', userInfo);
      this.setData({
        hasUserInfo: true,
        userInfo: userInfo
      });
      if(!userInfo) {
        wx.getUserInfo({
          success: res => {
            app.globalData.userInfo = res.userInfo;
            this.setData({
              hasUserInfo: true,
              userInfo: res.userInfo
            });
          },
          fail: e => {
            console.error(e);
          }
        })
      }

    },
    bindKeyInput(e) {
      const val = e.detail.value;
      if (val.length >= 30) {
        this.setData({
          inputValue: val.slice(0, 29)
        }) 
        return;
      }
      this.setData({
        // roomID: e.detail.value,
        inputValue: e.detail.value,
        roomName: e.detail.value,
      })
    },
    focus() {
      this.setData({
        isFocus: true
      })
    },

    blur() {
      this.setData({
        isFocus: false
      })
    },

    createRoom: function () {
      var self = this;
      console.log('>>>[liveroom-roomList] onCreateRoom, roomID is: ' + self.data.roomID);
      
      if (self.data.roomName.length === 0) {
        wx.showToast({
          title: '创建失败，房间标题不可为空',
          icon: 'none',
          duration: 2000
        });
        return;
      }
  
      if (self.data.roomName.match(/^[ ]+$/)) {
        wx.showToast({
          title: '创建失败，房间标题不可为空格',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      const timestamp = new Date().getTime();
      self.setData({
        loginType: 'anchor',
        roomID: wx.getStorageSync('uid') + '-' + timestamp
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
            const filePath = self.data.coverImg !== wx.getStorageSync('roomImg') ? self.data.coverImg : ''
            self.triggerEvent('startLogin', {
              filePath: filePath,
              roomID: self.data.roomID,
              roomName: self.data.roomName,
              loginType: self.data.loginType
            })
            // const url = '../room/index?roomID=' + 'e-' + self.data.roomID + '&roomName=' + self.data.roomName + '&loginType=' + self.data.loginType 
            // // + '&roomImg=' + roomImg;
  
            // wx.navigateTo({
            //   url: url,
            // });
          }
        },
        fail(e) {
          console.error(e);
        }
      })
    },
  
    chooseImg: function() {
      let self = this;
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success (res) {
          // tempFilePath可以作为img标签的src属性显示图片
          const tempFilePaths = res.tempFilePaths
          self.setData({
            filePath: tempFilePaths[0],
            coverImg: tempFilePaths[0]
          })
          console.log('tempFilePaths', tempFilePaths);
          // console.log('sessionId', typeof wx.getStorageSync('sessionId'))
        }
      })
    },
  }

})