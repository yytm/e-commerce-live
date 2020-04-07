// components/room-checkbox/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    //是否被选中
    isCheck:{
      type:Boolean,
      value:false
    },
    innerText:{
      type:String,
      value:''
    },
    //checkbox旁边的icon
    iconPath:{
      type:String,
      value:'../images/icon-info.png'
    },
    //是否展示checkbox旁边的icon
    isShowICon:{
      type:Boolean,
      value:false
    },
    //是否展示提示冒泡
    isShowTips:{
      type:Boolean,
      value:false
    },
    //提示冒泡的文案
    tipsText:{
      type:String,
      value:""
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
    checkEvent(e){
      const val = !!!this.data.isCheck
      this.setData({
        isCheck: val
      })
      //通知事件
      this.triggerEvent("check", val)
    },
    showTips(){
      const val = !!!this.data.isShowTips
      this.setData({
        isShowTips:val
      })
      //事件通知
      this.triggerEvent("showTips",val)
      return true
    }
  }
})
