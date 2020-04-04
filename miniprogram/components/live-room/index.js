// components/live-room/index2.js
import { zegoLib } from './lib'
import { requestGetRoomToken,requestGetRoomList } from '../../utils/server'
import { CallWxFunction } from '../lib/wx-utils'

const app = getApp()

Component({
  /** 
   * 组件的属性列表
   */
  properties: {
    //房间id
    roomid:{
      type:String,
      value:'',
      observer(newVal){
        newVal && this.loginRoom()
      }
    },
    //美颜
    beauty:{
      type:Number,
      value:1
    },
    //美白
    whiteness:{
      type:Number,
      value:1
    },
    //是否禁声
    disable_mic:{
      type:Boolean,
      value:false
    },
    //切换前后摄像头
    switch_camera:{
      type:Boolean,
      value:true,
      //切换前后摄像头
      observer(){
        let pusherContent = this.data.mainPusher.pusherContext = this.data.mainPusher.pusherContext || wx.createLivePusherContext()
        pusherContent && pusherContent.switchCamera()
      }
    },
    //推流地址选项 数值; 默认0: 自动， 1：Zego服务器
    preferPublishSourceType:{
      type:Number,
      value:0,
      observer(newVal){
        //设置推流地址 默认0: 自动， 1：Zego服务器
        this.zegoLib && this.zegoLib.CallZegoLib('setPreferPublishSourceType',newVal)
      }
    },
    //拉流地址选项 数值; 默认0: 自动， 1：Zego服务器
    preferPlaySourceType:{
      type:Number,
      value:0,
      observer(newVal){
        //设置推流地址 默认0: 自动， 1：Zego服务器
        this.zegoLib && this.zegoLib.CallZegoLib('setPreferPlaySourceType',newVal)
      }
    }
  },

  options: {
    //纯字段属性
    pureDataPattern: /^zego/
  },
  

  /**
   * 组件的初始数据
   */
  data: {
    //主播是否离开
    isLeave:false,
    //是否是主播
    isAnchor:false,
    //是否可以开播 由room.status决定 status<=2 可以开播
    isCanPublish:false,
    //是否连接上sdk服务器
    isConnection:false,
    //主播配置
    mainPusher:{
      //随机生成
      stream_id:`zego${Date.now()}Main`,
      url: ''
    },
    //作为观众 主播的播放屏幕
    mainPlayer:{
      stream_id:'',
      url:''
    },
    //正在请求连麦的人
    recvJoinLiver:null,
    //观众是否正在请求连麦 主播不需要
    isStartRequestJoinLive:false,
    
    //子主播配置
    subPusher:{
      //随机生成
      stream_id:`zego${Date.now()}Sub`,
      url:''
    },
    //子播列表
    subPlayer:[],
    //lib的配置信息
    zegoConfig:{
      //appid
      appid:app.globalData.liveAppID,
      //上报log级别 0:debug 1:info 2:warn 3:error 100:disable
      remoteLogLevel:0,
      //本地log级别 0:debug 1:info 2:warn 3:error 98:report 100:disable
      logLevel:0,
      //即构服务器地址  'wss://wsliveroom1739272706-api.zego.im:8282/ws'
      server:app.globalData.server ,
      //远程log服务器地址 websocket地址  'https://wsslogger-demo.zego.im/httplog'
      logUrl:app.globalData.logUrl ,
      //观众是否可以创建房间
      audienceCreateRoom:true
    }
  },
  /**
   * 监听变化
   */
  observers:{
    preferPlaySourceType(newVal){
      //设置推流地址 默认0: 自动， 1：Zego服务器
      this.zegoLib && this.zegoLib.CallZegoLib('setPreferPlaySourceType',newVal)
    },
    //主播配置信息变更
    mainPlayer(newVal,oldVal){
      
    },
    //主播离开
    isLeave(newVal,oldVal){
      //发送事件
      this.triggerEvent('onLeave',{ isLeave:newVal,component:this })
    },
    //sdk连接状态
    isConnection(newVal,oldVal){
      //发送事件
      this.triggerEvent('isConnection',{ isConnection:newVal })
    },
    //观众是否正在连麦请求中
    isStartRequestJoinLive(newVal){
      if(newVal){
        return CallWxFunction('showToast',{
          title: '正在请求连麦',
          icon: 'none',
          duration: 2000
        })
      }
      CallWxFunction('hideLoading')
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    //小程序播放状态事件
    onPushStateChange(e){
      console.log('onPushStateChange',e)
      let lib = this.zegoLib
      if(typeof lib === 'undefined'){ return }
      let streamID = this.data.isAnchor? this.data.mainPusher.stream_id : this.data.subPusher.stream_id
      //lib.CallZegoLib('updatePlayerState',e.target.id,e)
      lib.CallZegoLib('updatePlayerState', streamID, e)
    },
    //小程序网络状态通知事件
    onPushNetStateChange(e){
      console.log('onPushNetStateChange',e)
      let lib = this.zegoLib
      if(typeof lib === 'undefined'){ return }
      let streamID = this.data.isAnchor ? this.data.mainPusher.stream_id : this.data.subPusher.stream_id
      lib.CallZegoLib('updatePlayerNetStatus', streamID,e)
    },
    onPlayStateChange(e){
      let lib = this.zegoLib
      if(typeof lib === 'undefined'){ return }
      lib.CallZegoLib('updatePlayerState',e.target.id, e)
    },
    onPlayNetStateChange(e){
      let lib = this.zegoLib
      if(typeof lib === 'undefined'){ return }
      lib.CallZegoLib('updatePlayerNetStatus',e.target.id, e)
    },
    //错误状态
    onPushError(e){
      console.error(e)
    },
    /**
     * 
     * 如果当前是主播 但是当前roomid存在于roomList 但是room数据里面的主播id和当前用户的主播不匹配 则认为当前主播是游客
     * 如果当前是主播 roomid存在于roomList 而且room数据里面的主播id和当前主播匹配 则认为当前是主播
     * 
     * @returns true 主播 false 游客
     */
    getRoomRole(){
      //当前用户登陆的角色 admin anchor audience
      let role = wx.getStorageSync('role')
      //当前主播的id
      let uid = wx.getStorageSync('uid')
      //如果当前角色是游客 直接返回
      if(role === 'audience'){ return Promise.resolve(false) }
      //获取当前appid下的直播列表
      return requestGetRoomList({ room_id:this.data.roomid,uid }).then(response => {
        let { room_list = [] } = response
        //查看当前的roomid 是否存在于正在直播的roomList中
        let room = room_list.find(rm => {
          //roomid相同 并且room的主播id等于自身
          return rm.room_id === this.data.roomid && String(uid) === String(rm.anchor_id)
        })
        //查看是否有在播房间的
        //status = 2 / status = 1未开始 直播中状态
        return Promise.resolve({ isAnchor:!!room,isCanPublish:room.status <= 2,room })
      }).catch(() => ({ isAnchor:false,isCanPublish:false }))
    },
    /**
     * 初始化房间
     * @param {*} roomid 房间id
     */
    initRoom(roomid = this.data.roomid){
      //获取房间token
      return requestGetRoomToken().then(({ room_token }) => {
        //创建zegoLib
        if(typeof this.zegoLib === 'undefined'){
          //调用登陆后 可获取到uid,nickName
          this.zegoLib = new zegoLib({
            ...this.data.zegoConfig,
            //用户的uid
            uid:String(wx.getStorageSync('uid')),
            //昵称
            nickName:wx.getStorageSync('nickName')
          })

          //先绑定事件 
          //等待推送房间成员 在成员里面看看是否有主播
          this.initZegoLibEvent()
        }
        //1 主播 2 观众
        let role = this.data.isAnchor? 1 : 2
        //调用lib的login
        return this.zegoLib.CallZegoLib('login',roomid,role,room_token)
      })
    },

    initZegoLibEvent(){
      let lib = this.zegoLib
      if(typeof lib === 'undefined'){ return }
      //设置房间人数变化 需要通知事件
      lib.CallZegoLib('setUserStateUpdate',true)
      
      //推流后，服务器主动推过来的，流状态更新 
      lib.on('onPublishStateUpdate',this.onPublishStateUpdate.bind(this))
      //拉流状态变更通知
      lib.on('onPlayStateUpdate',this.onPlayStateUpdate.bind(this))
      //获取主播信息
      lib.on('onGetAnchorInfo',this.onGetAnchorInfo.bind(this))
      //startPlayStream、startPublishStream 后，服务端主动推过来的流更新事件
      lib.on('onStreamUrlUpdate',this.onStreamUrlUpdate.bind(this))
      //服务器同步人数变化
      lib.on('onUpdateOnlineCount', this.onUpdateOnlineCount.bind(this))
      //房间成员变化回调
      lib.on('onUserStateUpdate',this.onUserStateUpdate.bind(this))
      //断网了
      lib.on('onDisconnect',this.onDisconnect.bind(this))
      //被踢下线
      lib.on('onKickOut',this.onKickOut.bind(this))
      //服务端主动推过来的 流的创建/删除事件；updatedType: { added: 0, deleted: 1 }；streamList：增量流列表
      lib.on('onStreamUpdated',this.onStreamUpdated.bind(this))
      //收到请求连麦信令
      lib.on('onRecvJoinLiveRequest',this.onRecvJoinLiveRequest.bind(this))
      //收到结束连麦信令
      lib.on('onRecvEndJoinLiveCommand',this.onRecvEndJoinLiveCommand.bind(this))
      //房间所有成员回调
      lib.on('onGetTotalUserList',this.onGetTotalUserList.bind(this))
      //收到房间其他用户发送的可靠消息
      lib.on('onRecvReliableMessage',this.onRecvReliableMessage.bind(this))
      //收到大房间消息
      lib.on('onRecvBigRoomMessage',this.onRecvBigRoomMessage.bind(this))
    }, 
    /**
     * 被踢下线通知
     */
    onKickOut(error){
      //发送事件
      this.triggerEvent('onKickOut',{ error })
    },
    /**
     * 和服务器断开
     */ 
    onDisconnect(){
      this.setData({ isConnection:false })
    },

    /**
     * 房间所有成员回调
     * @param {*} roomId 
     * @param {*} userList = 成员列表 {  
     *  idName	用户id
     *  nickName	用户昵称
     *  role	角色类型	数值 1:主播 2:观众
     * }
     */
    onGetTotalUserList(roomId, userList){
      //发送事件
      this.triggerEvent('onGetTotalUserList',{ roomId, userList,component:this })
    },
    /**
     * 推流后，服务器主动推过来的，流状态更新 
     * @param {*} type { start: 0, stop: 1 }，主动停止推流没有回调，其他情况均回调
     * @param {*} streamid 
     * @param {*} error  error > 10000 表示即构调度错误。否则表示小程序拉流错误
     */
    onPublishStateUpdate(type, streamid, error){
      //发送事件
      this.triggerEvent('onPublishStateUpdate',{ type, streamid, error,component:this })
    },
    /**
     * 拉流状态变更通知
     * @param {*} type  流状态类型	数值 start:0, stop:1, retry:2
     * @param {*} streamId  流id
     * @param {*} errorCode 错误码。error > 10000 表示即构调度错误.否则表示小程序拉流错误
     */
    onPlayStateUpdate(type, streamId, errorCode){
      //发送事件
      this.triggerEvent('onPlayStateUpdate',{ type, streamId, error:errorCode,component:this })
    },
    /**
     * 房间成员变化回调
     * 这里无需考虑推拉流的删除事件 因为会触发推拉流的update事件 在那里会具体的删除
     * @param {*} roomId  房间Id
     * @param {*} userList  成员列表 = {
     *  action: 行为{ 数值 1:进入房间 2:退出房间 }
     *  idName //用户id
     *  nickName	用户昵称
     *  role:	角色类型{ 数值 1:主播 2:观众 }
     *  loginTime	登录时间
     * }
     */
    onUserStateUpdate(roomId,userList){
      //发送事件
      this.triggerEvent('onUserStateUpdate',{ roomId,userList,component:this })
    },
    /**
     * 更新房间当前在线人数
     * @param {*} roomId  房间ID
     * @param {*} userCount  在线人数
     */
    onUpdateOnlineCount(roomId, userCount){
      //发送事件
      this.triggerEvent('onUpdateOnlineCount',{ roomId, userCount,component:this })
    },
    /**
     * 收到大房间的IM消息
     * @param {*} messageList 消息列表
     * @param {*} roomId 
     */
    onRecvBigRoomMessage(messageList, roomId){
      //发送事件
      this.triggerEvent('onRecvBigRoomMessage',{ messageList, roomId,component:this })
    },
    /**
     * 接收可靠消息 比如商品推送
     * @param {*} type  
     * @param {*} seq 消息序列号
     * @param {*} message  可为json字符串
     */
    onRecvReliableMessage(type, seq, message){
      //发送事件
      this.triggerEvent('onRecvReliableMessage',{ type, seq, message,component:this })
    },
    /**
     * 发送消息 一般适合商品推送等
     * @param {*} type 
     * @param {*} message  可为json字符串
     */
    sendRoomMessage(type,message){
      let lib = this.zegoLib
      //还未连接上服务器
      if(typeof lib === 'undefined' || !this.data.isConnection){
        let title = !this.data.isConnection? '还未连接上服务器 请稍后重试' : '你还没有输入消息'
        CallWxFunction('showToast',{
          title,
          icon: 'none',
          duration: 2000
        })
      }
      lib.CallZegoLib('sendReliableMessage',type,message).then(() => {
        //发送事件
        this.triggerEvent('onSendRoomMessage',{ message,type,component:this })
      })
    },
    /**
     * 发送消息 一般聊天消息
     * @param {*} message 
     */
    sendMessage(message = ""){
      let lib = this.zegoLib
      //还未连接上服务器
      if(!this.data.isConnection || !message || typeof lib === 'undefined'){
        let title = !this.data.isConnection? '还未连接上服务器 请稍后重试' : '你还没有输入消息'
        return CallWxFunction('showToast',{
          title,
          icon: 'none',
          duration: 2000
        })
      }
      let cloud = wx.cloud
      let err = 'cloud error'
      
      cloud.init()
      cloud.callFunction({
        name: 'msgcheck',
        data: { content: message }
      }).then(response => {
        let { result = {},errMsg = "" } = response
        //文案审核没有过
        if(result.errCode !== 0 && !errMsg.includes('ok')){
          return Promise.reject(err)
        }
        //发送文字消息
        return lib.CallZegoLib('sendBigRoomMessage',1,1,message)
      }).then(response => {
        //发送事件
        this.triggerEvent('onSendMessage',{ message,component:this })
      }).catch(error => {
        let content = error === err? '请注意言论' : '发送消息失败'
        CallWxFunction('showModal',{
          title: '提示',
          content,
          showCancel: false,
        })
      })
    },

    /* -------------------------- 连麦相关 --------------------------- */
    /**
     * 主动点击了结束连麦
     */
    onTapEndJoinLive(){
      //通知结束直播事件  可以通过调用当前组件的 endJoinLive 达到结束连麦的目的
      this.triggerEvent('onTapEndJoinLive',{ recvJoinLiver:this.data.recvJoinLiver,component:this,endJoinLive:this.endJoinLive.bind(this) })
    },
    /**
     * 关闭连麦
     */
    endJoinLive(joinLiver = this.data.recvJoinLiver){
      let lib = this.zegoLib
      if(typeof lib === 'undefined' || !!!joinLiver){ return }
      //非主播 默认关闭主播连麦
      let from_userid = this.data.isAnchor? joinLiver.from_userid : this.data.mainPlayer.anchor_id_name

      this.setData({ recvJoinLiver:(this.data.recvJoinLiver = '') })
      //关麦
      lib.CallZegoLib('endJoinLive',from_userid)
      
      //因为目前只支持一对一连麦 所以这里关闭所有subPlayer
      this.stopSubPlayer()

      //非主播逻辑
      if(!this.data.isAnchor){
        //关闭自身推流
        this.stopPusherByObj(this.data.subPusher)
      }
    },
    /**
     * 请求连麦
     * 默认向主播发起连麦
     * @param {*} destIdName 
     */
    requestJoinLive(destIdName = this.data.mainPlayer.anchor_id_name){
      let lib = this.zegoLib
      //还未连接上服务器
      if(!this.data.isConnection || typeof lib === 'undefined'){
        let title = !this.data.isConnection? '还未连接上服务器 请稍后重试' : '你还没有输入消息'
        return CallWxFunction('showToast',{
          title,
          icon: 'none',
          duration: 2000
        })
      }
      //防止多次请求
      if(this.data.isStartRequestJoinLive){ return }
      this.setData({ isStartRequestJoinLive:true })
      //请求连麦
      lib.client.requestJoinLive(destIdName,response => {
        console.log('requestJoinLive 请求成功',response)
      },error => {
        this.setData({ isStartRequestJoinLive:false })
        console.log('requestJoinLive 请求失败',error)
      },(result, fromUserId, fromUserName) => {
        let newStreamID = this.createStreamID()
        this.setData({ isStartRequestJoinLive:false,subPusher:{ ...this.data.subPusher,stream_id:newStreamID } })
        //拒绝连麦
        //或者主播正在连麦
        //subPusher > 0 说明有连麦
        if(result === false || this.data.subPusher.length > 0){
          return CallWxFunction('showToast',{
            title: '已拒绝连麦',
            icon: 'none',
            duration: 2000
          })
        }

        CallWxFunction('showToast',{
          title: '同意连麦，准备推流',
          icon: 'none',
          duration: 2000
        })
        //更新
        this.setData({ recvJoinLiver:{ from_userid:fromUserId, from_username:fromUserName }  })
        //推流
        !this.data.isAnchor && this.startPublishing(newStreamID)
      })
    },
    /**
     * 回复连麦者
     * @param {*} joinLiver  连麦者信息
     * @param {*} result  回复结果 true 允许  false 拒绝
     */
    responseJoinLive(joinLiver,result = false){
      let lib = this.zegoLib
      //非主播不能操作
      if(typeof lib === 'undefined' || !this.data.isAnchor){ return }
      let { requestId } = joinLiver
      //回复
      lib.CallZegoLib('respondJoinLive',requestId,result)
      
      //requestId
      let recvJoinLiver = result? joinLiver 
        //假如有正在连麦的 留住连麦的人
        : this.data.subPlayer.length? this.data.recvJoinLiver : ''
      //记录
      this.setData({ recvJoinLiver })
    },
    /**
     * 收到结束连麦信令
     * @param {*} requestId 
     * @param {*} from_userid 
     * @param {*} from_username 
     * @param {*} roomid 
     */
    onRecvEndJoinLiveCommand(requestId, from_userid, from_username, roomid){
      //当前是观众 停止观众自己的推流
      if(!this.data.isAnchor){
        //停止推流
        this.stopPusherByObj(this.data.subPusher)
      }else{
        //停止子主播的拉流
        this.stopSubPlayer()
      }
      //清空数据
      this.setData({ recvJoinLiver:(this.data.recvJoinLiver = '') })
    },
    /**
     * 收到请求连麦信令
     * @param {*} requestId 请求id
     * @param {*} from_userid 请求者userId
     * @param {*} from_username 请求者userName
     * @param {*} roomid 房间id
     */
    onRecvJoinLiveRequest(requestId, from_userid, from_username, roomid){
      let recvJoinLiver = { requestId, from_userid, from_username, roomid }

      if(!this.data.recvJoinLiver){
        //更新列表
        this.setData({ recvJoinLiver },() => {
          //去显示toast 逻辑  
          this.triggerEvent('onRecvJoinLiveRequest',{ recvJoinLiver,component:this })
        })
        return
      }
      
      //拒绝当前连麦
      //因为当前已经有一个连麦人
      this.responseJoinLive(recvJoinLiver,false)
    },
    /* -------------------------- 连麦相关 --------------------------- */

    /**
     * 登录成功后会回调主播信息
     * @param {*} anchor_userid  主播id
     * @param {*} anchro_username  主播昵称
     */
    onGetAnchorInfo(anchor_userid, anchro_username){
      //这里的主播ID 和 用户登陆的uid意义不一样  因为这里的主播ID实际上的真正在直播的
      //比如B主播 来到了 A主播的房间  这时候anchor_userid是A主播的ID uid是进入房间的B主播
      this.setData({ 
        mainPlayer:{
          ...this.data.mainPlayer,
          anchor_id_name:anchor_userid,
          anchor_nick_name:anchro_username
        }
      })
    },

    /**
     * 服务端主动推过来的 流的创建/删除事件；
     * @param {*} updatedType updatedType: { added: 0, deleted: 1 }；
     * @param {*} streamList streamList：增量流列表
     */
    onStreamUpdated(updatedType,streamList){
      let dataSender = { 
        mainPlayer:{ ...this.data.mainPlayer },
        subPlayer:[...this.data.subPlayer]
      }
      let task = []
      Array.isArray(streamList) && streamList.forEach(streamObj => {
        let { stream_id,anchor_id_name,anchor_nick_name } = streamObj
        //删除流
        if(updatedType === 1){
          task.push(() => this.stopPlayer(stream_id))
          return 
        }

        //添加一个任务
        task.push(() => this.startPlaying(stream_id))
        //添加主播拉流
        if(anchor_id_name === this.data.mainPlayer.anchor_id_name){
          //添加需要修改的项目
          dataSender['mainPlayer'] = {
            anchor_id_name,
            anchor_nick_name,
            stream_id
          }
          return
        }
        //查询是否存在于正在播放的项目中
        let index = this.data.subPlayer.findIndex(player => stream_id === player.stream_id)

        index <= -1
          //添加一个拉流
          ? dataSender['subPlayer'].push(streamObj)
          //修改一个拉流
          : dataSender['subPlayer'][index] = { ...dataSender['subPlayer'][index],...streamObj }
      })
      //批量更新
      this.setData(dataSender)
      //批量更新  setData的success方法 有时候没有回调 所以使用了setTimeout
      //mainPlayer 改变的时候 subPlayer不改变 setData的success没有回调
      setTimeout(() => task.map(fn => fn()),300)
    },

    /* --------------- onStreamUrlUpdate ----------------- */
    /**
     * startPlayStream、startPublishStream 后，服务端主动推过来的流更新事件
     * @param {*} streamid 流id	
     * @param {*} url rtmp地址 收到此回调后需要更新小程序<live-player> 和 <live-pusher>组件的src属性
     * @param {*} type = 推拉流 { 数值 0: 拉流 1: 推流 }
     */
    onStreamUrlUpdate(streamid = "", url = "", typeNumber){
      typeNumber = Number(typeNumber)
      typeNumber === 0 && this.setPlayStreamUpdate(streamid,url)
      typeNumber === 1 && this.setPusherStreamUpdate(streamid,url)
    },
    /**
     * onStreamUrlUpdate触发 修改推流设置项
     * @param {*} stream_id 
     * @param {*} url 
     */
    setPusherStreamUpdate(stream_id = "", url = ""){
      //如果是游客 应该是游客主播进行了连麦
      let updateFaildName = this.data.isAnchor? 'mainPusher' : 'subPusher'
      //判断是否是主播
      this.setData({
        [updateFaildName]:{
          ...this.data[updateFaildName],
          stream_id,
          url
        }
      },() => {
        let pusherContent = this.data[updateFaildName].pusherContext = this.data[updateFaildName].pusherContext || wx.createLivePusherContext()
        //重新开始
        pusherContent && pusherContent.start()
      })
    },
    /**
     * onStreamUrlUpdate触发 修改拉流设置项
     * @param {*} streamid 
     * @param {*} url 
     */
    setPlayStreamUpdate(streamid = "", url = ""){
      //主播拉流配置更新
      if(streamid === this.data.mainPlayer.stream_id){
        this.setData({
          mainPlayer:{
            ...this.data.mainPlayer,
            stream_id:streamid,url
          },
          isLeave:false
        },() => {
          let playerContent = this.data.mainPlayer.playerContent = this.data.mainPlayer.playerContent || wx.createLivePlayerContext('mainPlayer',this)
          playerContent && playerContent.play()
        })
        return
      }
      //子主播列表查询 是否有更新
      let updateSubPlayList = this.data.subPlayer.map(play => {
        let { stream_id } = play
        //需要被更新
        if(streamid === stream_id){
          play = { ...play,stream_id,url }
          let player = play.playerContent = play.playerContent || wx.createLivePlayerContext(stream_id,this)
          player && player.play()
        }
        return play
      })
      this.setData({
        subPlayer:updateSubPlayList
      })
    },
    /* --------------- onStreamUrlUpdate ----------------- */

    /* ---------------- start ----------------- */
    /**
     * 开始推流  通知lib推流(startPublishingStream) -> 触发lib的onStreamUrlUpdate -> 更新小程序live-pusher的url
     * @param {*} streamid 
     */
    startPublishing(streamid = this.data.mainPusher.stream_id){
      let lib = this.zegoLib
      if(typeof lib === 'undefined'){ return }
      //设置推流的地址
      lib.CallZegoLib('setPreferPublishSourceType',this.data.preferPublishSourceType)
      //设置推流的streamID
      lib.CallZegoLib('startPublishingStream',streamid)
    },
    /**
     * 开始拉流
     * @param {*} streamid 
     */
    startPlaying(streamid){
      let lib = this.zegoLib
      if(typeof lib === 'undefined'){ return }
      //设置拉流的地址
      lib.CallZegoLib('setPreferPlaySourceType',this.data.preferPlaySourceType)
      //设置拉流的streamID
      lib.CallZegoLib('startPlayingStream',streamid)
    },
    /* ---------------- start ----------------- */

    /* ---------------- stop ----------------- */
    /**
     * 停止推流
     * @param {*} isSubPusher 是否是子主播
     */
    stopPusher(isSubPusher = false){
      let lib = this.zegoLib
      if(typeof lib === 'undefined'){ return }
      let { mainPusher,subPusher } = this.data
      //是否是子主播
      let pusher = isSubPusher? subPusher : mainPusher
      this.stopPusherByObj(pusher)
    },
    stopPusherByObj(pusher = {}){
      let lib = this.zegoLib
      if(typeof lib === 'undefined'){ return }
      let { stream_id,pusherContext } = pusher
      //停止推流
      lib.CallZegoLib('stopPublishingStream', stream_id)
      //停止小程序推流
      pusherContext && pusherContext.stop()
    },
    /**
     * 停止拉流
     */
    stopPlayer(streamid){
      let isAnchor = streamid === this.data.mainPlayer.stream_id
      let index = this.data.subPlayer.findIndex(({ stream_id }) => stream_id === streamid)
      //找到停止拉流的配置
      let player = isAnchor
        ? this.data.mainPlayer
        : this.data.subPlayer[index]
      //没有找到
      if(!player){ return }

      this.stopPlayerByObj(player)
      //主播停播
      if(isAnchor){
        this.setData({ isLeave:true,mainPlayer:{ ...this.data.mainPlayer,url:'' } })
        return
      }
      //观众停止连麦 删除
      this.data.subPlayer.splice(index,1)
      this.setData({ subPlayer:this.data.subPlayer,recvJoinLiver:'' })
    },
    stopPlayerByObj(player = {}){
      let lib = this.zegoLib
      if(typeof lib === 'undefined'){ return }
      let { stream_id,playerContent } = player
      //停止拉流
      lib.CallZegoLib('stopPlayingStream',stream_id)
      //停止小程序拉流
      playerContent && playerContent.stop()
    },
    /**
     * 关闭所有子主播的拉流
     */
    stopSubPlayer(){
      while(this.data.subPlayer.length){
        let player = this.data.subPlayer.pop()
        player && this.stopPlayerByObj()
      }
      this.setData({ subPlayer:[] })
    },
    /* ---------------- stop ----------------- */

    /**
     * 退出登陆
     */
    logout(){
      let lib = this.zegoLib
      if(typeof lib === 'undefined'){ return }

      this.stopPusher()
      this.stopPusher(true)
      this.stopPlayerByObj(this.data.mainPlayer)
      this.stopSubPlayer()
      this.endJoinLive()
      lib.CallZegoLib('logout')

      //发送事件
      this.triggerEvent('logout',{ component:this })
    },
    /**
     * 登陆房间
     */
    loginRoom(){
      //加载loading
      CallWxFunction('showLoading',{ title:'连接中' })
      //确保用户登陆
      return app.getUserInfo().then(() => {
        //获取当前用户的角色
        return this.getRoomRole()
      }).then(({ isAnchor,isCanPublish,room }) => {
        //重新生成StreamID
        let mainPusherStreamID = this.createStreamID()
        let subPusherStreamID = this.createStreamID('Sub')
        //拿到当前房间的类别
        //如果当前房间是ops 而且isAnchor是true 还是需要返回isAnchor为false
        //因为isAnchor为true的时候 会主播复播 但是ops的主播不再这里播放的
        let { room_type,stream_id,stream_url,anchor_id,anchor_name } = room
        //目前room_type只有两个类型 0 普通房间 1 ops房间
        let isOPS = room_type == 1
        //存储用户角色
        //是ops房间isAnchor一定为false 原因上面已经说过
        this.setData({ isAnchor:!isOPS?isAnchor : false,isCanPublish,mainPusher:{ ...this.data.mainPusher,stream_id:mainPusherStreamID },subPusher:{ ...this.data.subPusher,stream_id:subPusherStreamID } })
        //当前是主播创建 但是当前房间状态不属于未开始或者在直播中
        if(isAnchor && !isCanPublish){
          return Promise.reject({ ret:{ msg:'当前房间不可复播 请稍后重试' } })
        }
        /* --------- OPS的需求添加  直接拉流播放 主播推流信息 ---------- */
        //这段代码 和 下面的then代码可以考虑优化
        if(isOPS){
          this.setData({ 
            //更新主播相关信息
            mainPlayer:{ ...this.data.mainPlayer,anchor_id_name:anchor_id,stream_id,url:stream_url } 
          },() => {
            //确保主播信息更新完毕后 开始拉流
            this.setPlayStreamUpdate(stream_id,stream_url)
          })
        }
        //发送事件 获取到房间信息
        this.triggerEvent('onGetRoomInfo',{ 
          isAnchor,
          anchor_id_name:anchor_id, 
          anchor_nick_name:anchor_name,
          room
        })
        /* --------- OPS的需求添加  直接拉流播放 主播推流信息 ---------- */
        //初始化房间
        return this.initRoom(this.data.roomid)
          /* ------ 这一段代码是OPS需求加的 -------- */
          .then(streamList => {
            //下面的逻辑不变
            return Promise.resolve(isOPS? [{ anchor_id_name:room.anchor_id,stream_id,url:stream_url }] : streamList)
          })
          /* ------ 这一段代码是OPS需求加的 -------- */
      }).then(streamList => {
        console.log(streamList,'登陆获取到到streamList')
        //辅助作用
        let startStreamList = streamList
        //主播的信息
        let mainPlayer = this.data.mainPlayer
        //找到主播的player
        //这里的anchor_id_name是被sdk的onGetAnchorInfo更新过 所以这里的mainPlayer.anchor_id_name已经有值
        let index = startStreamList.findIndex(streamOjb => streamOjb.anchor_id_name == mainPlayer.anchor_id_name)
        //主播是否离开
        let isLeave = this.data.isAnchor? false : index <= -1

        if(index > -1){
          mainPlayer = { ...this.data.mainPlayer,...startStreamList[index] }
          //子主播列表中 去除主播信息
          startStreamList.splice(index,1)
        }

        this.setData({
          mainPlayer,
          //拉流列表
          subPlayer:startStreamList,
          isLeave,
          //sdk已经链接上服务器
          isConnection:true,
          //当前是主播 并且当前有人正在连麦
          recvJoinLiver:this.data.isAnchor && startStreamList.length && {
            from_userid:startStreamList[0].anchor_id_name,
            from_username:startStreamList[0].anchor_nick_name
          } || null
        },() => {
          let playerList =  this.data.isAnchor
              ? this.data.subPlayer
              : [mainPlayer,...this.data.subPlayer]
          
          playerList
              //保证有stream_id
              .filter(player => !!player.stream_id)
              //只拿stream_id的列表
              .map(player => player.stream_id)
              //开始拉流
              .forEach(this.startPlaying.bind(this))
    
          //当前是主播就直接推流
          this.data.isAnchor && this.startPublishing() 
          //发送事件
          this.triggerEvent('onStart',{ 
            isAnchor:this.data.isAnchor,
            anchor_id_name:mainPlayer.anchor_id_name, 
            anchor_nick_name:mainPlayer.anchor_nick_name
          })
        }) 
        //关闭加载框
        CallWxFunction('hideLoading')
        return Promise.resolve()
      }).catch(error => {
        let { ret:{ msg,message } } = error
        console.log('初始化房间失败:',error)
        //关闭加载框
        CallWxFunction('hideLoading')
        //关闭加载框
        CallWxFunction('showModal',{
          title: '提示',
          confirmText:'确定',
          showCancel:false,
          content: msg || message || '房间初始化失败'
        })
        return Promise.reject(error)
      })
    },
    //创建一个streamID
    createStreamID(subString = 'Main'){
      return `${this.data.roomid}zego${Date.now()}${subString}`
    },
    /**
     * 断网重连
     * @param {*} isConnected  是否在连接状态
     */
    retryConnection(isConnected){
      if(!isConnected){  return this.breakNetwork() }
      this.connectionNetwork()
    },

    /**
     * 断线通知
     */
    breakNetwork(){
      //正在重连中
      if(this.loginRoom.retryConnection){ return }
      let pusherContent = this.data.mainPusher.pusherContext = this.data.mainPusher.pusherContext || wx.createLivePusherContext()
      //重新开始
      pusherContent && pusherContent.stop()
      //断开
      this.logout()
      CallWxFunction('showToast', { title: '您已断线', icon: 'none' })
    },
    /**
     * 重连通知
     */
    connectionNetwork(){
      //正在重连中
      if(this.loginRoom.retryConnection){ return }
      this.loginRoom.retryConnection = true
      //关闭之前对登陆
      this.logout()
      //清空信息
      this.setData({
        isCanPublish: false,
        //是否连接上sdk服务器
        isConnection: false,
        //正在请求连麦的人
        recvJoinLiver: null,
        //观众是否正在请求连麦 主播不需要
        isStartRequestJoinLive: false,
        //子播列表
        subPlayer: [],
      })
      //尝试重连后 回调
      let next = () => {
        this.loginRoom.retryConnection = false
      }
      //重连
      this.loginRoom().then(next).catch(next)
    }
  },

  //页面生命周期
  pageLifetimes: {
    // 组件所在页面的生命周期函数
    show() {  
      //监听网络状态
      wx.onNetworkStatusChange(response => {
        let { isConnected } = response
        typeof this.retryConnection === 'function' && this.retryConnection(isConnected) 
      })
    },
    hide() { 
      //this.logout()
    },
    resize() { },
  },

  //组件生命周期
  lifetimes: {
    //在组件实例进入页面节点树时执行
    attached() {   },
    //在组件实例被从页面节点树移除时执行
    detached() { 
      this.logout()
      this.retryConnection = null
    }
  }
})
