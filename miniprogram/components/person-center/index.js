// components/person-center/index.js
import { CallWxFunction,throttleByPromise,getCurrentPageWithArgs } from '../../components/lib/wx-utils'
import { requestListGoods,requestDeletePlayback,loginApp } from "../../utils/server.js"
const app = getApp()

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    roomList:{
      type:Array,
      value:[],
      observer(list){
        let lives = [],backs = []
        list.forEach(room => {
          let { status } = room
          status == 32 || status <= 2? lives.push(room) : backs.push(room)
        })
        //区分预告和回放列表
        this.setData({ liveList:lives,playBackList:backs })
        //请求商品列表
        this.onPersonUpdate().then(this.getGoodsList.bind(this))
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    //预告列表
    liveList:[],
    //回放列表
    playBackList:[],
    //商品列表
    goods_list:[],
    //用户信息
    userInfo:{},

    top:'174'
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 获取商品列表
     */
    getGoodsList(){
      //主播id
      let uid = wx.getStorageSync('uid') 
      //获取商品列表
      return requestListGoods({
        uid,page:1,count:3
      }).then(({ ret, goods_count = 0, goods_list = [] }) => {
        this.setData({ goods_list })
        return Promise.resolve(goods_list)
      })
    },
    /**
     * 当个人中心被修改
     */
    onPersonUpdate(){
      return app.getUserInfo()
        //业务逻辑登陆
        .then(userInfo => loginApp())
        .then(role => {
          this.setData({ userInfo:app.globalData.userInfo })
          return Promise.resolve(role)
        });
    },
    /**
     * 当直播动态被点击
     */
    onLiveTap(e){
      let { currentTarget:{ dataset:{ item:room = {} } } } = e
      let { room_type,room_id,status } = room
      //直播预告32 直播房间2
      let url = `/pages/${status == 32? 'featureLive' : 'room'}/index?roomID=${room_id}`
      //跳转页面
      CallWxFunction('navigateTo',{ url })
    },
    /**
     * 商品被点击
     */
    onShopTap(e){
      let { currentTarget:{ dataset:{ item:goodsObj = {} } } } = e
      //观众前往购买商品
      let { url_type = 1,goods_url = "",app_id } = goodsObj
      //url
      if(Number(url_type) === 1){
        return CallWxFunction('navigateTo',{ url:`/pages/web/index?url=${encodeURIComponent(goods_url)}` })
      }
      CallWxFunction('navigateToMiniProgram',{ appId:app_id,path:goods_url })
    },
    /**goo
     * 回放被点击
     */
    onPlayBackTap(e){
      let { currentTarget:{ dataset:{ item:room = {} } } } = e
      let { room_id } = room
      //跳转页面
      CallWxFunction('navigateTo',{ url:`/pages/video/index?roomID=${room_id}` })
    },
    /**
     * 点击更多商品
     */
    onMoreGoods(){
      //跳转页面
      CallWxFunction('navigateTo',{ url:`/pages/goodsList/index` })
    },
    /**
     * 和界面有关的初始化
     */
    initDomReander(){
      let systemInfo = wx.getSystemInfoSync()
      let rect = wx.getMenuButtonBoundingClientRect()
    
      let { statusBarHeight } = systemInfo
      const top = rect.top
      this.setData({ top:`${top + 5}px` });
    },
    /**
     * 跳转到个人信息编辑页面
     */
    onNavigateToUpdate(){
      //跳转页面
      CallWxFunction('navigateTo', { url: `/pages/personUpdate/index` })
    }
  },

  //页面生命周期
  pageLifetimes: {
    // 组件所在页面的生命周期函数
    show() {  
      
      this.onPersonUpdate().then(this.getGoodsList.bind(this))
    },
    hide() { 
      
    },
    resize() { },
  },


  //组件生命周期
  lifetimes:{
    //在组件实例进入页面节点树时执行
    attached(){
      this.initDomReander()
      console.log('加载')
      this.onPersonUpdate = throttleByPromise(this.onPersonUpdate.bind(this))
      this.getGoodsList = throttleByPromise(this.getGoodsList.bind(this))
    },
    //在组件实例被从页面节点树移除时执行
    detached(){
      console.log('消失')
    }
  }
})
