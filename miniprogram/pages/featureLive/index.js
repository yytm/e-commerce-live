// miniprogram/pages/featureLive/index.js
import { 
  requestGetRoomList
} from '../../utils/server'
import { CallWxFunction } from '../../components/lib/wx-utils'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    //房间ID
    roomid:'',
    //当前房间信息
    roomInfo:{},
    //是否是主播
    isAnchor:false,
    //商品列表配置
    goodsBox:{
      is_show_goods_list:false
    }
  },
  /**
   * 初始化房间数据
   */
  initRoomList(roomID = this.data.roomid){
    CallWxFunction('showLoading')
    //获取房间信息
    return requestGetRoomList({ room_id:roomID })
      .then((response = {}) => {
        let { room_list = [] } = response
        //说明房间存在
        if(Array.isArray(room_list) && room_list.length){
          return Promise.resolve(room_list[0])
        }
        //说明房间不存在feature
        return Promise.reject({ ret:{ msg:'您进入的直播预告已不存在' } })
      })
      .then(room => {
        let { anchor_id } = room
        //用户当前的id
        let uid = wx.getStorageSync('uid') || ''
        //是否是主播
        let isAnchor = String(anchor_id) === String(uid)
        CallWxFunction('hideLoading')
        //传递房间信息给组件
        let featureComponent = this.selectComponent('#feature')

        //保存信息
        this.setData({ roomInfo:room,isAnchor })
        //传递信息
        featureComponent.initRoomInfo(room,isAnchor)
        return Promise.resolve()
      })
      .catch(error => {
        let { ret = {} } = error || {}
        let { message,msg } = ret
        let errorText = msg || message || '系统错误 请稍后重试'
        CallWxFunction('hideLoading')
        //异常信息提示 然后退出房间
        CallWxFunction('showModal',{
          title: '提示',
          confirmText:'确定',
          showCancel:false,
          content: errorText
        }).then(() => { })
      })
  },

  /**
   * 商品列表 商品被点击
   */
  goodsTap(e){
    let { goodsObj, itemView, listView,boxView } = e.detail

    this.navigateShop(goodsObj)
  },
  /**
   * 显示商品列表
   */
  showGoodsList(){
    this.setData({ goodsBox:{ ...this.data.goodsBox,is_show_goods_list:true } })
  },
  onGoodsListHidden(e){
    this.setData({ goodsBox:{ ...this.data.goodsBox,is_show_goods_list:false } })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let scene = decodeURIComponent(options.scene)
    let { roomID } = options.scene? scene : options
    console.log('page load',roomID)
    this.setData({ roomid:roomID })
    //this.initRoomList(roomID)
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.initRoomList()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: `${this.data.roomInfo.anchor_name || ''}正在直播 快来观看`,
      path: `/pages/featureLive/index?roomID=${this.data.roomid}`,
      imageUrl: this.data.roomInfo.room_img || '../..resource/invi.png',
    }
  }
})