// miniprogram/pages/room/index2.js
import { requestHd } from '../../utils/server'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    uid:'',
    //主播是否离开
    isLeave:false,
    //在线人数
    userCount:0,
    //房间ID
    roomid:'',
    //是否禁用麦克风
    disable_mic:false,
    //是否是主播
    isAnchor:false,
    //主播id
    anchor_id_name:'',
    //主播昵称
    anchor_nick_name:'',
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
      goods_list:[],
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
    }
  },

  /**
   * 连麦申请
   */
  recvJoinLive(){},
  onPublishStateUpdate(){},
  onPlayStateUpdate(){},
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
    //推送的商品
    if(typeof type === 'string' && type === 'shop'){
      try{
        let { 
          goods_desc = '',
          price_text = '',
          goods_img = '',
          goods_url = '',
          goods_id = '',
          goods_no = ''
        } = JSON.parse(message)
        this.setData({ 
          hotGoods:{
            is_show_shop:true,
            goods_desc,price_text,goods_img,goods_url,goods_id,goods_no
          } 
        })
      }catch(e){}
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
  onUserStateUpdate(roomId,userList){
    //记录之前已经存在的用户列表
    let userMap = this.userMap = this.userMap || new Map()

    //遍历
    Array.isArray(userList) && userList.forEach(user => {
      let { action,idName,nickName,role } = user
      //离开房间  
      if(Number(action) === 2 && userMap.has(idName)){
        this.addMessageList({ nickName,message:"退出了房间" })
        userMap.delete(idName)
      }
      //加入房间
      if(Number(action) === 1 && !userMap.has(idName)){
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
    this.setData({ isAnchor,anchor_id_name,anchor_nick_name })
    //保持心跳
    this.live()
  },
  /**
   * 主播离开事件
   */
  onLeave(e){
    let { isLeave } = e.detail
    this.setData({ isLeave })
  },
  /**
   * 当热门商品被点击
   */
  onHotShopTap(){
    //跳转逻辑
  },
  /**
   * 关闭热推商品
   */
  onHotShopClose(){
    this.setData({ hotGoods:{ ...this.data.hotGoods,is_show_shop:false } })
  },
  /**
   * 心跳 更新房间信息
   */
  live(){
    let nextTick = () => {
      this.liveHandler = setTimeout(this.live.bind(this),this.data.isAnchor? 5000 : 20000)
    }
    this.liveHandler && clearTimeout(this.liveHandler)

    requestHd({ room_id:this.data.room_id }).then(response => {
      let { visit_count,love_count,status } = response
      this.setData({ roomState:{ ...this.data.roomState,visit_count,love_count,status } })
      return Promise.resolve()
    }).then(nextTick).catch(nextTick)
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
    //观众前往购买商品
  },
  /**
   * 商品列表 商品被点击
   */
  goodsTap(e){
    let { goodsObj, itemView, listView,boxView } = e.detail
    //前往商品
  },
  /**
   * 显示商品列表
   */
  showGoodsList(){
    this.setData({ goodsBox:{ ...this.data.goodsBox,is_show_goods_list:true } })
  },
  onGoodsListHidden(e){
    let { boxView } = e.detail
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
    this.liveRoomComponent.sendRoomMessage('shop',JSON.stringify(shop))
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
    let { message,nickName = "",id = len + 1 } = typeof messageSender === 'string'? { message:messageSender } : messageSender
    let len = this.data.messageList.length
    this.data.messageList.push({ message,nickName,id})

    //保持100条消息
    let delCount = this.data.messageList.length - 100
    delCount = delCount > 0? delCount : 0
    //删除多余的消息
    this.data.messageList.splice(0,delCount)
    this.setData({ messageList:this.data.messageList })
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
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let { roomID } = options
    roomID = 'room651585142040049'
    this.setData({ roomid:roomID })
    console.log('page load',roomID)
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

  }



    // /**
    //  * 检查是否有在播房间
    //  */
    // isRevertRoom(){
    //   //获取当前用户在播房间
    //   return requestGetSelfRoomList({ status:2 }).then(response => {
    //     let { room_list = [] } = response
    //     //当前直播的房间列表
    //     if(room_list.length > 0){
    //       return this.switchRoom(room_list).catch(() => ({ roomid:this.data.roomid }))
    //     }
    //     //返回默认roomid
    //     return Promise.resolve({ roomid:this.data.roomid })
    //   })
    // },
    // //根据已存在的直播房间列表 让用户选择恢复哪个房间的直播
    // switchRoom(room_list = []){
    //   //获得一个
    //   let room = room_list.shift()
    //   //没有可以选择的直播房间了
    //   if(!room){ return Promise.reject() }
    //   //让用户选择恢复哪个直播房间
    //   return CallWxFunction('showModal',{
    //     title:'信息',
    //     content:`您有正在直播的房间:${room.room_name}，是否进行恢复直播？`
    //   }).then(response => {
    //     let { confirm } = response
    //     return confirm? Promise.resolve(room) : switchRoom(room_list)
    //   })
    // },
})