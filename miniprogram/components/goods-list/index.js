// components/goods-list/index.js
import { CallWxFunction } from '../lib/wx-utils'
import { requestListGoods } from '../../utils/server'


const clearObj = {
  //当前页面的商品
  goods_list: [],
  //所有商品数量
  goods_count: 0,
  //页面编码
  page:1,
  //页面条数
  count:10
}

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    //是否显示商品列表
    is_show_goods_list:{
      type:Boolean,
      value:false,
      observer(newVal,oldVal){
        if(newVal){ this.getListGoods() }
      }
    },
    //主播的ID
    uid:{
      type:String,
      value:""
    },
    //页面编码
    page:{
      type:Number,
      value:1
    },
    //页面条数
    count:{
      type:Number,
      value:10
    }
  },

  /**
   * 组件的初始数据
   */
  data: { ...clearObj },

  /**
   * 组件的方法列表
   */
  methods: {
    //获取商品列表
    getListGoods(){
      requestListGoods({
        uid:this.data.uid,
        page:this.data.page,
        count:this.data.count
      }).then(({ ret, goods_count = 0, goods_list = [] }) => {
        goods_list = [
          {
            "goods_id": 1,
            "goods_no": "10010",
            "goods_desc": "小米Mx全网通高适配版",
            "goods_url": "xxx",
            "price": 1399,
            "price_text": "¥ 1,399",
            "goods_img": "xxx",
            "is_show_buttom":true
          }
        ]
        let list = Array.isArray(goods_list) && 
          typeof this.onBeforeGoodsListRender === 'function' && 
          goods_list.map(this.onBeforeGoodsListRender) || []
        this.setData({ goods_count,goods_list:list })
      }).catch(error => {
        console.log(error)
      })
    },

    //商品被点击
    goodsTap(e) {
      let { goodsObj, itemView, listView } = e.detail
      //事件通知
      this.triggerEvent("goodsTap", {
        goodsObj, itemView, listView,boxView:this
      })
    },
    //商品自定义按钮被点击
    buttomTap(e) {
      let { goodsObj, itemView, listView } = e.detail
      //事件通知
      this.triggerEvent("buttomTap", {
        goodsObj, itemView, listView,boxView:this
      })
    },
    close() {
      this.setData({
        is_show_goods_list: false
      })
      //事件通知
      this.triggerEvent("close", { boxView: this })
    }
  },

  //组件生命周期
  lifetimes: {
    //在组件实例进入页面节点树时执行
    attached() {
      //获取启动数据
      //let { query = {} } = wx.getEnterOptionsSync()
      //清空数据
      this.setData({ ...clearObj })
    },
    //在组件实例被从页面节点树移除时执行
    detached() { }
  }
})
