// components/room-avatar/index.js
const app = getApp()
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    //头像地址
    avatar:{
      type:String,
      value:""
    },
    isAutoAvatar:{
      type:Boolean,
      value:true
    },
    //昵称
    nick:{
      type:String,
      value:""
    },
    //二标题
    title:{
      type:String,
      value:""
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
    
  },

  //组件生命周期
  lifetimes: {
    //在组件实例进入页面节点树时执行
    attached() {
      if (this.data.isAutoAvatar && !this.data.avatar){
        //获取用户信息
        app.getUserInfo().then((response = {}) => {
          //获取昵称 以及 头像
          let { avatarUrl: avatar = "", nickName: nick = "" } = response
          //显示头像以及昵称
          this.setData({
            avatar, nick
          })
        })
      }
    },
    //在组件实例被从页面节点树移除时执行
    detached() { }
  }
})
