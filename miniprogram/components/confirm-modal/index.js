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
      this.setData({
        isShow: false
      }, () => {
        this.triggerEvent('confirm', {

        })
      })
    }
  }
})
