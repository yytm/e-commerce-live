// components/per-center/index.js
const Multipart = require('../../utils/Multipart.min.js');
const app = getApp();
let { liveAppID, BaseUrl } = app.globalData;
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    replayList: {
      type: Array,
      value: [],
      observer(list){
        let roomList = list.map(room => {
          //换算时间文案
          let playback_duration = isNaN(room.playback_duration)? 0 : Number(room.playback_duration)
          let day = parseInt(playback_duration / 86400) 
          let h = parseInt((playback_duration % 86400) / 3600)
          let m = parseInt((playback_duration % 3600) / 60)
          let s = parseInt(playback_duration % 60)
          room.playback_duration  = `${day? day + '天 ' : ''}${h < 10? '0' + h : h}:${m < 10? '0' + m : m}:${s < 10? '0' + s : s}`
          return room
        })
        this.setData({ roomList })
      }
    },
    role: {
      type: String,
      value: ''
    },
    avatar: {
      type: String,
      value: ''
    },
    nickName: {
      type: String,
      value: ''
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    delBtnWidth: 180,
    startX: "",
    delIndex: -1,
    isShowConfirm: false,
    title: '是否确认删除回放？',
    cancelText: '取消',
    confirmText: '删除回放',
    bottom: '124',
    isShowUpdate: false,
    roomList:[]
  },

  ready() {

    let systemInfo = wx.getSystemInfoSync();
    let rect = wx.getMenuButtonBoundingClientRect();
    console.log(rect.top, systemInfo);
    let gap = rect.top - systemInfo.statusBarHeight; //动态计算每台手机状态栏到胶囊按钮间距
    let navBarHeight = gap + rect.bottom;
    console.log('navBarHeight', rect, navBarHeight);
    const top = rect.top;
    const height = rect.height;
    this.setData({
      navBarHeight,
      top,
      height
    });

    this.initEleWidth();
  },
  /**
   * 组件的方法列表
   */
  methods: {
    itemTap(e){
      let { currentTarget:{ dataset:{ item:room } } } = e

      // 防止两次点击操作间隔太快
      let nowTime = new Date()
      let tapTime = this.tapTime = this.tapTime || nowTime
      if(nowTime - tapTime <= 500){ return }
      this.tapTime = nowTime

      const { room_id } = room
      //跳转页面
      wx.navigateTo({ url:`/pages/video/index?roomID=${room_id}` })
    },
    touchS: function (e) {
      if (e.touches.length == 1) {
        this.setData({
          //设置触摸起始点水平方向位置
          startX: e.touches[0].clientX
        });
      }
    },
    touchM: function (e) {
      if (e.touches.length == 1) {
        //手指移动时水平方向位置
        var moveX = e.touches[0].clientX;
        //手指起始点位置与移动期间的差值
        var disX = this.data.startX - moveX;
        var delBtnWidth = this.data.delBtnWidth;
        var txtStyle = "";
        if (disX == 0 || disX < 0) {//如果移动距离小于等于0，说明向右滑动，文本层位置不变
          txtStyle = "left:0px";
        } else if (disX > 0) {//移动距离大于0，文本层left值等于手指移动距离
          txtStyle = "left:-" + disX + "px";
          if (disX >= delBtnWidth) {
            //控制手指移动距离最大值为删除按钮的宽度
            txtStyle = "left:-" + delBtnWidth + "px";
          }
        }
        //获取手指触摸的是哪一项
        var index = e.currentTarget.dataset.index;
        var replayList = this.data.replayList;
        replayList[index].txtStyle = txtStyle;
        //更新列表的状态
        this.setData({
          replayList: replayList
        });
      }
    },
    touchE: function (e) {
      if (e.changedTouches.length == 1) {
        //手指移动结束后水平位置
        var endX = e.changedTouches[0].clientX;
        //触摸开始与结束，手指移动的距离
        var disX = this.data.startX - endX;
        var delBtnWidth = this.data.delBtnWidth;
        //如果距离小于删除按钮的1/2，不显示删除按钮
        var txtStyle = disX > delBtnWidth / 2 ? "left:-" + delBtnWidth + "px" : "left:0px";
        //获取手指触摸的是哪一项
        var index = e.currentTarget.dataset.index;
        var replayList = this.data.replayList;
        replayList[index].txtStyle = txtStyle;
        //更新列表的状态
        this.setData({
          replayList: replayList
        });
      }
    },
    //获取元素自适应后的实际宽度
    getEleWidth: function (w) {
      var real = 0;
      try {
        var res = wx.getSystemInfoSync().windowWidth;
        var scale = (750 / 2) / (w / 2);//以宽度750px设计稿做宽度的自适应
        real = Math.floor(res / scale);
        return real;
      } catch (e) {
        return false;
        // Do something when catch error
      }
    },
    initEleWidth: function () {
      var delBtnWidth = this.getEleWidth(this.data.delBtnWidth);
      this.setData({
        delBtnWidth: delBtnWidth
      });
    },
    //点击删除按钮事件
    delItem: function (e) {
      console.log('delItem', e);
      //获取列表中要删除项的下标
      var index = e.currentTarget.dataset.index;
      this.setData({
        delIndex: index,
        isShowConfirm: true,
      });
    },
    cancelClick() {
      console.log('cancalClick');
      const index = this.data.delIndex;
      var replayList = this.data.replayList;
      const delItem = replayList[index];
      delItem.txtStyle = "left:0px";
      this.setData({
        replayList
      });
    },
    confirmClick() {
      console.log('confirmClick');
      const index = this.data.delIndex;
      var replayList = this.data.replayList;
      //移除列表中下标为index的项
      const deletedRoom = replayList.splice(index, 1)[0];
      this.triggerEvent('delRoom', {
        content: deletedRoom
      });
      //更新列表的状态
      this.setData({
        delIndex: -1,
        replayList: replayList
      });
    },
    updateInfoEvent() {
      this.setData({
        isShowUpdate: true
      })
    },
    cancelUpdate() {
      console.log('cancelUpdate');

    },
    confirmUpdate(e) {
      const { name, filePath } = e.detail;
      console.log('name', name);
      const fields = [{
        name: 'req',
        value: `{"session_id":"${wx.getStorageSync('sessionId')}","live_appid":${liveAppID},"name":"${name}"}`
      }]
      const files = []
      console.log('filePath: ', filePath);
      if (filePath) {
        files.push({
          filePath: filePath, filename: 'example.png', name: 'img'
        })
      }
      new Multipart({
        fields,
        files
      }).submit(BaseUrl + '/app/update_anchor')
        .then(res => {
          console.log('set room suc', res);
          const result = res.data;
          let toastTest = ''
          if (result.ret && result.ret.code === 0) {
            // result.room_img && wx.setStorageSync('roomImg', result.room_img);
            toastTest = '修改成功'
            app.globalData.userInfo = {
              ...app.globalData.userInfo,
              avatarUrl:filePath? filePath : this.data.avatar,
              nickName:name
            }
            wx.setStorageSync('nickName',app.globalData.userInfo.nickName)
            wx.setStorageSync('avatar',app.globalData.userInfo.avatarUrl);
            //通知事件
            this.triggerEvent('onPersonUpdate')
          }else{
            let { ret:{ msg,message } } = result
            toastTest = msg || message || '修改失败'
          }
          wx.showToast({ title:toastTest,icon:'none' })
        }).catch(e => {
          console.error('set room fail', e);
        })
    }
  }
})
