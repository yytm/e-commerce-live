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
      value:9
    },
    //最小值
    min_scope:{
      type:Number,
      value:1
    },
    //当前值
    scope:{
      type:Number,
      value:0
    }
  },

  observers:{
   
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
    handleChange(e){
      let scope = e.detail.value
      this.setData({ scope })
      //事件通知
      this.triggerEvent('scopeChange',scope)
    }
  },

  //组件生命周期
  lifetimes: {
    //在组件实例进入页面节点树时执行
    attached() {
      //清空数据
      //
    },
    //在组件实例被从页面节点树移除时执行
    detached() { }
  }
})
