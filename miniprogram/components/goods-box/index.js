// components/goods-box/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    //商品列表
    goods_list:{
      type:Array,
      value:[]
      // value:[
      //   {
      //     "goods_id": 1,
      //     "goods_no": "10010",
      //     "goods_desc": "小米Mx全网通高适配版",
      //     "goods_url": "xxx",
      //     "price": 1399,
      //     "price_text": "¥ 1,399",
      //     "goods_img": "xxx",
      //     "is_show_buttom":true
      //   }
      // ]
    },
    //是否关闭当前
    is_close:{
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
    goodsTap(e){
      let { goodsObj, itemView } = e.detail
      //事件通知
      this.triggerEvent("goodsTap", {
        goodsObj, itemView,listView:this
      })
    },
    //商品自定义按钮被点击
    buttomTap(e){
      let { goodsObj, itemView } = e.detail
      //事件通知
      this.triggerEvent("buttomTap", {
        goodsObj, itemView, listView: this
      })
    },
    //无商品的时候 刷新按钮被点击
    refreshTap(){
      //事件通知
      this.triggerEvent("refresh", { listView: this });
    },
    close(){
      this.setData({
        is_close:true
      })
      //事件通知
      this.triggerEvent("close", {
        listView: this
      })
    }
  }
})
