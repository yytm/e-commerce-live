// components/merch-modal/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    merchandises: {
      type: Array,
      value: []
    },
    hideModal: {
      type: Boolean,
      value: true
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
    // 显示遮罩层 
    showModal: function () {
      console.log('showModal');
      var that = this;
      that.setData({
        hideModal: false
      })
      var animation = wx.createAnimation({
        duration: 150, //动画的持续时间 默认400ms 数值越大，动画越慢 数值越小，动画越快 
        timingFunction: 'linear', //动画的效果 默认值是linear 
      })
      this.animation = animation
      setTimeout(function () {
        that.fadeIn(); //调用显示动画 
      }, 10)
    },

    // 隐藏遮罩层 
    hideModal: function () {
      console.log('hideModal');
      var that = this;
      // var animation = wx.createAnimation({
      //   duration: 800, //动画的持续时间 默认400ms 数值越大，动画越慢 数值越小，动画越快 
      //   timingFunction: 'linear', //动画的效果 默认值是linear 
      // })
      // this.animation = animation
      // that.fadeDown(); //调用隐藏动画 
      // setTimeout(function() {
      that.setData({
        hideModal: true
      })
      that.fadeDown();
      // }, 720) //先执行下滑动画，再隐藏模块 
    },

    //动画集 
    fadeIn: function () {
      this.animation.translateY(0).step()
      this.setData({
        animationData: this.animation.export() //动画实例的export方法导出动画数据传递给组件的animation属性 
      })
    },
    fadeDown: function () {
      console.log(this.animation);
      this.animation.translateY(450).step()
      this.setData({
        animationData: this.animation.export(),
      })
    },
  }
})
