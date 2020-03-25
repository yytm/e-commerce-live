import { CallWxFunction,EventEmitter,throttleByPromise } from '../components/lib/wx-utils'
import multipart from './Multipart.min.js'

const app = getApp()
const { globalData:{ BaseUrl,liveAppID,wxAppID } } = app

/**
 * 格式化业务返回的数据
 * @param {*} response  wx.request 返回的数据
 */
let formatResponse = function (response = {}){
  let { statusCode = 0,data = {} } = response
  //系统错误 转换了一下 返回业务类型的错误
  if(Number(statusCode) !== 200){ return Promise.reject({ ret:{ code:10000,msg:'系统错误001',statusCode } }) }
  //解析业务接口
  let { ret:{ code = 10000,msg = "系统错误" } } = data
  //业务接口 code 不为0 的时候 代表业务接口报错
  if(Number(code) !== 0){ return Promise.reject(data) }
  //业务接口成功
  return Promise.resolve(data)
}

/**
 * 确保函数被调用之前 用户已经授权过
 * 主要获取getLogin里面的session_id
 * @param {*} func 
 */
let wrap = function (func){
  return function (){
    //getUserInfo 统一app.js里面的方法
    return app.getUserInfo().then(() => func.apply(func,Array.from(arguments)))
  }
} 

/**
 * 用于处理请求业务接口
 * @param {*} options = { url,method,data }
 */
export let request = function (options = {}){
  //调用wx.request
  return CallWxFunction("request",{  
    url:"",method:"POST",data:{},
    ...options
  }).then(response => formatResponse(response))
}


/**
 * 调用后台的登陆接口 获取到session_id,uid等信息
 * 通过wx.setStorageSync进行缓存 可以通过wx.getStorageSync获取缓存数据
 * 缓存数据包括sessionId,uid,nickName,roomImg,role
 * @param {*} nickName 用户昵称
 * @returns {*} 返回字符串化的role = [admin,anchor,audience]
 */
export let loginApp =  function (nickName = ""){
  //获取appID 或者 使用测试的wxAppID
  const appID = wx.getAccountInfoSync().miniProgram.appId || wxAppID

  //先获取小程序的login
  return CallWxFunction('login').then((response = {}) => {
    //wx.login返回的数据
    let { code:wx_code } = response
    //请求数据
    return request({
      url:`${BaseUrl}/app/login`,
      method:'POST',
      data:{
        //小程序appid
        wx_appid:appID,
        //微信授权CODE
        wx_code,
        //腾讯提供的appid
        live_appid:liveAppID,
        //昵称
        nickName
      }
    })
  })
  //接口 /app/login 返回的数据
  .then((response = {}) => {
    //接口返回的数据
    let { 
      ret:{ code,msg },
      session_id = "",
      uid = "",
      nickname = "",
      name = "",
      cellphone = "",
      avatar = "",
      role = 4,
      room_img = ""
    } = response

    //角色
    let strRole = null
    switch(Number(role)){
      case 1:
        strRole = 'admin'
        break
      case 2:
        strRole = 'anchor'
        break
      case 4:
      default:
        strRole = 'audience'
        break
    }

    // uid = 99
    // nickName = "99ni"

    //缓存数据
    wx.setStorageSync('sessionId', session_id);
    wx.setStorageSync('uid', uid);
    wx.setStorageSync('nickName', nickname || 'Johnny');
    wx.setStorageSync('roomImg', room_img);
    wx.setStorageSync('role', strRole);

    return Promise.resolve(strRole)
  })
}

/**
 * 请求业务创建房间
 * @param {*} options = {  
 *  room_name, //房间名称
 *  need_playback, //是否录制
 *  is_private, //是否私密直播
 *  room_password, //房间密码
 *  room_img //直播封面
 * }
 * @returns {*} 返回promise result = { ret:{ code,msg },room_img }
 */
let setRoom = function (options = {}){
  const {  room_name,need_playback,is_private,room_password = "",room_img } = options
  
  //请求链接
  let requestURL = `${BaseUrl}/app/set_room`
  let uid = wx.getStorageSync('uid') || ''

  let req = {  
    //session信息
    session_id: wx.getStorageSync('sessionId'),
    //腾讯提供的appid 
    live_appid: liveAppID,
    //主播ID
    uid,
    //房间名称
    room_name,
    //房间ID
    room_id:`room${uid}${Date.now()}`,
    //房间密码
    //room_password: this.data.room_password,
    //是否录制
    need_playback,
    //是否私密直播
    is_private
  }

  //密码不为空 就加上
  if (String(room_password).trim() !== ''){
    req['room_password'] = room_password
  }

  //请求参数
  let request = {
    //字段参数
    fields: [{ name: 'req', value: JSON.stringify(req) }],
    //文件参数
    files: [{ filePath: room_img, filename: `room${Date.now()}.png`, name:'img' }]
  }

  //数据请求
  return new multipart(request)
    .submit(requestURL).then(response => formatResponse(response))
    .then(response => {
      response.room_id = req.room_id
      return Promise.resolve(response)
    })
}


