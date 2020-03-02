// miniprogram/pages/live/index.js
let { sharePage } = require("../../utils/util.js");
let { loginApp } = require("../../utils/server.js");

const app = getApp();
let { liveAppID, BaseUrl } = app.globalData;

let liveRoom;
let merT = null;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    liveAppID: liveAppID,
    wsServerURL: "wss://wsliveroom1739272706-api.zego.im:8282/ws", 
    logServerURL: "https://wsslogger-demo.zego.im/httplog",
    shareImg: "/resource/share.png",

    roomID: "",
    loginType: "",
    roomShowName: '',
    token: '',
    isLiving: false,

    userInfo: null,
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),

    hideModal: true, //模态框的状态  true-隐藏  false-显示
    animationData: {},

    uid: -1,
    merchandises: [],
    // merchandises: [
    //   {
    //     name: 'Givenchy/纪梵希高定香榭天鹅绒唇膏',
    //     img: '../../resource/m0.png',
    //     price: '345',
    //     id: 0,
    //     link: {
    //       appId: '0',
    //       path: "../web/index",
    //       extraData: {
    //         url: "https://shop-ecommerce.yunyikao.com/product.html"
    //       }
    //     }
    //   },
    //   {
    //     name: 'OACH蔻驰Charlie 27 Carryal单肩斜挎手提包女包包2952过长样式挎手提包女包包2952过',
    //     img: '../../resource/m1.png',
    //     price: '1599',
    //     id: 1,
    //     // link: {
    //     //   appId: 'wx2b8909dae7727f25',
    //     //   path: "pages/liveroom/roomlist/roomlist",
    //     // }
    //     link: {
    //       appId: '0',
    //       path: "../web/index",
    //       extraData: {
    //         url: "https://shop-ecommerce.yunyikao.com/product1.html"
    //       }
    //     }
    //   },
    //   {
    //     name: 'Vero Moda2020春夏新款褶皱收腰蕾丝拼接雪纺连衣裙',
    //     img: '../../resource/m2.png',
    //     price: '749',
    //     id: 2,
    //     link: {
    //       appId: '0',
    //       path: "../web/index",
    //       extraData: {
    //         url: "https://shop-ecommerce.yunyikao.com/product2.html"
    //       }
    //     }
    //   },
    // ],
    pushInx: -1,
    pushMer: {},
    stopLoadMore: false,
    page: 1,
    isbeginLive: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getState();
    
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
    this.getRoomToken(this.data.userID, this.data.liveAppID, () => {
      liveRoom = this.selectComponent('#live-room');
      liveRoom.startPreview();
      // liveRoom.init();
      // liveRoom.loginRoom(this.data.token);
    });
    this.getGoods();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('room onShow');
    wx.setKeepScreenOn({
      keepScreenOn: true,
      success: (result) => {
        console.log('setKeepScreenOn', result);
      },
      fail: () => { },
      complete: () => { }
    });
    if (liveRoom && this.data.isLiving) {
      console.log('liveRoom', this.data.token);
      this.getRoomToken(this.data.userID, this.data.liveAppID, () => {
        liveRoom.loginRoom(this.data.token);
      });
    }
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
    console.log('onUnload');
    liveRoom = null;
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
    const imgUrl = wx.getStorageSync('roomImg') || self.data.shareImg;
    let obj = sharePage(imgUrl, {
      roomID: this.data.roomID,
      roomName: this.data.roomName,
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
        if (this.data.merchandises.length === 0) {
          setTimeout(() => {
            wx.showToast({
              title: '您的商品袋空空如也，请先添加商品',
              icon: 'none'
            });
          }, 1000);
        }
        break;
      }
      case 'onBack': {
        console.log('onBack', content);
        this.back();
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

  getRoomToken(userID, appID, callback) {
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
          });
          callback();
        }
      },
      fail: function (e) {
        console.error(e);
      }
    })
  },

  getGoods() {
    let self = this;
    self.data.stopLoadMore = true;
    wx.request({
      url: BaseUrl + '/app/list_goods',
      method: 'POST',
      data: {
        "session_id": wx.getStorageSync('sessionId'),
        "live_appid": liveAppID,
        "uid": self.data.uid,
        "page": self.data.page,
        "count": 10,
      },
      success: function (res) {
        if (res.statusCode !== 200) return;
        console.log('goods', res);
        const result = res.data;
        if (result.ret && result.ret.code === 0) {
          if (result.goods_count > 0 && result.goods_list && result.goods_list.length) {
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
            self.data.merchandises = self.data.merchandises.concat(merchandises);
            self.setData({
              merchandises: self.data.merchandises
            });
          } else {
            if (self.data.merchandises.length > 0) {
              wx.showToast({
                title: '没有更多商品了',
                icon: 'none'
              });
            }
          }
          self.data.stopLoadMore = false;
        }
      },
      fail: function (e) {
        console.error(e);
      }
    })
  },
  lower: function() {
    const self = this;
    if (self.data.stopLoadMore) {
      return;
    }
    self.setData({
      page: self.data.page + 1 //上拉到底时将page+1后再调取列表接口
    });
    self.getGoods();
 
  },
  back() {
    if(getCurrentPages().length>1){
        wx.navigateBack();
    }else{
        wx.redirectTo({
            url:'/pages/roomList/index'
        });
    }
  },
  bindGetUserInfo(e) {
    console.log(e, e.detail.userInfo);
    if (e.detail.userInfo) {
      app.globalData.userInfo = e.detail.userInfo;
      this.setData({
        userInfo: e.detail.userInfo
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '需获取信息用于登录，请重新登录',
      })
    }
  },
  getState() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      });
      loginApp(this.data.userInfo.nickName);
    } else {
      // 获取用户信息
      wx.getSetting({
        success: res => {
          console.log(res);
          if (res.authSetting['scope.userInfo']) {
            // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
            wx.getUserInfo({
              success: res => {
                // 可以将 res 发送给后台解码出 unionId
                app.globalData.userInfo = res.userInfo
                loginApp(res.userInfo.nickName);

                // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
                // 所以此处加入 callback 以防止这种情况
                if (this.userInfoReadyCallback) {
                  this.userInfoReadyCallback(res)
                }
              }
            })
          } 
        }
      })
    }
    if (!wx.getStorageSync('sessionId')) {
      console.log('no sessionId');
      this.data.userInfo && loginApp(this.data.userInfo.nickName)
    }
  }
})