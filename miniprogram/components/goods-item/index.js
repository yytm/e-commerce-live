// components/goods-item/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    goods_img:{
      type:String,
      value:""
    },
    goods_desc:{
      type:String,
      value:""
    },
    price_text:{
      type:String,
      value:""
    },
    //是否显示按钮
    is_show_buttom:{
      type:Boolean,
      value:true
    },
    goods_button_style:{
      type:String,
      value:""
    },
    //按钮是否不可以点击
    goods_button_isunable:{
      type:Boolean,
      value:false
    },
    goods_button_text:{
      type:String,
      value:"推送"
    },

    goods_obj:{
      type:Object,
      value:{}
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
    goodsTap(){
      //事件通知
      this.triggerEvent("goodsTap", {
        goodsObj:this.data.goods_obj,
        itemView:this
      })
    },
    //自定义按钮被点击
    buttomTap(){
      //事件通知
      this.triggerEvent("goodsButtomTap", {
        goodsObj: this.data.goods_obj,
        itemView: this
      })
    }
  }
})
