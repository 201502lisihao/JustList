//app.js
App({
  globalData: {
    userInfo: null,
  },
  onLaunch: function () {

  },
  onUnlaunch: function () {
    //小程序销毁时调用
  },


  /**
   * 用户点击登录时调用
   */
  loginUser: function () {
    var that = this;
    wx.login({
      success: function (res) {
        //code获取成功，保存为当前页面的全局变量code
        // that.setData({ code: res.code });
        var code = res.code;
        wx.getUserInfo({
          success: function (res) {
            //存入缓存，用于自动登录
            wx.setStorageSync('userInfo', res.userInfo);
            // that.globalData.userInfo = res.userInfo;
            var utoken = wx.getStorageSync('utoken');
            wx.request({
              url: 'https://www.qianzhuli.top/just/userauthlogin',
              method: 'POST',
              data: { 
                utoken: utoken,
                code: code,
                encryptedData: res.encryptedData,
                iv: res.iv
              },
              fail: function (res) {
                console.log('请求userAuthLogin失败,res=' + res)
              },
              success: function (res) {
                console.log('请求userAuthLogin成功');
                console.log(res.data);
                //设置用户缓存
                try {
                  wx.setStorageSync('utoken', res.data.utoken);
                  // wx.setStorageSync('userId', res.data.user_id);
                } catch (e) {
                  console.log(e);
                }
              }
            });
          },
        });
      },
      fail:function (res) {
        that.wetoast.toast({ title: res.err_desc });
      }
    });
    
  },

  /**
   * 本地缓存中是否存在指定key
   */
  isset: function(key){
    var value = wx.getStorageSync(key);
    return value !='' && value != null && value != undefined;
  }
})