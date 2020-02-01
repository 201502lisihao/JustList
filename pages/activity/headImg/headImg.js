// pages/activity/headImg/headImg.js
//获取应用实例
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    img: "/images/gobg.png",
    maskHidden: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;

    //当前页面展示分享
    wx.showShareMenu({
      withShareTicket: true
    })

    if (wx.getStorageSync('userInfo')) {
      that.setData({
        userInfo: wx.getStorageSync('userInfo'),
        hasUserInfo: true
      })
    } else if (that.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        that.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          wx.setStorageSync('userInfo', res.userInfo)
          that.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }

    if(!that.data.hasUserInfo){
      return;
    }

    //生成海报
    that.createPoster();
  },

  getUserInfo: function (e) {
    wx.showLoading({
      title: '正在登录',
    })
    // console.log(e)
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
    //访问服务器保存用户信息并缓存在本地
    app.loginUser();
    wx.hideLoading();
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

  },

  /**
   * 生成海报
   */
  createPoster: function () {
    var that = this;
    that.setData({
      maskHidden: false
    });
    wx.showToast({
      title: '海报生成中...',
      icon: 'loading',
      duration: 1000
    });
    //转换头像url为高清
    var avatarUrl = that.headimgHD(that.data.userInfo.avatarUrl);
    //先下载头像到本地
    wx.getImageInfo({
      src: avatarUrl,
      success: function (res) {
        that.setData({
          avatarUrl: res.path
        });
      }
    });
    setTimeout(function () {
      that.doCreateNewPoster();
      wx.hideToast()
      that.setData({
        maskHidden: true
      });
    }, 1000);
  },

  /**
   * 执行生成海报
   */
  doCreateNewPoster: function () {
    var that = this;
    var context = wx.createCanvasContext('mycanvas');
    var path = that.data.avatarUrl;
    //绘制头像
    context.drawImage(path, 0, 0, 500, 500);

    var path1 = "/images/zhongguojiayou.png";
    context.drawImage(path1, 0, 0, 500, 500);

    // 最终绘制
    context.draw();
    //将生成好的图片保存到本地，需要延迟一会，绘制期间耗时
    setTimeout(function () {
      wx.canvasToTempFilePath({
        canvasId: 'mycanvas',
        destWidth: 500,
        destHeight: 500,
        fileType: 'jpg',
        quality: 1,
        success: function (res) {
          var tempFilePath = res.tempFilePath;
          //获取屏幕可用高度，计算海报距离屏幕顶部距离
          //todo lisihao 不同宽高比下，适配问题
          var systemInfo = wx.getSystemInfoSync();
          var canvasWidth = systemInfo.windowWidth * 0.7;
          var canvasHeight = canvasWidth;
          console.log('宽：' + canvasWidth + ' 高：' + canvasHeight);

          that.setData({
            imagePath: tempFilePath,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight
            // canvasHidden: true
          });
        },
        fail: function (res) {
          console.log(res);
        }
      });
    }, 200);
  },

  /**
   * 生成海报后返回首页
   */
  goBackToList: function () {
    //实质是隐藏
    this.setData({
      maskHidden: false
    });
  },

  /**
   * 用户点击保存到本地
   */
  saveToAlbum: function () {
    var that = this
    wx.saveImageToPhotosAlbum({
      filePath: that.data.imagePath,
      success(res) {
        that.setData({
          maskHidden: false
        })
        wx.showToast({
          title: '保存相册成功',
        })
      }
    })
  },

  /**
   * 转化用户头像url为高清
   */
  headimgHD: function (imageUrl) {
    console.log('原来的头像', imageUrl);

    imageUrl = imageUrl.split('/');        //把头像的路径切成数组

    //把大小数值为 46 || 64 || 96 || 132 的转换为0
    if (imageUrl[imageUrl.length - 1] && (imageUrl[imageUrl.length - 1] == 46 || imageUrl[imageUrl.length - 1] == 64 || imageUrl[imageUrl.length - 1] == 96 || imageUrl[imageUrl.length - 1] == 132)) {
      imageUrl[imageUrl.length - 1] = 0;
    }

    imageUrl = imageUrl.join('/');   //重新拼接为字符串

    console.log('高清的头像', imageUrl);

    return imageUrl;
  }
})