// components/setting-room/index.js
import { CallWxFunction } from '../lib/wx-utils'
import { requestSetRoom } from '../../utils/server'

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
  //是否显示隐私直播冒泡
  is_show_tips:false,
  //是否显示时间选择器
  is_show_picker:false,

  top:"87rpx",
}

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    is_show_goods_list:{
      type:Boolean,
      value:false
    }
  },

  /**
   * 组件的初始数据
   */
  data: { 
    ...clearObj 
  },

  /**
   * 组件的方法列表
   */
  methods: {
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
          room_img: tempFilePaths[0]
        })
      })
    },

    /**
     * 商品列表 商品被点击
     */
    goodsTap(e){
      let { goodsObj, itemView, listView,boxView } = e.detail
      //前往商品
      let { url_type = 1,goods_url = "",app_id } = goodsObj
      //url
      if(Number(url_type) === 1){
        return CallWxFunction(this.data.isAnchor? 'redirectTo' : 'navigateTo',{ url:`/pages/web/index?url=${encodeURIComponent(goods_url)}` })
      }
      CallWxFunction('navigateToMiniProgram',{ appId:app_id,path:goods_url })
    },

    //关闭了商品列表
    hiddenGoodsList(e){
      this.setData({ is_show_goods_list:false })
    },

    //展示商品列表
    showGoodsList(){
      this.setData({ is_show_goods_list:true })
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
    //发布预告
    setFeatureLive(e){
      const { value:val,component } = e.detail
      let [{ value: day }, { value: hours }, { value: minutes }] = val
      let newDate = day + hours * 60 * 60 * 1000 + minutes * 60 * 1000
      this.setData({ is_show_picker:false })
      this.setRoom(true, newDate)
    },
    /**
     * 开始设置房间
     * @param {*} isFeatureLive  是否是发布预告
     * @param {*} featureDate  预告时间
     */
    setRoom(isFeatureLive,featureDate){
      //需要验证的
      let verify = [this.verifyRoomImg,this.verifyRoomName,this.verifyRoomPw]
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
        room_img = ""
      } = this.data

      //加载loading
      CallWxFunction('showLoading',{ title:'加载中' })
      //请求后台接口 创建房间
      requestSetRoom({
        room_name,need_playback,is_private,room_password,room_img,
        //预告需求新增  2小程序 1obs 3预告
        room_type:typeof isFeatureLive !== 'boolean'? 2 : 3,
        start_live_time:featureDate || undefined
      }).then(response => {
        let { room_id } = response
        CallWxFunction('redirectTo',{
          url:typeof isFeatureLive === 'boolean' && isFeatureLive? `/pages/featureLive/index?roomID=${room_id}` : `/pages/room/index?roomID=${room_id}`
        })
        console.log(response,'success')
      }).catch(error => {
        console.log(error)
        let { ret = {  } } = error
        let { msg,message } = ret
        let errorMessage = msg || message || '系统错误 请稍后重试'
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