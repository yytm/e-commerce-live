// components/setting-box/index.js
import { CallWxFunction } from '../lib/wx-utils'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    //是否显示设置框
    is_show_setting_box:{
      type:Boolean,
      value:true
    },
    //切换前后摄像头 默认前摄像头
    switch_camera:{
      type:Boolean,
      value:true
    },
    //是否开启麦克风
    enable_mic:{
      type:Boolean,
      value:true
    },
    //是否展示美颜设置框
    is_show_beauty_box:{
      type:Boolean,
      value:false
    },
    //美颜值
    beauty:{
      type:Number,
      vlaue:0
    },
    //美白值
    whiteness:{
      type:Number,
      value:0
    },
    //房间密码
    room_password:{
      type:String,
      value:''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    //开关麦克风
    switchMic(){
      const enable_mic = !this.data.enable_mic
      this.setData({ enable_mic })
      //通知事件
      this.triggerEvent('switchMic', enable_mic)
    },
    //关闭当前设置框
    close(){
      this.setData({ is_show_setting_box:false })
      //通知事件
      this.triggerEvent('close')
    },
    //展示美颜设置
    showBeautyBox(){
      let val = true
      this.setData({ is_show_beauty_box: val })
      //通知事件
      this.triggerEvent('show_beauty', val)
    },
    //美颜返回
    back(){
      let val = false
      this.setData({ is_show_beauty_box: val })
      //通知事件
      this.triggerEvent('show_beauty', val)
    },
    //复制
    setCopy(){
      let tostParams = {
        icon: 'none',
        duration: 2000,
        title: '复制成功'
      }
      //把密码复制给黏贴版
      CallWxFunction('setClipboardData', { 
        data: this.data.room_password 
      }).then(() => {
        CallWxFunction('showToast', tostParams)
      }).catch(() => {
        CallWxFunction('showToast', { 
          ...tostParams,title:'复制失败 请稍后重试' 
        })
      })
    }
  }
})
