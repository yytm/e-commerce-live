// components/anchor-goods-list/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    anchor_id_name:{
      type:String,
      value:''
    },
    is_show_goods_list:{
      type:Boolean,
      value:false
    },
    isAnchor:{
      type:Boolean,
      value:false
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
    //商品被点击
    goodsTap(e) {
      //事件通知
      this.triggerEvent("goodsTap", e.detail)
    },
    //商品自定义按钮被点击
    buttomTap(e) {
      //事件通知
      this.triggerEvent("buttomTap", e.detail)
    },
    onGoodsListHidden() {
      this.setData({
        is_show_goods_list: false
      })
      //事件通知
      this.triggerEvent("close", { boxView: this })
    },
    onBeforeGoodsListRender(goods){
      let other = {
        is_show_buttom: true,
        goods_button_text: this.data.isAnchor ? '推送' : '前往购买',
        goods_button_isunable:false,
        goods_obj: goods
      }
      return { ...other, ...goods }
    }
  },

  //组件生命周期
  lifetimes: {
    //在组件实例进入页面节点树时执行
    attached() {
      this.goodsList = this.selectComponent('#goodsList')
      this.goodsList.onBeforeGoodsListRender = this.onBeforeGoodsListRender.bind(this)
    },
    //在组件实例被从页面节点树移除时执行
    detached() { }
  }
})
