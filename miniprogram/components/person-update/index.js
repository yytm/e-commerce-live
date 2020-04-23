// components/person-update/index.js
import { CallWxFunction } from '../lib/wx-utils'
import { requestUpdateAnchor, loginApp } from '../../utils/server'
const app = getApp()

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
    top:'87px',

    //昵称
    nickName:'',
    //手机号码
    cellphone:'',
    //头像
    avatarUrl:'',
    //头衔
    job_title:'',
    //微信号
    wechat_id:'',
    //邮箱
    email:'',
    //性别
    gender:'',


    tempfile:''
  },

  /**
   * 组件的方法列表
   */
  methods: {
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
          tempfile: tempFilePaths[0]
        })
      })
    },


    //校验房间名称
    verifyName(nickname = this.data.nickName){
      let nicknameLength = String(nickname).length
      let response = { result:true,msg:'' }
      if(nicknameLength <= 0 || nicknameLength > 30){
        response = { result:false,msg:'请输入主播名称 (10个字数以内)' }
      }
      return response
    },
    //校验手机号
    verifyPhone(cellphone = this.data.cellphone){
      let reg = /^[1]([3-9])[0-9]{9}$/
      let phone = String(cellphone)
      let response = { result:true,msg:'' }
      //有输入手机号码 才验证
      if(phone && !reg.test(phone)){
        response = { result:false,msg:'请输入正确的手机号码' }
      }
      return response
    },
    //校验邮箱
    verifyEmail(email = this.data.email){
      let reg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
      let response = { result:true,msg:'' }
      //有邮箱 才验证
      if(email && !reg.test(email)){
        response = { result:false,msg:'请输入正确的邮箱' }
      }
      return response
    },
    /**
     * 输入名称
     */
    nameHold(e){
      const val = e.detail
      this.setData({
        nickName:val
      })
    },
    /**
     * 输入title
     */
    titleHold(e){
      const val = e.detail
      this.setData({
        job_title:val
      })
    },
    /**
     * 输入微信号
     */
    wechatHold(e){
      const val = e.detail
      this.setData({
        wechat_id:val
      })
    },
    /**
     * 输入手机号
     */
    cellphoneHold(e){
      const val = e.detail
      this.setData({
        cellphone:val
      })
    },
    /**
     * 输入邮箱
     */
    emailHold(e){
      const val = e.detail
      this.setData({
        email:val
      })
    },
    /**
     * 性别选择
     */
    genderHold(e){
      const val = e.detail.value
      this.setData({ gender:val == 1? 2 : 1 })
    },

    /**
     * 更新主播信息
     */
    update(){
      //需要验证的
      let verify = [this.verifyName,this.verifyPhone,this.verifyEmail]
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
        //昵称
        nickName,
        //手机号码
        cellphone,
        //头像
        avatarUrl,
        //头衔
        job_title,
        //微信号
        wechat_id,
        //邮箱
        email,
        //性别
        gender,
        //上传的头像
        tempfile
      } = this.data

      //加载loading
      CallWxFunction('showLoading',{ title:'加载中' })
      //请求后台接口 创建房间
      requestUpdateAnchor({
        nickName, cellphone, avatar: tempfile,job_title,wechat_id,email,gender
      }).then(response => {
        let { room_id } = response
        app.globalData.userInfo = {
          ...app.globalData.userInfo,
          ...this.data
        }
        wx.setStorageSync('nickName', app.globalData.userInfo.nickName)
        wx.setStorageSync('avatar', app.globalData.userInfo.avatarUrl);
        //返回
        this.onBack()
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
     * 当个人中心被修改
     */
    onPersonUpdate() {
      return app.getUserInfo()
        //业务逻辑登陆
        .then(userInfo => loginApp())
        .then(role => {
          this.setData({ ...app.globalData.userInfo })
          return Promise.resolve(role)
        });
    },
    /**
     * 退出返回
     */
    onBack() {
      let backBtn = this.backBtn = this.backBtn || this.selectComponent('#backBtn')
      typeof backBtn.back === 'function' && backBtn.back()
    },
  },

  //页面生命周期
  pageLifetimes: {
    // 组件所在页面的生命周期函数
    show() {  
      this.onPersonUpdate()
    },
    hide() { 
      
    },
    resize() { },
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
