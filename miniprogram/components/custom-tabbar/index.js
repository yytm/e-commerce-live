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
  }
})
