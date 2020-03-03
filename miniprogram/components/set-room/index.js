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
    coverImg: ''
  },

  methods: {
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
            self.triggerEvent('startLogin', {
              filePath: self.data.filePath,
              roomID: self.data.roomID,
              roomList: self.data.roomID,
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