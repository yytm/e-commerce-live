function _request({url, data = {}, testMode = true}) {
    return new Promise((res, rej) => {
        wx.request({
            url,
            data,
            header: {
                'content-type': 'text/plain'
            },
            success(result) {
                console.log(">>>[liveroom-room] get login token success. token is: " + result.data);
                if (result.statusCode != 200) {
                    return;
                }
                if (testMode) {
                    res(result.data);
                } else {
                    const token = /token:\s(.+)/.exec(result.data)&&/token:\s(.+)/.exec(result.data)[1];
                    res(token)
                }
            },
            fail(e) {
                console.log(">>>[liveroom-room] get login token fail, error is: ")
                console.log(e);
                rej(e)
            }
        })
    })
}

function getLoginToken(userID, appid) {
    // let { tokenURL,cgi_token, appSign, tokenURL2 } = getApp().globalData;
    let tokenURL = "https://wssliveroom-demo.zego.im/token";
    let appSign = '';
    let cgi_token = '';
    let tokenURL2 = "https://sig-wstoken.zego.im:8282/tokenverify";
    if (appSign) {
        console.log('>>> get token first type')
        const now = new Date().getTime();
        const time = Math.floor(now / 1000 + 30 * 60);
        return _request({
            url: tokenURL2,
            data: {
                app_id: appid,
                app_secret: appSign,
                id_name: userID,
                nonce: now,
                expired: time
            },
            testMode: false
        })
    } else {
        console.log('>>> get token second type')
        return _request({
            url: tokenURL,
            data: {
                app_id: appid,
                id_name: userID,
                cgi_token
            },
            testMode: true
        })
    }
}


function loginApp(nickName) {
    const _wxAppID = wx.getAccountInfoSync().miniProgram.appId || wxAppID;
    const { BaseUrl, wxAppID, liveAppID } = getApp().globalData;

    return new Promise((res, rej) => {
      wx.login({
        success(result) {
          console.log('wx login success');
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          console.log(result, BaseUrl, wxAppID);
          wx.request({
            url: BaseUrl + '/app/login',
            method: 'POST',
            data: {
              "wx_appid": _wxAppID,
              "wx_code": result.code,
              "live_appid": liveAppID,
              "nickname": nickName
            },
            success(result) {
              console.log('result', result);
              if (result.statusCode !== 200) return;
              if (result.data.ret && result.data.ret.code == 0) {
                let _role = '';
                wx.setStorageSync('sessionId', result.data['session_id']);
                wx.setStorageSync('uid', result.data['uid']);
                wx.setStorageSync('nickName', result.data['nickname']);
                // wx.setStorageSync('avatar', result.data['avatar']);
                switch (result.data.role) {
                  case 1: {
                    _role = 'admin';
                    break;
                  }
                  case 2: {
                    _role = 'anchor';
                    break;
                  }
                  case 4: {
                    _role = 'audience';
                    break;
                  }
                  default: {
                    _role = 'audience';
                    break;
                  }
                }
                // console.log('role', _role);
                wx.setStorageSync('role', _role);
                if (_role === 'anchor') {
                  wx.setStorageSync('roomImg', result.data['room_img']);
                }
                res(_role);
              } else {
                rej()
              }
            },
            fail(e) {
              console.error('fail ', e);
              rej();
            }
          })
        },
        fail() {
          console.error('wx login fail');
          rej();
        }
      })

    })

}
module.exports = {
    getLoginToken,
    loginApp
};