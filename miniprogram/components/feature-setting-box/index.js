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
    //房间密码
    room_password:{
      type:String,
      value:''
    },
    //是否允许连麦
    enable_link:{
      type:Boolean,
      value:false
    }
  },

  /**
   * 组件的初始数据
   */
  data: { },

  /**
   * 组件的方法列表
   */
  methods: {
    
    //触发删除预告
    onDel(){
      this.setData({ is_show_setting_box:false })
      //通知事件
      this.triggerEvent('onDel')
    },
    //触发设置活动
    onSetActivity(){
      this.setData({ is_show_setting_box:false })
      //通知事件
      this.triggerEvent('onSetActivity')
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
      })
      .then(() => CallWxFunction('showToast', tostParams))
      .catch(() => CallWxFunction('showToast', { ...tostParams,title:'复制失败 请稍后重试'  }))
    }
  }
})
