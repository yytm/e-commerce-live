// components/setting-scope/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    title:{
      type:String,
      value:'标题'
    },
    //最大值
    max_scope:{
      type:Number,
      value:256
    },
    //最小值
    min_scope:{
      type:Number,
      value:0
    },
    //当前值
    scope:{
      type:Number,
      value:0
    }
  },

  observers:{
    max_scope(){
      this.setWidth()
    },
    min_scope(){
      this.setWidth()
    },
    scope(){
      this.setWidth()
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    width:0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    getRate(){
      return (this.data.max_scope - this.data.min_scope) / 600
    },
    getWidth(){
      return this.data.scope / this.getRate()
    },
    //获取小程序元素的宽高值等信息
    getViewPort(id){
      let resolve, reject
      try{
        let query = wx.createSelectorQuery()
        query.select(id).boundingClientRect()
        query.exec(response => resolve(response))
      }catch(error){
        reject && reject(error)
      }
      return new Promise((res,rej) => { resolve = res,reject = rej })
    },
    setWidth(value = this.getWidth()){
      if(value < 0){ value = 0 }
      if(value > 600){ value = 600 }
      this.setData({ width:value })
    },

    //移动开始
    touchstart(eventAgs){
      let { touches } = eventAgs
      let [{ clientX,clientY }] = touches

      this.startX = clientX
    },
    touchmove(eventAgs){
      let { touches } = eventAgs
      let [{ clientX, clientY }] = touches
      let xMove = clientX - this.startX
      // let width = this.data.width + xMove
      // this.setWidth(width)
    },
    touchend(){}
  },

  //组件生命周期
  lifetimes: {
    //在组件实例进入页面节点树时执行
    attached() {
      //清空数据
      this.setWidth()
      //
    },
    //在组件实例被从页面节点树移除时执行
    detached() { }
  }
})
