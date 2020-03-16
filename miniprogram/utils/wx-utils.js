import eventEmitter from './eventEmitter.js'


/**
 * 
 * @param {*} wxFunctionName 微信方法名称
 * @return 返回peomise
 */
export const CallWxFunction = function (wxFunctionName,args1 = {}){
    let args = Array.from(arguments).splice(2)
    let resolve, reject
    if(Object.prototype.hasOwnProperty.call(wx,wxFunctionName)){
        let { success = () => {},fail = () => {} } = args1
        args1.success = response => {
            success(response)
            resolve(response)
        }
        args1.fail = error => {
            fail(error)
            reject(error)
        }
        wx[wxFunctionName].apply(wx,[args1,...args])
    }
    return new Promise((res,rej) => { resolve = res,reject = rej })
}

/**
 * 用于事件通知
 */
export const EventEmitter = new eventEmitter()

/**
 * 给返回promise的函数 加上防抖
 * @param {*} promiseFunction 可以返回promise的函数
 * @param {*} timeSpan 需要hold的时间 单位毫秒  默认500
 */
export const throttleByPromise = function(promiseFunction = () => Promise.resolve(),timeSpan = 500){
    //查看是否已经被添加过防抖 
    //已经添加过的话 直接返回
    if(promiseFunction.__isThrottle__){ return promiseFunction }

    let task = []
    let startTime = 0
    
    //清空队列
    let responseAll = function (result,isSuccess = true){
        while(task.length > 0){
            let { resolve,reject } = task.shift() || {}
            isSuccess 
                ? typeof resolve === 'function' && resolve(result)
                : typeof reject === 'function' && reject(result)
        }
    }

    let responseFn = function(){
        let now = Date.now()
        if(now - startTime <= timeSpan){ 
            let sender = {}
            task.push(sender)
            return new Promise((res,rej) => { sender.resolve = res,sender.reject = rej })
        }
        startTime = now
        return promiseFunction().then(response => {
            responseAll(response)
            return Promise.resolve(response)
        }).catch(error => {
            responseAll(error,false)
            return Promise.reject(error)
        })
    }
    
    //标记 已经被添加过防抖
    responseFn.__isThrottle__ = true
    return responseFn
}

