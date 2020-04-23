// components/person-center/index.js
import { CallWxFunction,throttleByPromise,getCurrentPageWithArgs } from '../../components/lib/wx-utils'
import { requestListGoods,requestGetRoomList,requestDeletePlayback,loginApp,requestGetDetailAnchorInfo } from "../../utils/server.js"
const app = getApp()

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    //主播uid
    anchor_uid:{
      type:String,
      //如果外部没有传递uid  默认使用自己的uid
      value:wx.getStorageSync('uid'),
      //监听数据变化
      observer(uid){
        uid && this.refreshList(Number(uid))
      }
    },
    //是否是主播 控制显示邀请主播 分享 设置等
    isAnchor:{
      type:Boolean,
      value:true
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

    isShowConfirm:false,
    top:'174'
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 刷新预告 直播 回放 以及 商品列表 和 个人数据
     */
    refreshList(uid = Number(this.data.anchor_uid)){
      CallWxFunction('showLoading',{ mask:true })
      Promise.all([this.getRoomList(uid),this.getGoodsList(uid),this.onPersonUpdate(uid)])
        .then(response => {
          CallWxFunction('hideLoading')
        })
        .catch((error = {}) => {
          CallWxFunction('hideLoading')
          let { ret = {} } = error
          let { msg,message } = ret
          let errorText = msg || message || '获取信息失败 请稍后重试'
          CallWxFunction('showToast',{ title:errorText,icon:'none' })
        })
    },
    /**
     * 获取主播直播列表
     */
    getRoomList(uid = this.data.anchor_uid){
      return requestGetRoomList({ uid }) 
        .then(res => {
          let { room_list = [] } = res
          //临时记录预告主播和回放的列表
          let lives = [],backs = []
          room_list.forEach(room => {
            let { status } = room
            if(room.start_live_time){
              let time = new Date(room.start_live_time)
              room.start_live_time = `${time.getMonth() + 1}月${time.getDate()}日  ${time.getHours()}:${time.getMinutes()}`
            }
            status == 32 || status <= 2? lives.push(room) : backs.push(room)
          })
          //区分预告和回放列表
          this.setData({ liveList:lives,playBackList:backs })
          return Promise.resolve(room_list)
        })
    },
    /**
     * 获取商品列表
     */
    getGoodsList(uid = this.data.anchor_uid){
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
    onPersonUpdate(uid = this.data.anchor_uid){
      return app.getUserInfo()
        //业务逻辑登陆
        .then(userInfo => loginApp())
        .then(() => requestGetDetailAnchorInfo({ uid:Number(uid) }))
        .then(userInfo => {
          let { anchor_info } = userInfo
          anchor_info = anchor_info || userInfo
          app.globalData.userInfo = {
            ...app.globalData.userInfo,
            ...anchor_info
          }
          this.setData({ userInfo:app.globalData.userInfo })
          return Promise.resolve(userInfo)
        })
    },
    onCancel(){
      this.setData({ isShowConfirm:false })
    },
    onConfirm(){
      let res = this.delInfo
      this.setData({ isShowConfirm:false })
      if(!res || !(res instanceof Promise)){ return }

      res.then(room => {
        return requestDeletePlayback({ room_id:room.room_id })
      })
      // .then(() => {
      //   return CallWxFunction('showToast',{ title:'删除成功',icon:'none' })
      // })
      .then(() => {
        //this.refreshHandler = setTimeout(this.refreshList.bind(this), 1000)
        this.refreshList()
      })
      .catch((error = { }) => {
        console.error(error)
        let { ret = {} } = error
        let { msg,message } = ret
        let errorText = msg || message || '删除失败'
        CallWxFunction('hideLoading')
        CallWxFunction('showToast',{ title:errorText,icon:'none' })
        return Promise.resolve([])
      })

    },
    /**
     * 被点击了删除回放
     */
    onDel(e){
      let { currentTarget:{ dataset:{ item:room = {} } } } = e
      this.delInfo = new Promise((res) => res(room))
      this.setData({ isShowConfirm:true })
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
      this.onPersonUpdate = throttleByPromise(this.onPersonUpdate.bind(this))
      this.getGoodsList = throttleByPromise(this.getGoodsList.bind(this))
    },
    //在组件实例被从页面节点树移除时执行
    detached(){
      
    }
  }
})
