import { CallWxFunction,EventEmitter,throttleByPromise } from '../components/lib/wx-utils'
import multipart from './Multipart.min.js'

const app = getApp()
const { globalData:{ BaseUrl,liveAppID,wxAppID } } = app


/**
 * 用于处理请求业务接口
 * @param {*} options = { url,method,data }
 */
export let request = function (options = {}){
  //调用wx.request
  return CallWxFunction("request",{  
    url: "", method: "POST", data: {}, timeout:60000,
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
let login =  function (nickName = ""){
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
      //观众没有uid
      uid = `${Date.now()}${parseInt(Math.random() * 10)}`,
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

    avatar = avatar || '/resource/per_center.png'

    //缓存数据
    wx.setStorageSync('sessionId', session_id);
    wx.setStorageSync('uid', uid);
    wx.setStorageSync('nickName', nickname);
    wx.setStorageSync('roomImg', room_img);
    wx.setStorageSync('role', strRole);
    wx.setStorageSync('avatar',avatar)

    //给用户信息 赋值登陆信息
    app.globalData.userInfo = { 
      ...app.globalData.userInfo,
      ...response,
      nickName:nickname,
      avatarUrl:avatar,
      role:strRole,
      session_id,
      uid
    }

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
  const uid = wx.getStorageSync('uid') || ''
  const {  
    room_name,
    need_playback,
    is_private,
    room_password = "",
    room_img,room_type,
    start_live_time,
    room_id = `room${uid}${Date.now()}`,
    //请求链接
    requestURL = `${BaseUrl}/app/set_room`
  } = options
  

  let req = {  
    //session信息
    session_id: wx.getStorageSync('sessionId'),
    //腾讯提供的appid 
    live_appid: liveAppID,
    //主播ID
    uid:Number(uid),
    //房间名称
    room_name,
    //房间ID
    room_id,
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
  //直播预告结束时间 （开播时间）
  if(start_live_time){
    req['start_live_time'] = start_live_time
  }

  //房间类型 2 直播房间  3 直播预告 1 obs
  if(room_type){
    req['room_type'] = room_type
  }

  //请求参数
  let request = {
    //字段参数
    fields: [{ name: 'req', value: JSON.stringify(req) }],
    //文件参数
    files: []
  }

  if(room_img){
    request['files'] = [{ filePath: room_img, filename: `room${Date.now()}.png`, name:'img' }]
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
 * 请求业务修改房间
 * @param {*} options = {  
 *  room_name, //房间名称
 *  need_playback, //是否录制
 *  is_private, //是否私密直播
 *  room_password, //房间密码
 *  room_img //直播封面
 * }
 * @returns {*} 返回promise result = { ret:{ code,msg },room_img }
 */
let updateRoom = function (options = {}){
  return setRoom({ ...options,requestURL:`${BaseUrl}/app/update_room` })
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
      uid:Number(uid),
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
  let {  uid,status,room_id  } = options

  //请求参数
  let params = {
    //腾讯提供的appid 
    live_appid: liveAppID
  }

  //session信息
  let session_id = wx.getStorageSync('sessionId')
  if(!!session_id){
    params['session_id'] = session_id
  }

  //根据主播id过滤
  if(!isNaN(uid) && uid){
    params['uid'] = uid
  }
  //根据状态过滤
  if(!isNaN(status)){
    params['status'] = status
  }
  //根据房间ID过滤
  if(!!room_id){
    params['room_id'] = room_id
  }
  //请求数据
  return request({
    //请求地址
    url:`${BaseUrl}/app/get_room_list`,
    method:'POST',
    data:params
  }).then(response => {
    let { ret,room_list } = response
    if(Array.isArray(room_list)){
      room_list = room_list.map(room => {
        //无头像 默认添加一个头像
        room.avatar = room.avatar || '/resource/per_center.png'
        return room
      })
    }
    return { ret,room_list }
  })
}


/**
 * 根据roomID请求数据
 * @param {*} requestURL  请求URL
 * @param {*} options 请求参数
 */
let requestRoomID = function (requestURL = "",options = {}){
  //如果没有传递UID 默认使用自己的UID尝试请求数据
  let {  uid = '',room_id = '' } = options
  //如果uid为空 默认使用自己的uid尝试请求
  uid = !!!String(uid)? (wx.getStorageSync('uid') || '') : uid

  //请求数据
  return request({
    //请求地址
    url:`${BaseUrl}${requestURL}`,
    method:'POST',
    data:{
      //session信息
      session_id: wx.getStorageSync('sessionId'),
      //腾讯提供的appid 
      live_appid: liveAppID,
      //直播间ID
      room_id,
      //主播ID
      uid:Number(uid)
    }
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
  return requestRoomID('/app/hb',options)
}
/**
 * 回放播放自增
 * @param {*} options 
 */
let playback = function (options = {}){
  return requestRoomID('/app/run_playback',options)
}
/**
 * 直播观看次数自增长
 * @param {*} options 
 */
let increaseRoomVisitCount = function (options = {}){
  return requestRoomID('/app/increase_room_visit_count',options)
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
 * 自增点赞数
 * @param {*} options = {
 *  //房间id
 *  room_id 
 * }
 */
let increaseRoomLoveCount = function (options = {}){
  return requestRoomID('/app/increase_room_love_count',options)
}

/**
 * 关闭房间
 * @param {*} options = {
 *  room_id 房间ID
 * }
 */
let clearRoom = function (options = {}){
  return requestRoomID('/app/clear_room',options)
}

/**
 * 校验直播间密码
 * @param {*} options = {
 *  room_id
 *  room_password
 * }
 */
let checkRoomPassword = function (options = {}){
  //如果没有传递UID 默认使用自己的UID尝试请求数据
  let {  room_id = '',room_password = '' } = options
  //如果uid为空 默认使用自己的uid尝试请求
  let uid =  wx.getStorageSync('uid') || ''

  //请求数据
  return request({
    //请求地址
    url:`${BaseUrl}/app/check_room_password`,
    method:'POST',
    data:{
      //session信息
      session_id: wx.getStorageSync('sessionId'),
      //腾讯提供的appid 
      live_appid: liveAppID,
      //直播间ID
      room_id,
      //主播ID
      uid:Number(uid),
      //输入的房间的密码
      room_password
    }
  })
}

/**
 * 更新主播信息
 * @param {*} nickName  昵称
 * @param {*} gender  性别
 * @param {*} cellphone  手机号码
 * @param {*} avatar  头像
 * @param {*} job_title  头衔
 * @param {*} wechat_id 微信号
 * @param {*} email  邮箱
 * @param {*} company  公司名
 */
let updateAnchor = function (options = {}){
  let { nickName,gender,cellphone,avatar,job_title,wechat_id,email } = options
  //请求地址
  let requestURL = `${BaseUrl}/app/update_anchor`
  //请求参数
  let req = {  
    //session信息
    session_id: wx.getStorageSync('sessionId'),
    //腾讯提供的appid 
    live_appid: liveAppID,
    //昵称
    name:nickName,
    //性别
    gender
  }

  //手机号码 非必传
  if(cellphone){
    req['cellphone'] = cellphone
  }
  //头衔 非必传
  if(job_title){
    req['job_title'] = job_title
  }
  //微信号 非必传
  if(wechat_id){
    req['wechat_id'] = wechat_id
  }
  //邮箱 非必传
  if(email){
    req['email'] = email
  }


  //请求参数
  let request = {
    //字段参数
    fields: [{ name: 'req', value: JSON.stringify(req) }],
    //文件参数
    files: []
  }

  if(avatar){
    request['files'] = [{ filePath: avatar, filename: `avatar${Date.now()}.png`, name:'img' }]
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
 * 删除回放
 * @param {*} options = {
 *  room_id
 * }
 */
let deletePlayback = function (options = {}){
  return requestRoomID('/app/delete_playback',options)
}

/**
 * 删除预告
 * @param {*} options = { room_id } 
 */
let deleteFeatureLive = function (options = {}){
  return requestRoomID('/app/delete_feature_live',options)
}

/**
 * 生成邀请码 返回邀请码以及二维码
 * @param {*} need_qrcode boolean 是否需要返回二维码
 * @param {*} page  小程序页面路径 生成二维码用
 * @param {*} param  小程序接收的参数 生成二维码用
 */
let getInvitCode = function (options = {}){
  let { need_qrcode = false,page = '',param = '' } = options
  //session信息
  let session_id = wx.getStorageSync('sessionId')
  //参数
  let req = { need_qrcode,session_id }
  //如果是生成二维码 就把page、param参数加上
  if(need_qrcode){
    req = { ...req,page,param }
  }

  //请求数据
  return request({
    //请求地址
    url:`${BaseUrl}/app/get_invitcode`,
    method:'POST',
    data:req
  })
}

/**
 * 校验邀请码
 * @param {*} invit_code 邀请码
 */
let chkInvitCode = function (options = {}){
  let { invit_code } = options
  //session信息
  let session_id = wx.getStorageSync('sessionId')

  //请求数据
  return request({
    //请求地址
    url:`${BaseUrl}/app/chk_invitcode`,
    method:'POST',
    data:{ session_id,invit_code }
  })
}

/**
 * 获取主播信息
 * @param {*} uid 
 */
let getDetailAnchorInfo = function (options = {}){
  let { uid } = options
  //session信息
  let session_id = wx.getStorageSync('sessionId')

  //请求数据
  return request({
    //请求地址
    url:`${BaseUrl}/app/get_anchor_detail`,
    method:'POST',
    data:{ session_id,anchor_id:uid,live_appid: liveAppID }
  })
}

/**
 * 获取主播活动列表
 * @param {*} uid 
 */
let getActivityList = function (options = {}){
  let { uid = wx.getStorageSync('uid') || '' } = options
  //session信息
  let session_id = wx.getStorageSync('sessionId')

  //请求数据
  return request({
    //请求地址
    url:`${BaseUrl}/app/get_activity_list`,
    method:'POST',
    data:{ session_id,uid,live_appid: liveAppID }
  })
}

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

//登陆
//只要登陆成功过 就缓存数据  之后取的数据都是缓存数据
export let loginApp = throttleByPromise(function (){
  let { time = 0,response } = login.__cache__ = login.__cache__ || {}
  //是否有缓存 缓存有效时间1小时
  if(response && !isNaN(time) && Date.now() - Number(time) <= 1000 * 60 * 60){
    return Promise.resolve(response)
  }
  //getUserInfo 统一app.js里面的方法
  return app.getUserInfo().then(({ nickName }) => login(nickName)).then(response => {
    //缓存数据
    login.__cache__ = { time:Date.now(),response }
    //返回结果
    return Promise.resolve(response)
  })
})
/**
 * 清理登陆缓存
 */
export let clearLoginCache = function (){
  login.__cache__ = { time:0 }
}
/**
 * 确保函数被调用之前 用户已经授权过
 * 主要获取login里面的session_id
 * @param {*} func 
 */
let wrap = function (func){
  return function (){
    return loginApp().then(() => func(...arguments))
  }
} 

/**
 * 做一层代理 确保在调用之前 可以拿到用户到session_id
 */
export let requestSetRoom = wrap(setRoom)
export let requestListGoods = wrap(listGoods)
export let requestGetRoomToken = wrap(getRoomToken)
//防止500毫秒内 多次调用
export let requestGetRoomList = throttleByPromise(getRoomList)
export let requestGetSelfRoomList = throttleByPromise(wrap(getSelfRommList))
export let requestHd = wrap(hd)
export let requestIncreaseRoomLoveCount = wrap(increaseRoomLoveCount)
export let requestClearRoom = wrap(clearRoom)
export let requestCheckRoomPassword = wrap(checkRoomPassword)
export let requestDeletePlayback = wrap(deletePlayback)
export let reuqestPlayback = wrap(playback)
export let requestIncreaseRoomVisitCount = wrap(increaseRoomVisitCount)
export let requestDeleteFeatureLive = wrap(deleteFeatureLive)
export let requestUpdateRoom = wrap(updateRoom)
export let requestGetInvitCode = wrap(getInvitCode)
export let requestChkInvitCode = wrap(chkInvitCode)
export let requestUpdateAnchor = wrap(updateAnchor)
export let requestGetDetailAnchorInfo = wrap(getDetailAnchorInfo)
export let requestGetActivityList = wrap(getActivityList)


//监听事件
//用户已经授权获取到了用户信息
//逻辑在app.js里面
EventEmitter.on('getUserInfo',({ nickName }) => {
  //自动登陆 获取相关信息
  loginApp(nickName)
})
