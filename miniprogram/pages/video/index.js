// miniprogram/pages/video/index.js
import { 
  requestGetRoomList,
  requestCheckRoomPassword,
  requestDeletePlayback,
  reuqestPlayback
} from '../../utils/server'
import { CallWxFunction } from '../../components/lib/wx-utils'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    roomInfo:{},
    videoURL:'',
    isAnchor:false,
    isShowRoomPwd:false,
    isShowDel:false,
    //商品列表配置
    is_show_goods_list:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let { roomID } = options
    requestGetRoomList({ room_id:roomID })
      .then((response = {}) => {
        let { room_list = [] } = response
        //说明房间存在
        if(Array.isArray(room_list) && room_list.length){
          return Promise.resolve(room_list[0])
        }
        //说明房间不存在
        return Promise.reject({ ret:{ msg:'您进入的回放已不存在' } })
      })
      .then(room => {
        //has_password 直播间是否需要输入密码
        let { has_password,anchor_id } = room
        //用户当前的id
        let uid = wx.getStorageSync('uid') || ''
        //是否是房间创建人
        let isAnchor = String(anchor_id) === String(uid)
        //保存房间数据
        this.setData({ roomInfo:room,isAnchor })
        //有房间密码的情况
        //并且不是自己创建的房间
        if(!!has_password && !isAnchor){
          this.setData({ isShowRoomPwd:true })
          return new Promise((res,rej) => { this.pwdResolve = res,this.pwdReject = rej })
        }
        return Promise.resolve(room)
      })
      .then(() => {
        //has_password 直播间是否需要输入密码
        let { playback_url } = this.data.roomInfo
        //没有回放地址的情况
        if(!!!playback_url){  return Promise.reject({ ret:{ msg:'回放地址已不存在' } }) }
        //计数自动增长
        reuqestPlayback({ room_id:roomID })
        //开始播放
        this.setData({ videoURL:playback_url })
      })
      .catch(error => {
        let { ret:{ message,msg } } = error
        let errorText = msg || message || '系统错误 请稍后重试'
        //异常信息提示 然后退出房间
        CallWxFunction('showModal',{
          title: '提示',
          confirmText:'确定',
          showCancel:false,
          content: errorText
        }).then(() => {
          //退出房间
          this.onRoomLogout()
        })
      })
  },
  /**
   * 商品列表 商品被点击
   */
  goodsTap(e){
    let { goodsObj, itemView, listView,boxView } = e.detail
    //前往商品
    let { url_type = 1,goods_url = "" } = goodsObj
    //url
    if(Number(url_type) === 1){
      return CallWxFunction('navigateTo',{ url:`/pages/web/index?url=${encodeURIComponent(goods_url)}` })
    }
    CallWxFunction('navigateToMiniProgram',{ appId:app_id,path:goods_url })
  },
  /**
   * 显示商品列表
   */
  showGoodsList(){
    this.setData({ is_show_goods_list:true })
  },
  onGoodsListHidden(e){
    this.setData({ is_show_goods_list:false })
  },
  /**
   * 确认密码
   * @param {*} e 
   */
  onConfirmPassword(e){
    let { password } = e.detail
    CallWxFunction('showLoading')
    requestCheckRoomPassword({ room_id:this.data.roomInfo.room_id,room_password:password })
      .then(response => {
        CallWxFunction('hideLoading')
        return typeof this.pwdResolve === 'function' && this.pwdResolve()
      })
      .catch(error => {
        CallWxFunction('hideLoading')
        if(this.pwdRetryCount >= 3){  
          return typeof this.pwdReject === 'function' && this.pwdReject(error)
        }
        this.pwdRetryCount = this.pwdRetryCount || 0
        this.pwdRetryCount ++
        let { ret:{ message,msg } } = error
        let errorText = msg || message || '系统错误 请稍后重试'
        //继续展示
        this.setData({ isShowRoomPwd:true })
        CallWxFunction('showToast',{
          title: errorText,
          icon:'none',
          duration:2500
        })
      })
  },
  /**
   * 删除回放
   */
  delPlayBack(){
    //非创建人 不可以删除
    if(!this.data.isAnchor){ return }
    this.setData({ isShowDel:true })
  },
  onConfirm(){
    this.setData({ isShowDel:false })
    //非创建人 不可以删除
    if(!this.data.isAnchor){ return }
    CallWxFunction('showLoading')
    requestDeletePlayback({ room_id:this.data.roomInfo.room_id })
      .then(() => {
        CallWxFunction('hideLoading')
        return CallWxFunction('showToast',{
          title:'删除成功',
          duration:2500
        })
      })
      .then(this.onRoomLogout.bind(this))
      .catch(error => {
        CallWxFunction('hideLoading')
        let { ret:{ message,msg } } = error
        let errorText = msg || message || '系统错误 请稍后重试'
        CallWxFunction('showToast',{
          title: errorText,
          icon:'none',
          duration:2500
        })
      })
  },
  onCancel(){
    this.setData({ isShowDel:false })
  },
  /**
   * 退出回放
   */
  onRoomLogout(){
    let backBtn = this.backBtn = this.backBtn || this.selectComponent('#backBtn')
    typeof backBtn.back === 'function' && backBtn.back()
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
      title: `${this.data.roomInfo.anchor_name || ''}的回放直播 快来观看`,
      path: `/pages/video/index?roomID=${this.data.roomInfo.room_id}`,
      imageUrl: this.data.roomInfo.room_img || '../..resource/invi.png',
    }
  }
})