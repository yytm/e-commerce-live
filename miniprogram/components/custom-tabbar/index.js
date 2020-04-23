// components/custom-tabbar/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    extClass: {
      type: String,
      value: ''
    },
    list: {
      type: Array,
      value: []
    },
    current: {
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
    tabChange(e) {
      var index = e.currentTarget.dataset.index;

      if (index === this.data.current) {
        return;
      }
      this.setData({
        current: index
      });
      this.triggerEvent('change', { index: index, item: this.data.list[index] });
    },
    btnClick() {
      this.triggerEvent('btnClick', {});
    }
  },

  //页面生命周期
  pageLifetimes: {
    // 组件所在页面的生命周期函数
    show() {  },
    hide() {  },
    resize() { },
  },

  //组件生命周期
  lifetimes: {
    //在组件实例进入页面节点树时执行
    attached() {   
      
    },
    //在组件实例被从页面节点树移除时执行
    detached() { 
      
    }
  }
})
