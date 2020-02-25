// miniprogram/pages/live/index.js
let { sharePage } = require("../../utils/util.js");
let { getLoginToken } = require("../../utils/server.js");
let { liveAppID, BaseUrl } = getApp().globalData;

let liveRoom;
let merT = null;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    liveAppID: 1739272706,
    roomID: "",
    logServerURL: "https://wsslogger-demo.zego.im/httplog",
    loginType: "",
    roomShowName: '',
    token: '',
    userInfo: {},
    hasUserInfo: false,


    hideModal: true, //模态框的状态  true-隐藏  false-显示
    animationData: {},

    uid: -1,
    merchandises: [
      {
        name: 'Givenchy/纪梵希高定香榭天鹅绒唇膏',
        img: '../../resource/m0.png',
        price: '345',
        id: 0,
        link: {
          appId: '0',
          path: "../web/index",
          extraData: {
            url: "https://shop-ecommerce.yunyikao.com/product.html"
          }
        }
      },
      {
        name: 'OACH蔻驰Charlie 27 Carryal单肩斜挎手提包女包包2952过长样式挎手提包女包包2952过',
        img: '../../resource/m1.png',
        price: '1599',
        id: 1,
        // link: {
        //   appId: 'wx2b8909dae7727f25',
        //   path: "pages/liveroom/roomlist/roomlist",
        // }
        link: {
          appId: '0',
          path: "../web/index",
          extraData: {
            url: "https://shop-ecommerce.yunyikao.com/product1.html"
          }
        }
      },
      {
        name: 'Vero Moda2020春夏新款褶皱收腰蕾丝拼接雪纺连衣裙',
        img: '../../resource/m2.png',
        price: '749',
        id: 2,
        link: {
          appId: '0',
          path: "../web/index",
          extraData: {
            url: "https://shop-ecommerce.yunyikao.com/product2.html"
          }
        }
      },
    ],
    pushInx: -1,
    pushMer: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('>>>onLoad')
    const { roomID, roomName, loginType } = options;
    const roomShowName = roomID.slice(2);
    let timestamp = new Date().getTime();
    let userID;
    if (loginType === 'anchor') {
      userID = 'anchor' + wx.getStorageSync('uid');
      this.data.uid = wx.getStorageSync('uid');
    } else if (loginType === 'audience') {
      userID = "xcxU" + timestamp;
      console.log('anchor', options.anchorID, typeof options.anchorID);
      this.data.uid = parseInt(options.anchorID.replace('anchor', ''));
    }
    this.setData({
      liveAppID,
      roomID,
      roomName,
      loginType,
      roomShowName,
      userID,
    });

    let systemInfo = wx.getSystemInfoSync();
    let rect = wx.getMenuButtonBoundingClientRect();
    console.log(rect.top, systemInfo);
    let gap = rect.top - systemInfo.statusBarHeight; //动态计算每台手机状态栏到胶囊按钮间距
    let navBarHeight = gap + rect.bottom;
    console.log('navBarHeight', rect, navBarHeight);
    this.setData({
      navBarHeight,
      statusBarHeight: systemInfo.statusBarHeight
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    liveRoom = this.selectComponent('#live-room');
    // getLoginToken(this.data.userID, this.data.liveAppID).then(token => {
    //   console.log('token', token)
    //   this.setData({
    //     token
    //   });
    // });
    this.getRoomToken(this.data.userID, this.data.liveAppID);
    this.getGoods();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    wx.setKeepScreenOn({
      keepScreenOn: true,
      success: (result) => {
        console.log('setKeepScreenOn', result);
      },
      fail: () => { },
      complete: () => { }
    });
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
  onShareAppMessage() {
    let self = this;
    const imgUrl = wx.getStorageSync('roomImg') || "/resource/share.png";
    let obj = sharePage(imgUrl, {
      roomID: this.data.roomID,
      loginType: 'audience',
      anchorID: 'anchor' + self.data.uid
    });
    console.log('onShareAppMessage', obj);
    return obj;
  },

  onRoomEvent(ev) {
    console.log('onRoomEvent', ev);
    let { tag, content } = ev.detail;
    switch (tag) {
      case 'onRoomCreate': {
        console.log('onRoomCreate', content);
        this.setRoom(content);
        break;
      }
      case 'onMerchandise': {
        console.log('onMerchandise', content);
        this.showModal();
        break;
      }
      case 'onBack': {
        console.log('onBack', content);
        wx.navigateBack();
        break;
      }
      case 'onModalClick': {
        console.log('onModalClick', content);
        if (!this.data.hideModal) {
          this.hideModal();
        }
        break;
      }
      case 'onRecvMer': {
        console.log('onRecvMer', content);
        const { indx, merTime, merBot } = content;
        merT && clearTimeout(merT);
        const pushMer = this.data.merchandises.find(item => item.id == indx);
        this.setData({
          pushInx: indx,
          merBot: merBot,
          pushMer
        });
        merT = setTimeout(() => {
          this.setData({
            pushInx: -1,
            pushMer: {},
            merBot: merBot
          });
          clearTimeout(merT);
          merT = null;
        }, merTime * 1000);
        break;
      }
      case 'onPushMerSuc': {
        console.log('onPushMerSuc', content);
        wx.showToast({
          title: '商品推送成功',
          icon: 'none'
        });

      }
      default: {
        // console.log('onRoomEvent default: ', e);
        break;
      }
    }
  },

  setRoom(content) {
    const { liveAppID, roomID } = content;
    wx.request({
      url: BaseUrl + '/app/set_room',
      method: 'POST',
      data: {
        "session_id": wx.getStorageSync('sessionId'),
        "live_appid": liveAppID,
        "uid": wx.getStorageSync('uid'),
        "room_id": roomID,
      },
      success(res) {
        if (res.statusCode === 200) {
          if (res.data.ret.code === 0) {
            console.log('set room succeed');
          }
        }
      },
      fail(e) {
        console.error('fail ', e);
      }
    })
  },

  pushMer(e) {
    const { currentTarget: { dataset: { indx } } } = e;
    console.log(indx);
    liveRoom.pushMer(indx);
  },
  // 显示遮罩层 
  showModal: function () {
    var that = this;
    that.setData({
      hideModal: false
    })
    var animation = wx.createAnimation({
      duration: 150, //动画的持续时间 默认400ms 数值越大，动画越慢 数值越小，动画越快 
      timingFunction: 'linear', //动画的效果 默认值是linear 
    })
    this.animation = animation
    setTimeout(function () {
      that.fadeIn(); //调用显示动画 
    }, 10)
  },

  // 隐藏遮罩层 
  hideModal: function () {
    console.log('hideModal');
    var that = this;
    // var animation = wx.createAnimation({
    //   duration: 800, //动画的持续时间 默认400ms 数值越大，动画越慢 数值越小，动画越快 
    //   timingFunction: 'linear', //动画的效果 默认值是linear 
    // })
    // this.animation = animation
    // that.fadeDown(); //调用隐藏动画 
    // setTimeout(function() {
    that.setData({
      hideModal: true
    })
    that.fadeDown();
    // }, 720) //先执行下滑动画，再隐藏模块 
  },

  //动画集 
  fadeIn: function () {
    this.animation.translateY(0).step()
    this.setData({
      animationData: this.animation.export() //动画实例的export方法导出动画数据传递给组件的animation属性 
    })
  },
  fadeDown: function () {
    console.log(this.animation);
    this.animation.translateY(450).step()
    this.setData({
      animationData: this.animation.export(),
    })
  },
  clickMech(e) {
    const mer = this.data.merchandises.find(item => item.id == e.currentTarget.id)
    if (!mer || !mer.link) return;
    const link = mer.link;
    if (link.appId === '0') {
      const toUrl = link.path + "?url=" + link.extraData.url;
      console.log('toUrl', toUrl);
      wx.navigateTo({
        url: toUrl,
      });
    } else {
      console.log('link', link);
      wx.navigateToMiniProgram({
        appId: link.appId,
        path: link.path,
        extraData: {
          foo: 'bar'
        },
        envVersion: 'trial',
        success(res) {
          // 打开成功
          console.log(res)
        },
        fail(e) {
          console.error(e);
        }
      })
    }

  },
  clickPush() {
    console.log(this.data.pushInx)

    console.log(this.data.merchandises);
    const mer = this.data.merchandises.find(item => item.id == this.data.pushInx)
    if (!mer || !mer.link) return;
    var link = mer.link;
    console.log('link', link);
    const toUrl = link.path + '?url=' + link.extraData.url
    wx.navigateTo({
      url: toUrl,
    });
  },

  getRoomToken(userID, appID) {
    let self = this;
    wx.request({
      url: BaseUrl + '/app/get_room_token',
      method: 'POST',
      data: {
        'session_id': wx.getStorageSync('sessionId'),
        'live_appid': appID,
        'user_name': userID
      },
      success: function (res) {
        if (res.data.ret && res.data.ret.code === 0) {
          const token = res.data['room_token'];
          self.setData({
            token
          })
        }
      },
      fail: function (e) {
        console.error(e);
      }
    })
  },

  getGoods() {
    let self = this;
    wx.request({
      url: BaseUrl + '/app/list_goods',
      method: 'POST',
      data: {
        "session_id": wx.getStorageSync('sessionId'),
        "live_appid": liveAppID,
        "uid": self.data.uid,
        "page": 1,
        "count": 10,
      },
      success: function (res) {
        if (res.statusCode !== 200) return;
        console.log('goods', res);
        const result = res.data;
        if (result.ret && result.ret.code === 0 && result.goods_count > 0) {
          const merchandises = result['goods_list'].map(item => {
            return {
              id: item['goods_id'],
              num: item['goods_no'],
              name: item['goods_desc'],
              link: {
                // url: item['goods_url']
                appId: '0',
                path: "../web/index",
                extraData: {
                  url: item['goods_url']
                }
              },
              price: item['price'],
              img: item['goods_img']
            }
          });
          self.setData({
            merchandises
          })
        }
      },
      fail: function (e) {
        console.error(e);
      }
    })
  },

})