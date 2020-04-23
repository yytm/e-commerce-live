// components/activety/index.js
import { requestGetActivityList } from '../../utils/server'
import { CallWxFunction } from '../lib/wx-utils'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    cencalText:{
      type:String,
      value:'取消'
    },
    confirmText:{
      type:String,
      value:'确定'
    },
    is_close:{
      type:Boolean,
      value:true,
      observer(newVal){
        !newVal && this.getActivityList()
      }
    },
    title:{
      type:String,
      value:'活动设置'
    },
    anchor_uid:{
      type:String,
      value:''
    },

    //被选中活动的ID
    selectedID:{
      type:String,
      value:''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    activities:[ ]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 关闭
     */
    close(){
      this.setData({ is_close:true })
    },
    /**
     * 选中
     */
    sure(){
      this.setData({ is_close:true })
      //查找选中的值
      let activety = this.data.activities.find(active => active.id == this.data.selectedID)
      //没有选中任何值
      if(!activety){ return }
      //通知事件
      this.triggerEvent("confirm", { value: activety,component:this })
    },
    /**
     * 有活动被选中
     */
    onActivityTap(e){
      let { currentTarget:{ dataset:{ item:active = {} } } } = e
      let { id } = active
      //设置谁被选中
      this.setData({ selectedID:id })
    },
    /**
     * 获取活动列表
     */
    getActivityList(uid = this.data.anchor_uid){
      CallWxFunction('showLoading',{ mask:true })
      //请求数据
      return requestGetActivityList({ uid:wx.getStorageSync('uid') })
        .then(response => {
          let { activities = [] } = response || {}
          CallWxFunction('hideLoading')
          this.setData({ activities })
        })
        .catch((error = {}) => {
          CallWxFunction('hideLoading')
          let { ret = {} } = error
          let { msg,message } = ret
          let errorText = msg || message || '获取信息失败 请稍后重试'
          CallWxFunction('showToast',{ title:errorText,icon:'none' })
        })
    }
  },

  //页面生命周期
  pageLifetimes: {
    // 组件所在页面的生命周期函数
    show() {  
      
    },
    hide() { 
      
    },
    resize() { },
  },


  //组件生命周期
  lifetimes:{
    //在组件实例进入页面节点树时执行
    attached(){
      
    },
    //在组件实例被从页面节点树移除时执行
    detached(){
      
    }
  }
})