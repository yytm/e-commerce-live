

import { CallWxFunction } from '../../components/lib/wx-utils'
import { loginApp,requestGetRoomList } from "../../utils/server.js"
const app = getApp();
const { BaseUrl, wxAppID, liveAppID } = app.globalData;

Page({
  data: {
    living: false,
    isFirst: true,
    userInfo: null,
    role: '',
    roomList: [ ],
    isShowPassword: false,
    isShowModal: false,
    title: '当前直播未结束，是否重新进入？',
    cancelText: '结束直播',
    confirmText: '进入直播',
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
    selectRoomID: '',
    replayList: []
  },
  onLoad: function (options) {
    console.log('onLoad', options);
    let rect = wx.getMenuButtonBoundingClientRect();
    const top = rect.top;
    const height = rect.height;
    this.setData({ top,height });
  },
  onShow: function () {
    //app.js 里面首先会试探有没有权限获取用户信息  如果没有权限就会跳转到授权信息获取页面
    //允许获取用户信息后 页面会跳转回来 重新触发onShow流程
    //再次嗅探用户是否授权或者用户信息
    app.getUserInfo()
      //业务逻辑登陆
      .then(userInfo => loginApp())
      .then(role => {
        this.setData({ userInfo:app.globalData.userInfo,role,hasUserInfo:true,isShowModal:false })
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
    this.onShow()
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
        this.setData({ [isCenter? 'replayList':'roomList']:room_list })
      })
  },
  /**
   * 
   * @param {*} uid 
   * @param {*} status 1未开始; 2 直播中; 4 已结束; 8 禁播; 16 可回放, 多个累加
   */
  getRoomList(status = undefined, uid = undefined) {
    let self = this;
    CallWxFunction('showLoading',{ title:'获取房间列表' })
    return requestGetRoomList({ uid,status })
      .then(res => {
        let { room_list = [] } = res
        room_list = room_list.filter(room => room.status === 20? !!room.playback_url : true) 
        CallWxFunction('hideLoading')
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
  /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
  // onPullDownRefresh() {
  //   console.log('>>>[liveroom-roomList] onPullDownRefresh');
  //   this.getRoomList();
  // },
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
  endLive() {
    console.log('endLive');
    this.setData({
      living: false
    })
  },
  enterLive() {
    const url = '../room/index?roomID=' + this.data.livingRoomID + '&roomName=' + this.data.livingRoomName + '&loginType=anchor';
    wx.navigateTo({
      url
    });
  },
  goToAdmin() {
    wx.navigateTo({
      url: "../index/index",
      success: (result) => {
        console.log('nav suc', result);
      },
      fail: () => { },
      complete: () => { }
    });
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
    }, () => {
      this.fetchRooms();
    });
  },
  delReplay(e) {
    const { room_id } = e.detail.content;
    console.log('delReplay', room_id);
    wx.request({
      url: BaseUrl + '/app/delete_playback',
      method: 'POST',
      data: {
        "session_id": wx.getStorageSync('sessionId'),
        "live_appid": liveAppID,
        "uid": wx.getStorageSync('uid'),
        "room_id": room_id,
      },
      success(res) {
        console.log('del playback suc', res);
      },
      fail(e) {
        console.error('del playback fail', e);
      }
    })
  }
});