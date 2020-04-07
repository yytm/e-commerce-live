import eventEmitter from '../lib/eventEmitter.js'
import { ZegoClient } from '../lib/jZego-wx-1.4.0.js'

export let zegoLib = class{
    /**
     * appid 必填，应用id，由即构提供
     * uid 必填，用户自定义id，全局唯一
     * nickName 必填，用户自定义昵称
     * remoteLogLevel 日志上传级别，建议取值不小于 logLevel
     * logLevel 日志级别，debug: 0, info: 1, warn: 2, error: 3, report: 99, disable: 100（数字越大，日志越少）
     * server 必填，服务器地址，由即构提供
     * logUrl 必填，log 服务器地址，由即构提供
     * audienceCreateRoom false观众不允许创建房间
     * @param {*} options = { appid,uid,nickName,remoteLogLevel,logLevel,server,logUrl,audienceCreateRoom }
     */
    constructor(options = {}){
        this.EventEmitter = new eventEmitter()
        this.client = new ZegoClient()
        this.setConfig(options)
        this.proxy()
    }


    /**
     * 监听事件
     */
    on(eventName,callback){
        this.EventEmitter.on(...Array.from(arguments))
    }
    /**
     * 触发事件
     */
    emit(eventName){
        //let args = Array.from(arguments).slice(1)
        this.EventEmitter.emit(...Array.from(arguments))
        //this.EventEmitter.emit.apply(this.EventEmitter,Array.from(arguments))
    }
    /**
     * 关闭事件
     */
    off(eventName){
        this.EventEmitter.off(...Array.from(arguments))
    }
    /**
     * 设置配置
     * @param {*} options 
     */
    setConfig(options = {}){
        let { appid,uid:idName,nickName,remoteLogLevel,logLevel,server,logUrl,audienceCreateRoom } = options
        this.client.config({ 
            appid,
            idName,
            nickName,
            remoteLogLevel,
            logLevel,
            server,
            logUrl,
            audienceCreateRoom 
        })

        console.log('调用完毕 config',{ 
            appid,
            idName,
            nickName,
            remoteLogLevel,
            logLevel,
            server,
            logUrl,
            audienceCreateRoom 
        })
    }

    /**
     * 进行代理
     */
    proxy(){
        //以on开头的都被事件代理
        let eventKeys = Object.getOwnPropertyNames(zegoLib.prototype).filter(key => key.startsWith('on') && key !== 'on')

        eventKeys.forEach(key => {
            //当为setter function的时候 默认帮助监听对象
            //当为setter null的时候 默认取消所有监听
            let setter = val => {
                let isFunction = typeof val === 'function'
                //取消绑定事件
                if(val === null || isFunction){ this.off(key) }
                //绑定一个新事件
                if(isFunction){
                    let app = getApp()
                    app.globalData.event = app.globalData.event || {}
                    app.globalData.event[key] = val
                    this.on(key,val)
                }
            }

            this.client[key] = (...args) => {
                console.log('代理事件被触发:',key,'参数：',args)
                //触发事件
                this.emit(key,...args)
            }

            //代理属性
            Object.defineProperty(this,key,setter)
        })

        //被调用后 销毁
        this.proxy = null
    }

    /**
     * 通用调底层方法 可以支持返回promise
     * @param {*} methodName 
     */
    CallZegoLib(methodName = ''){
        //检测是否存在
        if(!(methodName in this.client) || typeof this.client[methodName] !== 'function'){ 
            return Promise.reject() 
        }
        
        let args = Array.from(arguments).slice(1)
        let resolve, reject

        let successFn = args[args.length - 2]
        let failFn = args[args.length - 1]
        
        //没有传递任何callback的时候
        if(typeof successFn !== 'function' && typeof failFn !== 'function'){
            //添加两个占位符
            args = [...args,(successFn = null),(failFn = null)]
        }

        //只传递一个function的时候  说明只传递了success
        if(typeof failFn === 'function' && typeof successFn !== 'function'){
            successFn = failFn
            //添加一个占位符
            args = [...args,(failFn = null)]
        }

        //把占位符消耗掉 success
        args[args.length - 2] = function (response){
            typeof successFn === 'function' && successFn(response)
            resolve(response)
        }
        //把占位符消耗掉 error
        args[args.length - 1] = function (error){
            typeof failFn === 'function' && failFn(error)
            reject(error)
        }

        //返回Promise
        return new Promise((res,rej) => {
            resolve = res,reject = rej
            //已经被检测过 所以一定存在
            this.client[methodName].apply(this.client,args)
        })
    }

    /**
     * 获取到推拉流的Rtmp地址
     * @param {*} streamId  流id
     * @param {*} url  rtmp地址
     * @param {*} type  推拉流	数值 0: 拉流 1: 推流
     */
    onStreamUrlUpdate(streamId, url, type){

    }

    /**
     * 房间连接断开通知
     * @param {*} error = { code,msg }
     */
    onDisconnect(error){

    }

    /**
     * 流更新通知
     * @param {*} type 变更类型	数值，0:添加， 1:删除
     * @param {*} streamList 变更流列表	对象数组
     */
    onStreamUpdated(type, streamList){

    }

    /**
     * 拉流状态变更通知
     * @param {*} type 流状态类型	数值 start:0, stop:1, retry:2
     * @param {*} streamId  流id
     * @param {*} errorCode  错误码 error > 10000 表示即构调度错误。否则表示小程序拉流错误
     */
    onPlayStateUpdate(type, streamId, errorCode){

    }

    /**
     * 推流状态变更通知
     * @param {*} type 流状态类型	数值 start:0, stop:1, retry:2
     * @param {*} streamId  流id
     * @param {*} errorCode  错误码 error > 10000 表示即构调度错误。否则表示小程序拉流错误
     */
    onPublishStateUpdate(type, streamId, errorCode){

    }

    /**
     * 房间消息通知
     * @param {*} chat_data  消息内容	数组
     * @param {*} server_msg_id 服务器最新消息id
     * @param {*} ret_msg_id 当前推送消息id
     */
    onRecvRoomMsg(chat_data, server_msg_id, ret_msg_id){

    }

    /**
     * 收到大房间的IM消息
     * @param {*} messageList  消息列表	对象数组
     * @param {*} roomId 房间ID
     */
    onRecvBigRoomMessage(messageList, roomId){

    }

    /**
     * 收到房间其他用户发送的可靠消息
     * @param {*} type 消息类型	字符串
     * @param {*} seq 消息序列号
     * @param {*} data 消息内容
     */
    onRecvReliableMessage(type, seq, data){

    }

    /**
     * 推流质量回调
     * @param {*} streamId 流Id
     * @param {*} streamQuality 流质量 = { videoBitrate	视频码率,audioBitrate 音频码率,videoFPS	视频帧率 }
     */
    onPublishQualityUpdate(streamId, streamQuality){

    }
    /**
     * 拉流质量回调
     * @param {*} streamId 流Id
     * @param {*} streamQuality 流质量 = { videoBitrate	视频码率,audioBitrate 音频码率,videoFPS	视频帧率 }
     */
    onPlayQualityUpdate(streamId, streamQuality){

    }

    /**
     * 主播信息更新
     * @param {*} anchor_userid  主播id
     * @param {*} anchro_username  主播昵称
     */
    onGetAnchorInfo(anchor_userid, anchro_username){

    }

    /**
     * 房间所有成员回调 设置setUserStateUpdate为true时回调
     * @param {*} roomId 房间Id
     * @param {*} userList 成员列表 = { idName 用户id,nickName 用户昵称,role 角色类型 数值 1:主播 2:观众 }
     */
    onGetTotalUserList(roomId, userList){

    }

    /**
     * 房间成员变化回调 设置setUserStateUpdate为true时回调
     * @param {*} roomId 房间Id
     * @param {*} userList 成员列表 = { action 行为 数值 1:进入房间 2:退出房间,idName 用户id,nickName 用户昵称,role 角色类型 数值 1:主播 2:观众,logintime 登录时间 }
     */
    onUserStateUpdate(roomId, userList){

    }

    /**
     * 更新房间当前在线人数
     * @param {*} roomId 房间Id
     * @param {*} userCount 在线人数
     */
    onUpdateOnlineCount(roomId, userCount){

    }

    /**
     * 收到请求连麦信令 回复连麦请求respondJoinLive时需要使用此requestId
     * @param {*} requestId 请求Id
     * @param {*} from_userid 请求者userId
     * @param {*} from_username 请求者userName
     * @param {*} roomid 房间id
     */
    onRecvJoinLiveRequest(requestId, from_userid, from_username, roomid){

    }

    /**
     * 收到结束连麦信令
     * @param {*} requestId 请求Id
     * @param {*} from_userid 连麦者userId
     * @param {*} from_username 连麦者userName
     * @param {*} roomid 房间id
     */
    onRecvEndJoinLiveCommand(requestId, from_userid, from_username, roomid) {

    }
}

