// miniprogram/pages/room/index2.js
import { 
  requestHd,
  requestIncreaseRoomLoveCount,
  requestClearRoom,
  requestGetRoomList,
  requestCheckRoomPassword,
  requestIncreaseRoomVisitCount
} from '../../utils/server'
import { CallWxFunction } from '../../components/lib/wx-utils'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    top:"87rpx",
    uid:'',
    //主播是否离开
    isLeave:false,
    //在线人数
    userCount:0,
    //房间ID
    roomid:'',
    //当前房间信息
    roomInfo:{},
    //是否显示输入房间密码框
    isShowRoomPwd:false,
    //设置框
    settingBox:{
      //前后摄像头
      switch_camera:true,
      //是否可用麦克风
      enable_mic:true,
      //美颜值
      beauty:1,
      //美白值
      whiteness:1,
      //是否显示设置光
      is_show_setting_box:false
    },
    //是否是主播
    isAnchor:false,
    //房间状态
    roomState:{
      //房间状态 1 未开始 2 直播中 4 已结束 8 禁播 16 可回放
      status:1,
      //访问人数
      visit_count:0,
      //点赞人数
      love_count:0,
    },
    //人员列表
    //userMap:new Map(),
    //消息列表 { nickName:"Johnny",message:"加入房间",id:"1" }
    messageList:[],
    toView:1,
    //欢迎列表控制
    wlRoom:{
      isShow:false,
      nickName:'',
      //当前被欢迎的用户
      nowUser:null,
      //是否已经开始了欢迎队列
      isStartQueue:false
    },
    //消息框配置
    messageBox:{
      //是否显示发送消息框
      isShowMessageBox: false,
      message:'',
      //input获得焦点
      focus:false,
      //键盘
      keyboardHold:false
    },
    //商品列表配置
    goodsBox:{
      is_show_goods_list:false
    },
    //推送商品相关
    hotGoods:{
      is_show_shop:false,
      goods_desc:'',
      price_text:'',
      goods_img:'',
      goods_url:'',
      goods_id:'',
      goods_no:''
    },
    //连麦配置
    JoinLive:{
      recvJoinLiver:{},
      isShowBox:false
    },
    //是否显示取消弹窗
    isShowConfirm:false,
    //主动点击结束直播的弹窗
    isShowEndJoinLiveConfirm:false
  },
  onPublishStateUpdate(){},
  onPlayStateUpdate(){},
  /**
   * 被踢下线
   */
  onKickOut(){
    CallWxFunction('showModal',{
      title: '提示',
      confirmText:'确定',
      showCancel:false,
      content: '您已被踢下线 请重新进入房间'
    }).then(() => {
      this.onRoomLogout()
    })
  },
  /**
   * 当发送成功了消息
   * @param {*} message 
   */
  onSendMessage(e){
    let { message } = e.detail
    let nickName = wx.getStorageSync('nickName') || ''
    !!message && this.addMessageList({ nickName,message })
  },
  /**
   * 接收到聊天信息
   * @param {*} messageList  消息列表
   * @param {*} roomId 
   */
  onRecvBigRoomMessage(e){
    let { messageList,roomId } = e.detail
    Array.isArray(messageList) && messageList.forEach(msg => {
      let { nickName,messageId:id,content } = msg
      !!content && this.addMessageList({ nickName,message:content,id })
    })
  },
  /**
    * 接收可靠消息 比如商品推送
    * @param {*} type  
    * @param {*} seq 消息序列号
    * @param {*} message  可为json字符串
  */
  onRecvReliableMessage(e){
    let { type,seq,message } = e.detail
    type = String(type)
    //推送的商品
    if(type === 'shop'){
      try{
        let shop = JSON.parse(message)
        this.setData({ 
          hotGoods:{
            is_show_shop:true,
            ...shop
          } 
        })
      }catch(e){}
    }
    //主播关闭了推送商品
    if(type === 'closeShop'){
      this.onHotShopClose()
    }
  },
  /**
   * 房间所有成员回调
   * @param {*} roomId 
   * @param {*} userList 
   */
  onGetTotalUserList(e){
    let { roomId, userList = [],component } = e.detail
    this.liveRoomComponent = component

    Array.isArray(userList) && userList.forEach(this.addWLQueue.bind(this))
  },
  /**
   * 房间成员变化回调
   * @param {*} roomId 
   * @param {*} userList 
   */
  onUserStateUpdate(e){
    let { roomId,userList } = e.detail
    //记录之前已经存在的用户列表
    let userMap = this.userMap = this.userMap || new Map()

    //遍历
    Array.isArray(userList) && userList.forEach(user => {
      let { action,idName,nickName,role } = user
      //离开房间  
      if(Number(action) === 2){
        //this.addMessageList({ nickName,message:"退出了房间" })
        userMap.delete(idName)
      }
      //加入房间
      if(Number(action) === 1){
        this.addWLQueue(user)
      }
    })
  },
  /**
   * 更新在线人数
   * @param {*} userCount 在线人数
   */
  onUpdateOnlineCount(e){
    let { userCount } = e.detail
    this.setData({ userCount })
  },
  /**
   * 
   * @param {*} isAnchor 是否是主播
   * @param {*} liveRoomComponent 
   */
  onStart(e){
    let { isAnchor,anchor_id_name,anchor_nick_name } = e.detail
    //已经开始推流或者拉流
    //this.setData({ isAnchor,anchor_id_name,anchor_nick_name })
    //保持心跳
    this.live()
  },
  /**
   * 退出直播间
   * @param {*} component 直播组件
   */
  onRoomLogout(e){
    this.data.isAnchor && requestClearRoom({ room_id:this.data.roomid })
    //退出房间
    this.onConfirm()
  },
  /**
   * 主播离开事件
   */
  onLeave(e){
    let { isLeave } = e.detail
    this.setData({ isLeave })
  },
  /**
   * 展示主播设置框
   */
  showSettingBox(){
    this.setData({ settingBox:{ ...this.data.settingBox,is_show_setting_box:true } })
  },
  /**
   * 切换前后摄像头
   */
  onSwitchCameraChange(){
    this.setData({ settingBox:{ ...this.data.settingBox,switch_camera:!this.data.settingBox.switch_camera } })
  },
  /**
   * 改变mic的状态
   */
  onSwitchMic(e){
    this.setData({ settingBox:{ ...this.data.settingBox,enable_mic:e.detail } })
  },
  /**
   * 美颜值改变
   */
  onBeautyChange(e){
    this.setData({ settingBox:{ ...this.data.settingBox,beauty:e.detail } })
  },
  /**
   * 美白值改变
   */
  onWhitenessChange(e){
    this.setData({ settingBox:{ ...this.data.settingBox,whiteness:e.detail } })
  },
  /**
   * 关闭热推商品
   */
  onHotShopClose(){
    this.setData({ hotGoods:{ ...this.data.hotGoods,is_show_shop:false } })
    this.data.isAnchor && this.sendCloseShop()
  },
  /**
   * 向主播发起连麦请求
   */
  requestJoinLive(){
    console.log('requestJoinLive tap')
    this.liveRoomComponent.requestJoinLive()
  },
  /**
   * 关闭连麦请求
   */
  endJoinLive(){
    this.liveRoomComponent.endJoinLive(this.data.JoinLive.recvJoinLive)
  },
  /**
   * 收到连麦请求
   * @param {*} recvJoinLiver 连麦者信息
   */
  onRecvJoinLiveRequest(e){
    let { recvJoinLiver,component } = e.detail
    //回复连麦请求
    this.setData({ JoinLive:{ recvJoinLiver,isShowBox:true } })
    //this.liveRoomComponent.responseJoinLive(recvJoinLiver,true/false)
  },
  /**
   * 同意连麦
   */
  onRevJoinLive(){
    this.liveRoomComponent.responseJoinLive(this.data.JoinLive.recvJoinLiver,true)
    this.setData({ JoinLive:{ ...this.data.JoinLive,isShowBox:false } })
  },
  /**
   * 拒绝连麦
   */
  onRejJoinLive(){
    this.liveRoomComponent.responseJoinLive(this.data.JoinLive.recvJoinLiver,false)
    this.setData({ JoinLive:{ ...this.data.JoinLive,isShowBox:false } })
  },
  /**
   * 心跳 更新房间信息
   */
  live(){
    let nextTick = () => {
      //this.liveHandler = setTimeout(this.live.bind(this),this.data.isAnchor? 5000 : 20000)
      this.liveHandler = setTimeout(this.live.bind(this),5000)
    }
    this.liveHandler && clearTimeout(this.liveHandler)

    requestHd({ room_id:this.data.roomid }).then(response => {
      let { visit_count,love_count,status } = response
      //status = 1 未开始 2 直播中 4 已结束 8 禁播16 可回放
      this.setData({ roomState:{ ...this.data.roomState,visit_count,love_count,status } })
      return Promise.resolve()
    }).then(nextTick).catch(nextTick)
  },
  /**
   * 跳转到商品
   * @param {*} goodsObj 
   */
  navigateShop(goodsObj = {}){
    //观众前往购买商品
    let { url_type = 1,goods_url = "",app_id } = goodsObj
    //url
    if(Number(url_type) === 1){
      return CallWxFunction('navigateTo',{ url:`/pages/web/index?url=${encodeURIComponent(goods_url)}` })
    }
    CallWxFunction('navigateToMiniProgram',{ appId:app_id,path:goods_url })
  },
  /**
   * 商品自定义按钮被点击
   */
  buttomTap(e){
    let { goodsObj, itemView, listView,boxView } = e.detail
    //推送商品
    if(this.data.isAnchor){
      return this.sendShop(goodsObj)
    }
    this.navigateShop(goodsObj)
  },
  /**
   * 当热门商品被点击
   */
  onHotShopTap(){
    //跳转逻辑
    //前往商品
    this.navigateShop(this.data.hotGoods)
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
   * 显示编辑消息框
   */
  showMessageBox(){
    this.setData({  messageBox:{ isShowMessageBox:true,focus:true  }  })
  },
  /**
   * 关闭消息框
   */
  hiddenMessageBox(){
    this.setData({ messageBox:{ isShowMessageBox:false,message:'',focus:false } })
  },
  /**
   * 辅助 暂时无作用
   */
  holdMessageBoxLoop(){},
  /**
   * 输入消息
   * @param {*} e 
   */
  messageInput(e){
    let { value } = e.detail
    this.setData({ messageBox:{ ...this.data.messageBox,message:value } })
  },
  /**
   * 推送商品
   * @param {*} shop 
   */
  sendShop(shop = {}){
    this.setData({ 
      hotGoods:{
        ...shop,
        is_show_shop:true
      } 
    })
    //关闭商品列表
    this.onGoodsListHidden()
    //推送商品
    this.liveRoomComponent.sendRoomMessage('shop',JSON.stringify(shop))
  },
  /**
   * 主播关闭推送商品
   */
  sendCloseShop(){
    //推送商品
    this.liveRoomComponent.sendRoomMessage('closeShop',JSON.stringify(this.data.hotGoods))
  },
  /**
   * 发送房间消息
   * 如果消息发送成功 会触发onSendMessage回调
   * @param {*} message 
   */
  sendMessage(message){
    let msg = typeof message === 'string'? message : this.data.messageBox.message
    //空消息就不发送了
    typeof msg === 'string' && !!msg && this.liveRoomComponent.sendMessage(msg)
    this.hiddenMessageBox()
  },
  /**
   * 添加消息
   * @param {*} messageSender 
   */
  addMessageList(messageSender){
    let len = this.data.messageList.length
    let { message,nickName = "",id = len + 1 } = typeof messageSender === 'string'? { message:messageSender } : messageSender
    this.data.messageList.push({ message,nickName,id})

    //保持100条消息
    let delCount = this.data.messageList.length - 100
    delCount = delCount > 0? delCount : 0
    //删除多余的消息
    this.data.messageList.splice(0,delCount)
    this.setData({ messageList:this.data.messageList,toView:`ITEM${id}` })
  },
  /**
   * 添加欢迎队列
   * @param {*} user 
   */
  addWLQueue(user){
    if(!!!user){ return }
    //记录之前已经存在的用户列表
    let userMap = this.userMap = this.userMap || new Map()
    //欢迎队列
    let wlQueue = this.wlQueue = this.wlQueue || []
    let { idName,nickName } = user
    //加入欢迎列表
    if(!userMap.has(idName)){
      wlQueue.push(user)
      userMap.set(idName,user)
      this.addMessageList({ nickName,message:"加入了房间" })
    }
    //执行欢迎队列
    this.startWLQueue()
  },
  /**
   * 展示欢迎队列
   */
  startWLQueue(){
    //已经开始了队列
    if(this.data.wlRoom.isStartQueue){ return }
    let handler
    let nextTick = () => {
      handler && clearTimeout(handler)
      let wlQueue = this.wlQueue = this.wlQueue || []
      let nowUser = wlQueue.shift()
      let nickName = nowUser && nowUser.nickName || ''
      //是否显示欢迎
      let isShow = !!nowUser
      this.setData({ wlRoom:{ ...this.data.wlRoom,isShow,nickName,nowUser,isStartQueue:isShow } })
      //三秒循环
      isShow && (handler = setTimeout(() => nextTick(),3000))
    }  
    this.setData({ wlRoom:{ ...this.data.wlRoom,isStartQueue:true } },nextTick)
  },
  /**
   * 点赞
   */
  increaseRoomLoveCount(){
    requestIncreaseRoomLoveCount({ room_id:this.data.roomid }).then(reponse => {
      this.setData({ roomState:{ ...this.data.roomState,love_count:this.data.roomState.love_count + 1 } })
    })
  },
  /**
   * 输入房间密码
   */
  onConfirmPassword(e){
    let { password } = e.detail
    requestCheckRoomPassword({ room_id:this.data.roomInfo.room_id,room_password:password })
      .then(response => {
        return typeof this.pwdResolve === 'function' && this.pwdResolve()
      })
      .catch(error => {
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
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let { roomID } = options
    console.log('page load',roomID)

    this.initRoomList(roomID)
    this.initDomReander()
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
   * 初始化房间数据
   */
  initRoomList(roomID){
    //获取房间信息
    requestGetRoomList({ room_id:roomID })
      .then((response = {}) => {
        let { room_list = [] } = response
        //说明房间存在
        if(Array.isArray(room_list) && room_list.length){
          return Promise.resolve(room_list[0])
        }
        //说明房间不存在
        return Promise.reject({ ret:{ msg:'您进入的直播间已不存在' } })
      })
      .then(room => {
        //has_password 直播间是否需要输入密码
        let { has_password,love_count,status,anchor_id } = room
        //房间信息
        let roomState = { ...this.data.roomState,love_count,status }
        //用户当前的id
        let uid = wx.getStorageSync('uid') || ''
        //是否是主播
        let isAnchor = String(anchor_id) === String(uid)
        //保存信息
        this.setData({ roomState,roomInfo:room,isAnchor })
        //有房间密码的情况
        //并且不是自己创建的房间
        if(!!has_password && String(anchor_id) !== String(uid)){
          //展示密码框
          this.setData({ isShowRoomPwd:true })
          return new Promise((res,rej) => { this.pwdResolve = res,this.pwdReject = rej })
        }
        return Promise.resolve()
      })
      .then(() => {
        //自动增加直播间观看次数
        requestIncreaseRoomVisitCount({ roomid:roomID })
        //正式进入房间
        this.setData({ roomid:roomID })
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
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    this.liveRoomComponent = this.selectComponent('#live')
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
   * 返回按钮被点击了
   * @param {*} e 
   */
  onBackTap(e){
    this.setData({ isShowConfirm:true })
  },
  /**
   * 主动点击了结束连麦
   */
  onTapEndJoinLive(e){
    this.setData({ isShowEndJoinLiveConfirm:true })
  },
  /**
   * 结束连麦框 点击了取消
   */
  onJoinLiveCancel(){
    this.setData({ isShowEndJoinLiveConfirm:false })
  },
  /**
   * 结束连麦框 点击了结束
   */
  onJoinLiveConfirm(){
    this.liveRoomComponent.endJoinLive()
    this.setData({ isShowEndJoinLiveConfirm:false })
  },
  /**
   * 取消结束直播
   */
  onCancel() {
    this.setData({ isShowConfirm: false })
  },
  /**
   * 退出房间
   */
  onConfirm() {
    let backBtn = this.backBtn = this.backBtn || this.selectComponent('#backBtn')
    typeof this.liveRoomComponent.logout === 'function' && this.liveRoomComponent.logout()
    typeof backBtn.back === 'function' && backBtn.back()
    this.setData({ isShowConfirm: false })
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    //this.liveRoomComponent.logout()
    this.liveHandler && clearTimeout(this.liveHandler)
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
      path: `/pages/room/index?roomID=${this.data.roomid}`,
      imageUrl: this.data.roomInfo.room_img || '../..resource/invi.png',
    }
  }
})