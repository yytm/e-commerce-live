// miniprogram/pages/register/index.js
import { CallWxFunction } from '../../components/lib/wx-utils'
import { requestChkInvitCode } from "../../utils/server.js"
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let scene = decodeURIComponent(options.scene)
    let { code = '' } = options.scene? scene : options

    CallWxFunction('showLoading')
    //校验验证码
    requestChkInvitCode({ invit_code:code }).then(response => {
      CallWxFunction('hideLoading')
      let { ret,open_id = '',anth2_url = 'http://shop-ecommerce.yunyikao.com/auth' } = response
      if(!anth2_url){ 
        return Promise.reject({ ret:{ code:1000 } }) 
      }
      let url = encodeURIComponent(`${anth2_url}${anth2_url.includes('?')? '&' : '?'}id=${open_id}&invite=${code}`)
      CallWxFunction('redirectTo',{ url:`/pages/web/index?url=${url}` })
    }).catch((error = { }) => {
      console.error(error)
      let { ret = {} } = error
      let { msg,message } = ret
      let errorText = msg || message || '系统错误 请稍后重试'
      CallWxFunction('hideLoading')
      CallWxFunction('showToast',{ title:errorText,icon:'none' })
      return Promise.resolve([])
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