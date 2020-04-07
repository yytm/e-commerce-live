// components/alert-modal/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    content:{
      type:String,
      value:""
    },
    showCancel:{
      type:Boolean,
      value:false
    },
    cancelText:{
      type:String,
      value:"取消"
    },
    confirmText:{
      type:String,
      value:"确定"
    },
    isShow:{
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
    close(){
      this.setData({ isShow:false })
      this.triggerEvent('close')
    },
    cancel(){
      this.triggerEvent("cancel")
    },
    confirm(){
      this.triggerEvent('confirm')
    }
  }
})