/**
 * 获取商品列表
 * @param {*} options = { 
 *  uid, //主播ID
 *  page, //页面编码
 *  count  //每页显示数量
 * }
 * @returns {*} 返回promise result = { ret:{ code,msg },goods_count,goods_list:[] }
 */
let listGoods = function (options = {}){
  //如果没有传递UID 默认使用自己的UID尝试请求数据
  let {  uid = '',page = 1,count = 10 } = options
  //如果uid为空 默认使用自己的uid尝试请求
  uid = !!!String(uid)? (wx.getStorageSync('uid') || '') : uid

  //请求数据
  return request({
    //请求地址
    url:`${BaseUrl}/app/list_goods`,
    method:'POST',
    data:{
      //session信息
      session_id: wx.getStorageSync('sessionId'),
      //腾讯提供的appid 
      live_appid: liveAppID,
      //主播ID
      uid,
      //页面编码
      page,
      //每页显示数量
      count
    }
  })
} 

/**
 * 获取登录直播间token
 */
let getRoomToken = function (options = {}){
  //如果没有传递UID 默认使用自己的UID尝试请求数据
  let {  uid = '' } = options
  //如果uid为空 默认使用自己的uid尝试请求
  uid = !!!String(uid)? (wx.getStorageSync('uid') || '') : uid
  //请求数据
  return request({
    //请求地址
    url:`${BaseUrl}/app/get_room_token`,
    method:'POST',
    data:{
      //session信息
      session_id: wx.getStorageSync('sessionId'),
      //腾讯提供的appid 
      live_appid: liveAppID,
      //进入房间的idName string类型
      user_name:String(uid)
    }
  })
}

/**
 * 获取房间列表
 * @param {*} options = {
 *  uid, //根据主播id进行过滤
 *  status //根据状态过滤 1 未开始 2 直播中 4 已结束 8 禁播 16 可回放
 * }
 */
let getRoomList = function (options = {}){
  //如果没有传递UID 默认使用自己的UID尝试请求数据
  let {  uid,status  } = options

  //请求参数
  let params = {
    //session信息
    session_id: wx.getStorageSync('sessionId'),
    //腾讯提供的appid 
    live_appid: liveAppID
  }

  //根据主播id过滤
  if(!isNaN(uid)){
    params['uid'] = uid
  }
  //根据状态过滤
  if(!isNaN(status)){
    params['status'] = status
  }

  //请求数据
  return request({
    //请求地址
    url:`${BaseUrl}/app/get_room_list`,
    method:'POST',
    data:params
  })
}
/**
 * 心跳
 * @param {*} options = {
 *  uid,
 *  room_id
 * }
 */
let hd = function (options = {}){
  //如果没有传递UID 默认使用自己的UID尝试请求数据
  let {  uid = '',room_id = '' } = options
  //如果uid为空 默认使用自己的uid尝试请求
  uid = !!!String(uid)? (wx.getStorageSync('uid') || '') : uid

  //请求数据
  return request({
    //请求地址
    url:`${BaseUrl}/app/hb`,
    method:'POST',
    data:{
      //session信息
      session_id: wx.getStorageSync('sessionId'),
      //腾讯提供的appid 
      live_appid: liveAppID,
      //直播间ID
      room_id,
      //主播ID
      uid
    }
  })
}

/**
 * 获取自己的房间列表
 * @param {*} options = {
 *  status //根据状态过滤 1 未开始 2 直播中 4 已结束 8 禁播 16 可回放
 * }
 */
let getSelfRommList = function (options = {}){
  let uid = wx.getStorageSync('uid')
  return getRoomList({ ...options,uid })
}

/**
 * 做一层代理 确保在调用之前 可以拿到用户到session_id
 */
export let requestSetRoom = wrap(setRoom)
export let requestListGoods = wrap(listGoods)
export let requestGetRoomToken = wrap(getRoomToken)
//防止500毫秒内 多次调用
export let requestGetRoomList = throttleByPromise(wrap(getRoomList))
export let requestGetSelfRoomList = throttleByPromise(wrap(getSelfRommList))
export let requestHd = wrap(hd)

//监听事件
//用户已经授权获取到了用户信息
//逻辑在app.js里面
EventEmitter.on('getUserInfo',userInfo => {
  let { nickName } = userInfo
  //自动登陆 获取相关信息
  loginApp(nickName)
})
