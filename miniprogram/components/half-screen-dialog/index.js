// components/half-screen-dialog/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    title:{
      type:String,
      value:'标题'
    },
    //是否关闭当前
    is_close: {
      type: Boolean,
      value: false
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
    close(){
      this.setData({ is_close:true })
      //事件通知
      this.triggerEvent("close", { component:this })
    }
  }
})
