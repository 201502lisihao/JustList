// pages/activity/newYearResult/newYearResult.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    img: "/images/win.png",
    isTimeToShow: false,
    winCode: '',
    winUserNickname: '',
    winUserImgPath: '',
    hasWinUserInfo: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    //校验开奖时间
    var date = new Date();
    var nowTime = date.getTime();
    if (nowTime >= 1580472000000) {
    // if (nowTime >= 1530558400000){
      that.setData({
        isTimeToShow: true
      });
    }

    //未到开奖时间直接返回
    if( ! that.data.isTimeToShow){
      console.log('未到时间，展示前端静态页');
      return;
    }

    //开奖逻辑
    if (options.ticketCode){
      console.log(options.ticketCode);
      var ticketCode = options.ticketCode;
      //调用服务器获取中奖结果
      wx.request({
        url: 'https://www.qianzhuli.top/just/getwininfo',
        success: function (res){
          console.log('服务器返回');
          console.log(res);
          if(res.data.code == 200){
            //获取中奖信息
            var winUserNickname = res.data.win_user_nickname;
            var winUserImgPath = res.data.win_user_img_path;
            var winCode = res.data.win_code;

            //设置页面展示数据
            that.setData({
              winCode: winCode,
              winUserNickname: winUserNickname,
              winUserImgPath: winUserImgPath,
              hasWinUserInfo: true
            });
          } else {
            //接口返回异常逻辑
            console.log('获取中奖信息接口失败');
          }

        }
      })
      
    }

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

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
  onShareAppMessage: function () {

  }
})