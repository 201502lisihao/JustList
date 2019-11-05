Page({
  data: {
    showTopTips: false,
    showContactInput: true,
    suggestInput: "",
    contactInput: "",
  },
  /**
   * send
   */
  send: function (){
    // console.log(this.data.suggestInput);return;
    var that = this;
    var suggestInput = that.data.suggestInput
    var contactInput = that.data.contactInput
    //建议为空时报错
    if(suggestInput == ""){
      that.showTopTips();
      return;
    }
    //选择反馈结果时，未填写联系方式报错
    if (that.data.showContactInput && contactInput == ""){
      that.showTopTips();
      return;
    }
    var utoken = wx.getStorageSync('utoken');
    //请求服务器保存
    wx.request({
      url: 'https://www.qianzhuli.top/just/savesuggest',
      method: 'POST',
      data: {
        utoken: utoken,
        suggest: suggestInput,
        contact: contactInput,
      },
      complete: function (res){  
        setTimeout(function (){
          //提示意见发送成功
          wx.showToast({
            title: '提交成功',
          });
        }, 500);
        //跳回首页
        wx.redirectTo({
          url: '/pages/index/index',
        });
      }
    });
  },

  /**
   * showTopTips
   */
  showTopTips: function () {
    var that = this;
    this.setData({
      showTopTips: true
    });
    setTimeout(function () {
      that.setData({
        showTopTips: false
      });
    }, 3000);
  },

  /**
   * suggestInput
   */
  suggestInput: function (e){
    // console.log(e.detail.value);
    this.data.suggestInput = e.detail.value;
  },

  /**
   * contactInput
   */
  contactInput: function (e) {
    // console.log(e.detail.value);
    this.data.contactInput = e.detail.value;
  },

  /**
   * 
   */
  switchChange: function (e){
    var that = this;
    //获取反馈结果按钮是否打开
    var checkedValue = e.detail.value;
    that.setData({
      showContactInput: checkedValue
    });
  }
});