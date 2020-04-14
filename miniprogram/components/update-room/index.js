// components/setting-room/index.js
import { CallWxFunction } from '../lib/wx-utils'
import { requestUpdateRoom } from '../../utils/server'

const clearObj = {
  //直播间标题
  room_name: '',
  //房间密码
  room_password: '',
  //是否录制
  need_playback: false,
  //是否私密直播
  is_private: false,
  //直播封面 本地地址
  room_img: '',
  temp_patch:'',
  //预告开始时间
  start_live_time:0,
  //是否显示隐私直播冒泡
  is_show_tips:false,
  //是否显示时间选择器
  is_show_picker:false,
  //房间信息
  roomInfo:{},
  //默认选中的时间
  pickerTime:[],
  

  //显示的文案
  liveTimeTest:'',

  top:"87rpx",
}

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
    ...clearObj 
  },

  observers:{
    start_live_time(newVal){
      let now = new Date(newVal)
      this.setData({ liveTimeTest:`${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${now.getMinutes()}` })
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化房间
     * @param {*} room  房间信息
     * @param {*} isAnchor 是否主播
     */
    initRoomInfo(room,isAnchor = false){
      let { room_name = '',room_password = '',has_playback = false,is_private = false,room_img = '',start_live_time = new Date() } = room || clearObj
      //start_live_time = 1586995200000
      this.setData({ 
        room_name,room_password,need_playback:has_playback,is_private,room_img,
        roomInfo:room,
        isAnchor,
        start_live_time,
        pickerTime:this.sliceTimeSpan(start_live_time)
      })
    },
    /**
     * 拆解时间
     */
    sliceTimeSpan(timeSpan){
      let now = new Date(timeSpan)
      let date = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} 0:0:0`)
      let hours = now.getHours()
      let minutes = now.getMinutes()
      return [date.getTime(),hours,minutes]
    },
    //展示时间选择器
    showPicker(){
      this.setData({ is_show_picker:true })
    },
    //输入直播标题
    roomNameHold(e){
      const val = e.detail
      this.setData({
        room_name:val
      })
    },
    //输入房间密码
    roomPasswdHold(e){
      const val = e.detail
      this.setData({
        room_password:val
      })
    },
    //选择是否直播录制
    roomPlayback(e){
      const val = e.detail
      this.setData({
        need_playback: val
      })
    },
    //选择是否私密直播
    roomPrivate(e){
      const val = e.detail
      this.setData({
        is_private: val
      })
    },
    //checkbox的tips显示或者隐藏事件
    checkboxTips(e) {
      const val = e.detail
      this.setData({
        is_show_tips: val
      })
    },
    //隐藏提示冒泡
    holdTap() {
      this.setData({
        is_show_tips: false
      })
    },
    //选择直播封面
    chooseImage(){
      //选择照片
      CallWxFunction('chooseImage',{
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera']
      }).then((response = {}) => {
        // tempFilePath可以作为img标签的src属性显示图片
        const { tempFilePaths } = response
        this.setData({
          temp_patch:tempFilePaths[0],
          room_img: tempFilePaths[0]
        })
      })
    },

    //校验房间名称
    verifyRoomName(room_name = this.data.room_name){
      let roomNameLength = String(room_name).length
      let response = { result:true,msg:'' }
      if(roomNameLength <= 0 || roomNameLength > 30){
        response = { result:false,msg:'请输入正确的直播标题（30字数以内）' }
      }
      return response
    },
    //校验房间密码
    verifyRoomPw(room_password = this.data.room_password){
      let roomPwLength = String(room_password).length
      let response = { result:true,msg:'' }
      if(roomPwLength > 0 && roomPwLength !== 6){
        response = { result:false,msg:'请输入正确的6位直播密码' } 
      }
      return response
    },
    //校验封面
    verifyRoomImg(room_img = this.data.room_img){
      let response = { result:true,msg:'' }
      if(!!!String(room_img).trim()){
        response = { result:false,msg:'请选择直播封面' }
      }
      return response
    },
    //校验预告时间
    verifyStartTime(start_live_time = this.data.start_live_time){
      let result = !isNaN(start_live_time) && start_live_time > Date.now()
      return { result,msg:result? '' : '开播时间需大于当前时间' }
    },
    //发布预告
    setFeatureLive(e){
      const { value:val,component } = e.detail
      let [{ value: day }, { value: hours }, { value: minutes }] = val
      let newDate = day + hours * 60 * 60 * 1000 + minutes * 60 * 1000
      this.setData({ is_show_picker:false,start_live_time:newDate }) 
    },
    /**
     * 开始设置房间
     */
    setRoom(){
      //需要验证的
      let verify = [this.verifyRoomImg,this.verifyRoomName,this.verifyRoomPw,this.verifyStartTime]
      //找到没有验证通过的提示信息
      let verifyResult = verify.map(fn => fn.call(this)).find(ret => !ret.result)

      if(verifyResult){
        let { msg:title } = verifyResult
        CallWxFunction('showToast',{
          icon:'none',
          duration:2500,
          title
        })
        return
      }

      let { 
        //是否直播录制
        need_playback = false,
        //是否私密直播
        is_private = false,
        //房间名称
        room_name = "",
        //房间密码
        room_password = "",
        //封面地址
        //room_img = "",
        temp_patch:room_img,
        //预告开始时间
        start_live_time 
      } = this.data

      //加载loading
      CallWxFunction('showLoading',{ title:'加载中' })
      //请求后台接口 创建房间
      requestUpdateRoom({
        room_name,need_playback,is_private,room_password,room_img,room_id:this.data.roomInfo.room_id,
        //预告需求新增  2小程序 1obs 3预告
        //room_type:3,
        start_live_time
      }).then(response => {
         //消失loading
         CallWxFunction('hideLoading')
        //展示错误信息
        CallWxFunction('showToast',{
          title:"修改成功",
          icon:'none',
          duration:2500
        })
        this.redirectHandler = setTimeout(() => {
          //CallWxFunction('redirectTo', { url: `/pages/featureLive/index?roomID=${this.data.roomInfo.room_id}` })
          CallWxFunction('navigateBack',{ delta:1 })
        }, 1000);
      }).catch(error => {
        console.log(error)
        let { ret = {  },errMsg = "" } = error
        let { msg,message } = ret
        let errorMessage = msg || message || errMsg || '系统错误 请稍后重试'
        console.log(error,'error')
        //消失loading
        CallWxFunction('hideLoading')
        //展示错误信息
        CallWxFunction('showToast',{
          title:errorMessage,
          icon:'none',
          duration:2500
        })
      })
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
     * 退出房间
     */
    onBack() {
      let backBtn = this.backBtn = this.backBtn || this.selectComponent('#backBtn')
      typeof backBtn.back === 'function' && backBtn.back()
    },
  },

  //组件生命周期
  lifetimes:{
    //在组件实例进入页面节点树时执行
    attached(){
      //清空数据
      //this.setData({ ...clearObj,room_img:wx.getStorageSync('avatar') })
      this.initDomReander()
    },
    //在组件实例被从页面节点树移除时执行
    detached(){}
  }
})