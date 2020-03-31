// components/confirm-modal/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isShow: {
      type: Boolean,
      value: true
    },
    title: {
      type: String,
      value: ''
    },
    cancelText: {
      type: String,
      value: ''
    },
    confirmText: {
      type: String,
      value: ''
    },
    bottom: {
      type: Number,
      value: 0
    },
    avatar: {
      type: String,
      value: ''
    },
    nickName: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    name: '',
    isShowTip: false,
    filePath: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    bindMessageInput(e) {
      this.setData({
        nickName: e.detail.value
      })
    },
    foucus() {
      this.setData({
        focus: true
      })
    },
    blur() {
      this.setData({
        focus: false
      })
    },
    cancel() {
      console.log('cancel');
      this.setData({
        isShow: false
      }, () => {
        this.triggerEvent('cancel', {

        })
      });
    },
    confirm() {
      console.log('confirm');
      var reg = /^[A-Za-z0-9\(\)\u4e00-\u9fa5]{4,30}$/;
      if (!reg.test(this.data.nickName)) {
        console.log("验证不通过");
        this.setData({
          isShowTip: true,
        })
      } else {
        console.log("验证通过");
        this.setData({
          isShow: false
        }, () => {
          this.triggerEvent('confirm', {
            name: this.data.nickName,
            filePath: this.data.filePath
          })
        })
      }
    },
    btnClick() {

      let self = this;
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success(res) {
          // tempFilePath可以作为img标签的src属性显示图片
          const tempFilePaths = res.tempFilePaths
          self.setData({
            filePath: tempFilePaths[0],
            avatar:tempFilePaths[0]
          })
          console.log('tempFilePaths', tempFilePaths);
          // console.log('sessionId', typeof wx.getStorageSync('sessionId'))
        }
      })

    },
    modalMaskClick() {
      console.log('modalMaskClick');
      if (this.data.isShowTip) {
        this.setData({
          isShowTip: false
        })
      }
    }
  }
})
