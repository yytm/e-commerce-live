// components/authorize/index.js
const app = getApp();

Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  /**
   * 组件的属性列表
   */
  properties: {
    // 弹窗显示控制
    isShow: {
      type: Boolean,
      value: false
    },
    // 弹窗标题
    title: {
      type: String,
      value: '标题' // 默认值
    },
    subTitle: {
      type: String,
      value: '子标题'
    },
    // 弹窗内容
    content: {
      type: String,
      value: '弹窗内容'
    },

    // 弹窗确认按钮文字
    confirmText: {
      type: String,
      value: '确定'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    
  },

  /**
   * 组件的方法列表
   */
  methods: {
    //隐藏弹框
    hideDialog() {
      this.setData({
        isShow: !this.data.isShow
      })
    },
    //展示弹框
    showDialog() {
      this.setData({
        isShow: !this.data.isShow
      })
    },
    /**
    * triggerEvent 组件之间通信
    */
    confirmEvent() {
      console.log('confirmEvent')
      this.triggerEvent("confirmEvent");
    },

    bindGetUserInfo(e) {
      console.log(e, e.detail.userInfo);
      if (e.detail.userInfo) {
        app.globalData.userInfo = e.detail.userInfo;
        this.triggerEvent('GetUserInfo', {
          userInfo: e.detail.userInfo
        })
      } else {
        wx.showModal({
          title: '提示',
          content: '需获取信息用于登录，请重新登录',
        })
      }
    }
  }
})
