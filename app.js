//app.js
App({
  globalData: {
    userInfo: null,
  },
  onLaunch: function () {
    //检查用户授权登录状态,顺便取一下utoken和userId
    this.checkUser();
  },
  onUnlaunch: function () {
    //小程序销毁时调用
  },

  /**
   * 获取用户是否授权登录
   */
  checkUser: function () {
    var that = this;
    wx.getSetting({
      success: function (res) {
        //如果用户已经授权过，则可以使用wx.getUserInfo结果获取用户信息
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: function (res) {
              //放到globaldata中，用于授权过后的自动登录
              that.globalData.userInfo = res.userInfo;
              //调用获取utoken和userId方法，写缓存
              that.getUtokenAndUserId(res.encryptedData, res.iv);
              //callback
              if (that.userInfoReadyCallback) {
                that.userInfoReadyCallback(res);
              }
            }
          })
        }
      }
    });
  },

  /**
   * 请求服务器获取用户utoken和userId，并放入本地缓存
   */
  getUtokenAndUserId: function (encryptedData, iv) {
    var encryptedData = encryptedData;
    var iv = iv;
    //获取用户缓存的utoken
    var utoken = wx.getStorageSync('utoken');
    //login方法获取code
    wx.login({
      success: function (res) {
        var code = res.code;
        wx.request({
          url: 'https://www.qianzhuli.top/just/userauthlogin',
          method: 'POST',
          data: {
            utoken: utoken,
            code: code,
            encryptedData: encryptedData,
            iv: iv
          },
          fail: function (res) {
            console.log('请求userAuthLogin失败,res=' + res)
          },
          success: function (res) {
            console.log('获取utoken和userId成功');
            console.log(res.data);
            //设置用户缓存
            var utoken = res.data.utoken;
            var userId = res.data.user_id;
            try {
              wx.setStorageSync('utoken', utoken);
              wx.setStorageSync('userId', userId);
            } catch (e) {
              console.log(e);
            }
          }
        });
      }
    })
  },
})