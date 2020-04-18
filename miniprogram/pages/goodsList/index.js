// miniprogram/pages/goodsList/index.js
import { CallWxFunction,throttleByPromise,getCurrentPageWithArgs } from '../../components/lib/wx-utils'
import { requestListGoods,requestDeletePlayback,loginApp } from "../../utils/server.js"
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    goods_list:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initDomReander()
  },
  refresh(){
    this.getGoodsList()
  },
  /**
   * 和界面有关的初始化
   */
  initDomReander(){
    let systemInfo = wx.getSystemInfoSync()
    let rect = wx.getMenuButtonBoundingClientRect()
  
    let { statusBarHeight } = systemInfo
    const top = rect.top
    this.setData({ top:`${top + 5}px`,tHeight:rect.height,tTop:rect.top });
  },
  /**
    * 获取商品列表
    */
  getGoodsList(){
    //主播id
    let uid = wx.getStorageSync('uid') 
    CallWxFunction('showLoading',{  })
    //获取商品列表
    return requestListGoods({
      uid,page:1,count:1000
    }).then(({ ret, goods_count = 0, goods_list = [] }) => {
      CallWxFunction('hideLoading')
      this.setData({ goods_list,refreshStatus:false })
      return Promise.resolve(goods_list)
    }).catch(error => {
      let { ret = {} } = error || {}
      let { message,msg } = ret
      let errorText = msg || message || '系统错误 请稍后重试'
      CallWxFunction('hideLoading')
      //异常信息提示 然后退出房间
      CallWxFunction('showToast',{title: '提示',icon:'none'})
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.getGoodsList()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})