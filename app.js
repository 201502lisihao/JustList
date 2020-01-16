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
        var code = res.code;
        wx.getUserInfo({
          success: function (res) {
            //存入缓存，用于自动登录
            wx.setStorageSync('userInfo', res.userInfo);
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
                  wx.setStorageSync('userId', res.data.user_id);
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

  //缓存的四个方法，增加过期时间

  /**
   * 本地缓存中是否存在指定key
   */
  isset: function(key){
    var value = wx.getStorageSync(key);
    return value !='' && value != null && value != undefined;
  },
  
  /**
   * set本地缓存，带过期时间的
   */
  setCache(key, value, expire){
    wx.setStorageSync(key, value);
    var expireTime = parseInt(expire);
    if(expireTime > 0){
      var newTime = Date.parse(new Date());
      newTime = newTime / 1000 + expireTime;
      wx.setStorageSync(key + 'expire', newTime + "");
    }else{
      //永久有效
      wx.removeStorageSync(key + 'expire')
    }
  },


  /**
   * get本地缓存
   */
  getCache(key){
    var deadTime = wx.getStorageSync(key + 'expire');
    if(deadTime){
      if(parseInt(deadTime) < Date.parse(new Date()) / 1000){
        wx.removeStorageSync(key);
        wx.removeStorageSync(key + 'expire');
        console.log('缓存'+key+'过期');
        return null;
      }
    }
    var res = wx.getStorageSync(key);
    if(res){
      return res;
    }else{
      return null;
    }
  },

  /**
   * 删除缓存
   */
  deleteCache(key){
    wx.removeStorageSync(key);
    wx.removeStorageSync(key + 'expire');
  }
})