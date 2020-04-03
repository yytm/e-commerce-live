

import { CallWxFunction } from '../../components/lib/wx-utils'
import { loginApp,requestGetRoomList,requestGetSelfRoomList,requestDeletePlayback } from "../../utils/server.js"
const app = getApp();
const { BaseUrl, wxAppID, liveAppID } = app.globalData;

Page({
  data: {
    refreshStatus:false,
    userInfo: null,
    role: '',
    roomList: [ ],
    statusBarHeight:'20',
    navigateHeight:'170rpx',
    bottom: '30',
    state: 'list',
    list: [{
      "text": "直播列表",
      "id": "list",
      "iconPath": "/resource/room_list.png",
      "selectedIconPath": "/resource/room_list_selected.png",
      dot: true
    },
    {
      "text": "个人中心",
      "id": "center",
      "iconPath": "/resource/per_center.png",
      "selectedIconPath": "/resource/per_center_selected.png",
      badge: 'New'
    }],
    replayList: []
  },
  onLoad: function (options) {
    console.log('onLoad', options);
    let systemInfo = wx.getSystemInfoSync()
    let rect = wx.getMenuButtonBoundingClientRect()

    let { pixelRatio,statusBarHeight } = systemInfo
    const top = rect.top;
    const height = rect.height;
    let navigateHeight = statusBarHeight + height + top
    this.setData({ top, height, statusBarHeight, navigateHeight: String(navigateHeight < 75 ? 75 : navigateHeight) + 'px' });
  },
  onShow: function () {
    if(this.data.state !== 'list'){ return }
    this.revertHandler && clearTimeout(this.revertHandler)
    //app.js 里面首先会试探有没有权限获取用户信息  如果没有权限就会跳转到授权信息获取页面
    //允许获取用户信息后 页面会跳转回来 重新触发onShow流程
    //再次嗅探用户是否授权或者用户信息
    this.onPersonUpdate().then(role => {
        //查看是否有需要恢复直播的房间
        if(role === 'admin' || role === 'anchor'){
          //延迟三秒检查主播是否有需要恢复直播的房间
          this.revertHandler = setTimeout(() => {
            this.isRevertRoom()
              //选中需要跳转恢复直播的房间
              .then(this.enterRoom.bind(this))
          },3000)
        }
        return Promise.resolve()
      })
      //获取列表信息
      .then(() => this.fetchRooms())
      .catch((error = {}) => {
        let { ret = {} } = error  
        let { msg,message } = ret
        let errorText = msg || message || '获取用户信息失败'
        CallWxFunction('showToast',{
          title: errorText,
          icon:'none',
          duration:2500
        })
      })
  },
  
  onUnload: function () {
    this.stopRefresh();
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {

  },
  /**
   * 当个人中心被修改
   */
  onPersonUpdate(){
    return app.getUserInfo()
      //业务逻辑登陆
      .then(userInfo => loginApp())
      .then(role => {
        this.setData({ userInfo:app.globalData.userInfo,role,hasUserInfo:true,isShowModal:false })
        return Promise.resolve()
      });
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
        return this.switchRoom(room_list)
      }
      //没有选中房间 或者没有房间
      return Promise.reject()
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
      return confirm? Promise.resolve(room) : this.switchRoom(room_list)
    })
  },
  /**
   * 请求数据
   */
  fetchRooms(state = this.data.state) {
    //是否个人中心
    let isCenter = state === 'center'
    //个人的uid  如果请求的是列表 那么uid为null
    let uid = isCenter? wx.getStorageSync('uid') : null
    //个人中心 state = 0x10 + 0x2, 列表 state = 0x10
    let queryState = isCenter? 16 : 18
    //请求数据
    return this.getRoomList(queryState,uid)
      .then(room_list => {
        //更新列表
        this.setData({ [isCenter? 'replayList':'roomList']:room_list,refreshStatus:false })
      })
  },
  /**
   * 
   * @param {*} uid 
   * @param {*} status 1未开始; 2 直播中; 4 已结束; 8 禁播; 16 可回放, 多个累加
   */
  getRoomList(status = undefined, uid = undefined) {
    let self = this;
    CallWxFunction('showLoading',{ title:'获取房间列表',mask:true })
    return requestGetRoomList({ uid,status })
      .then(res => {
        let { room_list = [] } = res
        room_list = room_list.filter(room => room.status === 20? !!room.playback_url : true) 
        setTimeout(() => { CallWxFunction('hideLoading') },500)
        return Promise.resolve(room_list)
        //this.setData({ roomList:room_list.filter(room => room.status === 20? !!room.playback_url : true) })
      })
      .catch((error = { }) => {
        
        console.error(error)
        let { ret = {} } = error
        let { msg,message } = ret
        let errorText = msg || message || '获取房间列表失败'
        CallWxFunction('hideLoading')
        CallWxFunction('showToast',{ title:errorText,icon:'none' })
        return Promise.resolve([])
      })
  },
  refresh() {
    console.log('>>>[liveroom-roomList] refresh');
    this.fetchRooms();
  },
  stopRefresh() {
    wx.hideLoading();
    wx.stopPullDownRefresh();
  },
  // 点击进入房间
  onClickItem(e) {
    const { currentTarget:{ dataset:{ item } } } = e

    // 防止两次点击操作间隔太快
    let nowTime = new Date()
    let tapTime = this.tapTime = this.tapTime || nowTime
    if(nowTime - tapTime <= 500){ return }
    this.tapTime = nowTime

    this.enterRoom(item)
  },
  /**
   * 进入房间
   * @param {*} room 
   */
  enterRoom(room) {
    const { room_id, room_name, nickname, avatar, anchor_id_name, room_img,has_playback,playback_url,status } = room;
    let url = ''
    //可以回放 并且有回放地址
    if(has_playback && status === 20){
      url = `/pages/video/index?roomID=${room_id}`
    }else{
      url = `/pages/room/index?roomID=${room_id}`
    }
    //跳转页面
    CallWxFunction('navigateTo',{ url })
  },
  createRoom() {
    console.log('createRoom');
    wx.navigateTo({
      url: '../enterLive/index?role=anchor'
    })
  },
  
  
  tabChange(e) {
    const { index, item } = e.detail;
    console.log('tab change', e)
    const state = this.data.list[index].id;
    this.setData({
      state
    }, this.fetchRooms.bind(this));
  },
  delReplay(e) {
    const { room_id } = e.detail.content;
    requestDeletePlayback({ room_id })
      .then(res => this.fetchRooms())
      .catch(error => console.error('del playback fail', e))
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    let isAnchor = this.data.role === 'admin' || this.data.role === 'anchor'
    let title = `${this.data.userInfo.nickName || ''}${isAnchor?'邀请你成为主播':'邀请你观看直播'}`
    let path = isAnchor? '/pages/register/index':'/pages/roomList/index'
    
    return {
      title,
      path,
      imageUrl: this.data.userInfo.avatarUrl || '../..resource/invi.png',
    }
  }
});