//app.js
import { CallWxFunction,EventEmitter,throttleByPromise,getCurrentPageWithArgs } from './components/lib/wx-utils'

App({
  EventEmitter,
  CallWxFunction,
  onLaunch: function () {
    //给getUserInfo添加防抖
    this.getUserInfo = throttleByPromise(this.getUserInfo,2000)
  },

  /**
    * 检查是否有在播房间
    */
  isRevertRoom(){
    //获取当前用户在播房间
    return requestGetSelfRoomList({ status:2 }).then(response => {
      let { room_list = [] } = response
      //当前直播的房间列表
      if(room_list.length > 0){
        return this.switchRoom(room_list).catch(() => ({ roomid:this.data.roomid }))
      }
      //返回默认roomid
      return Promise.resolve({ roomid:this.data.roomid })
    })
  },
  /**
   * 根据已存在的直播房间列表 让用户选择恢复哪个房间的直播
   * @param {*} room_list 
   */
  switchRoom(room_list = []){
    //获得一个
    let room = room_list.shift()
    //没有可以选择的直播房间了
    if(!room){ return Promise.reject() }
    //让用户选择恢复哪个直播房间
    return CallWxFunction('showModal',{
      title:'信息',
      content:`您有正在直播的房间:${room.room_name}，是否进行恢复直播？`
    }).then(response => {
      let { confirm } = response
      return confirm? Promise.resolve(room) : switchRoom(room_list)
    })
  },

  /**
   * @param {*} isFresh 是否强制重新获取 不拿缓存
   */
  getUserInfo(){
    //判断是否已经获取过用户信息
    //已经获取过就使用缓存信息返回
    if (this.globalData.userInfo){
      return Promise.resolve(this.globalData.userInfo)
    }
    //和微信交互获取用户信息
    return this.callWxGetUserInfo()
  },

  /**
   * 和微信交互获取用户信息
   * 首先获取权限 如果用户不授权权限，则获取不到用户信息
   * 获取权限之后 获取用户信息
   */
  callWxGetUserInfo(){
    let getSetting = Promise.resolve()
    //和用户拿权限
    if (!this.globalData.isGetSetting) {
      getSetting = CallWxFunction('getSetting').then(res => {
        this.globalData.isGetSetting = true
        return res.authSetting['scope.userInfo']
          ? Promise.resolve() : Promise.reject()
      })
    }

    return getSetting.then(() => {
      //获取用户信息
      return CallWxFunction('getUserInfo')
    }).then(res => {
      this.globalData.userInfo = res.userInfo
      //通知获取用户信息事件
      this.EventEmitter.emit('getUserInfo', res.userInfo)
      //兼容老的代码
      typeof userInfoReadyCallback === 'function'
        && userInfoReadyCallback(res)
      //返回给Promise
      return Promise.resolve(res)
    })
  },
  onShow: function(options) {
    console.log('App onShow');

    CallWxFunction('setKeepScreenOn',{
      keepScreenOn: true
    }).then(result => {
      console.log('setKeepScreenOn success', result)
    }).catch(error => {
      console.log('setKeepScreenOn error', error)
    })

    console.log(getCurrentPageWithArgs(),8888)

    //获取用户信息
    this.getUserInfo().catch(error => {
      //提示用户授权
      return CallWxFunction('showModal',{
        title: '提示',
        confirmText:'去授权',
        showCancel:false,
        content: '需获取信息用于登录，请重新登录'
      }).then((response = {}) => {
        let { confirm } = response
        //用户点击了 去授权 重新获取用户信息
        //这里应该跳转授权页面把
        if(confirm){ 
          return this.gotoAuthrozePage() 
        }
        //返回错误信息
        return Promise.reject({ ret:{ code:10000,msg:'用户未授权01' } })
      })
    })
  },
  /**
   * 跳转授权登陆页面
   */
  gotoAuthrozePage(){
    let reloadURL = this.globalData.reloadURL = getCurrentPageWithArgs()
    //代表当前就是登陆页面
    if(reloadURL.includes('pages/authroze/index')){ return }
    CallWxFunction('redirectTo',{ url:'/pages/authroze/index' })
  },
  /**
   * 登陆页面跳转回当前页面
   */
  reloadPage(){
    if(typeof this.globalData.reloadURL === 'string'){
      let url = this.globalData.reloadURL
      url = url.startsWith('/')? url : `/${url}`
      this.globalData.reloadURL = null
      return CallWxFunction('redirectTo',{ url })
    }
    CallWxFunction('redirectTo',{ url:'/pages/index/index' })
  },
  globalData: {
    //是否授权过获取用户信息
    isGetSetting:false,
    //用户信息
    userInfo: null,
    //BaseUrl: 'https://shop-backend.yunyikao.com',
    BaseUrl:'http://shop-backend-test.yunyikao.com',
    wxAppID: 'wx371ac5dc128c4c5e',
    liveAppID: 1739272706 
  },
})