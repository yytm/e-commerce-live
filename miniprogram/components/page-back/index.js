// components/page-back/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isAutoBack:{
      type:Boolean,
      value:true
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
    back(){
      let pages = getCurrentPages()
      //通知事件
      this.triggerEvent('back')
      if(pages.length > 1){
        wx.navigateBack({ delta:1 })
        return
      }
      wx.redirectTo({ url:'/pages/roomList/index' })
    },

    backTap(){
      if(this.data.isAutoBack){ return this.back() }
      //触发事件 通知返回按钮被点击了  
      //同时可以选择是否执行back
      this.triggerEvent('onBackTap',{ back:this.back.bind(this) })
    }
  }
})
