// components/room-feature/index.js
import { 
  requestHd,
  requestDeleteFeatureLive,
  requestUpdateRoom
} from '../../utils/server'
import { CallWxFunction } from '../../components/lib/wx-utils'

Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    top: "87rpx",

    roomInfo:{},
    isAnchor:false,
    //倒计时相关
    timeSpan:{
      startTimeString:'--',
      startLiveTime:Date.now(),
      serverTime:Date.now(),
      day:0,
      hours:0,
      minutes:0,
      seconds:0
    },

    //倒计时是否结束
    isCanLive:false,
    //展示是否删除预告
    isShowConfirm:false
  },

  observers:{
    //房间状态 1 未开始 2 直播中 4 已结束 8 禁播  16 可回放 20 已结束可回收 32 预告
    'roomInfo.status'(status = 1){
      return
      status = Number(status)
      //直播中
      if(status <= 2){
        return CallWxFunction('redirectTo',{ url:`/pages/room/index?roomID=${this.data.roomInfo.room_id}` })
      }
      if(status === 16 || status === 20){
        return CallWxFunction('redirectTo',{ url:`/pages/video/index?roomID=${this.data.roomInfo.room_id}` })
      }

      let content = status === 8 || status === 24? '该直播间已被禁播'  : '直播已结束'
      return CallWxFunction('showModal',{
        title: '提示',
        confirmText:'确定',
        showCancel:false,
        content
      }).then((response = {}) => {
        return CallWxFunction('redirectTo',{ url:`/pages/roomList/index` })
      })
    },
    isCanLive(newVal){
      let title = ''
      if(!this.data.isAnchor && newVal){
        title = '已到达直播时间'

      }
    }
  },

  /**
   * 组件的方法列表- 
   */
  methods: {
    /**
     * 和界面有关的初始化
     */
    initDomReander() {
      let systemInfo = wx.getSystemInfoSync()
      let rect = wx.getMenuButtonBoundingClientRect()

      let { statusBarHeight } = systemInfo
      const top = rect.top
      this.setData({ top: `${top + 5}px` });
    },
    /**
     * 初始化房间
     * @param {*} room  房间信息
     * @param {*} isAnchor 是否主播
     */
    initRoomInfo(room,isAnchor = false){
      let { server_time = Date.now(),start_live_time = Date.now() } = room
      let lastDate = new Date(start_live_time)

      this.setData({ 
        roomInfo:room,
        isAnchor,
        //timeSpan:{ ...this.data.timeSpan,serverTime:server_time,localStartTime:Date.now() } 
        timeSpan:{ 
          ...this.data.timeSpan,
          serverTime:server_time,
          startLiveTime:start_live_time,
          isCanLive:false,
          startTimeString:`${lastDate.getMonth() + 1}月${lastDate.getDate()}日 ${lastDate.getHours()}:${lastDate.getMinutes()}`
        } 
      })

      //倒计时
      this.nextTick(start_live_time - server_time).then(() => {
        this.setData({ isCanLive:true })
      })
      //保持心跳
      this.live()
    },
    /**
     * 时间倒计时
     * @param {*} timeSpan 倒计时时间  毫秒
     */
    nextTick(timeSpan){
      clearTimeout(this.nextTickHandler)

      let day = parseInt(timeSpan / (24 * 60 * 60 * 1000)) 
      let hours = parseInt((timeSpan % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
      let minutes = parseInt((timeSpan % (60 * 60 * 1000)) / (60 * 1000))
      let seconds = Math.round((timeSpan % (60 * 1000)) / 1000)

      this.setData({ 
        timeSpan:{ 
          ...this.data.timeSpan,
          day:day <= 0? 0: day, 
          hours:hours <= 0?0 : hours,
          minutes:minutes <= 0?0 : minutes,
          seconds:seconds <= 0?0 : seconds
        } 
      })

      let resolve,reject
      this.nextTickHandler = setTimeout(() => {  
        timeSpan <= 0? resolve() : this.nextTick(timeSpan -= 1000).then(resolve).catch(reject)
      }, 1000)
      return new Promise((res,rej) => { resolve = res,reject = rej })
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
        let { status } = response
        //status = 1 未开始 2 直播中 4 已结束 8 禁播16 可回放
        this.setData({ roomInfo:{ ...this.data.roomInfo,status } })
        return Promise.resolve()
      }).then(nextTick).catch(nextTick)
    },
    /**
     * 界面的删除按钮被点击
     */
    onTapDelete(){
      this.setData({ isShowConfirm:true })
    },
    /**
     * 删除确认弹窗 点击了取消按钮
     */
    onCancel(){
      this.setData({ isShowConfirm:false })
    },
    /**
     * 主播进入直播间
     */
    onEnterRoom(){
      CallWxFunction('showLoading', { mask:true })
      //修改预告状态 变更成直播状态
      return requestUpdateRoom({ room_id:this.data.roomInfo.room_id,room_type:2 })
        .then(() => {
          CallWxFunction('hideLoading')
          return CallWxFunction('redirectTo', { url: `/pages/room/index?roomID=${this.data.roomInfo.room_id}` }) 
        })
        .catch(error => {
          let { ret = {} } = error || {}
          let { msg, message } = ret
          let errorText = msg || message || '系统错误 请稍后重试'
          CallWxFunction('hideLoading')
          CallWxFunction('showToast', { title: errorText, icon: 'none' })
          return Promise.reject(error)
        })
    },
    /**
     * 编辑预告
     */
    onEditRoom(){
      let now = Date.now()
      let timeSpan = this.timeSpan
      if (timeSpan && now - timeSpan <= 1500){ return }
      this.timeSpan = now
      CallWxFunction('navigateTo', { url: `/pages/updateRoom/index?roomID=${this.data.roomInfo.room_id}` })
    },
    /**
     * 删除预告
     */
    deleteFeatureLive(){
      CallWxFunction('showLoading')
      //隐藏弹窗
      this.onCancel()
      return requestDeleteFeatureLive({ room_id:this.data.roomInfo.room_id })
        .then(() => {
          CallWxFunction('hideLoading')
          return CallWxFunction('showModal',{
            title: '提示',
            confirmText:'确定',
            showCancel:false,
            content:'删除成功'
          })
        })
        .then(() => {
          return CallWxFunction('reLaunch',{ url:`/pages/roomList/index` })
        })
        .catch(error => {
          let { ret = {} } = error || {}
          let { msg,message } = ret
          let errorText = msg || message || '系统错误 请稍后重试'
          CallWxFunction('hideLoading')
          CallWxFunction('showToast',{ title:errorText,icon:'none' })
        })
    }
  },

  

  //组件生命周期
  lifetimes: {
    //在组件实例进入页面节点树时执行
    attached() {
      //清空数据
      //this.setData({ ...clearObj,room_img:wx.getStorageSync('avatar') })
      this.initDomReander()
    },
    //在组件实例被从页面节点树移除时执行
    detached() { 
      this.nextTickHandler && clearTimeout(this.nextTickHandler)
      this.liveHandler && clearTimeout(this.liveHandler)
    }
  }
})
