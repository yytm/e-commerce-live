// components/room-input/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    placeholderStyle:{
      type:String,
      value:'color: rgba(255, 255, 255, 0.8); font-size: 28rpx;'
    },
    placeholder:{
      type:String,
      value:''
    },
    inputTest:{
      type:String,
      value:''
    },
    maxlength:{
      type:Number,
      value:140
    },
    inputType:{
      type:String,
      value:'text'
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
    holdInput(e){
      const val = e.detail.value
      this.setData({
        inputTest:val
      })
      //通知事件
      this.triggerEvent("input",val)
    }
  }
})
