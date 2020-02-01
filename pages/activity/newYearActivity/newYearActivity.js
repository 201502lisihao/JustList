//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    hasUserId:false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    // 海报
    maskHidden: false,
    imagePath: '',
    avatarUrl: '',
    img: "/images/gobg.png",
    wechat: "/images/del.png",
    quan: "/images/del2.png",
    inputValue: "",
    hasRaffleTicket: false,
    raffleTicketList: [],
    aqrCodeLocalPath: "",
    isFriendHelp:false,
  },

  onLoad: function (options) {
    var that = this;

    //看是否有scene，有就解析后放缓存里
    if(typeof(options) != "undefined" && options != null){
      if (typeof (options.scene) != 'undefined' && options.scene != null) {
        var scene = decodeURIComponent(options.scene);
        var friendUserId = scene.split('&')[0];
        app.setCache('friendUserId', friendUserId, 86400);
        console.log('缓存friendUserId成功：' + friendUserId);
        that.setData({
          isFriendHelp: true
        })
      }
    }
    
    //当前页面展示分享
    wx.showShareMenu({
      withShareTicket: true
    });

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

    //检查是否有userId，没有userId的话，清除登录相关信息，退出前端页面重新登录
    if(!that.checkHasUserId()){
      return;
    }

    //获取用户已有奖券
    that.getRaffleTicketListByUserId();

    //好友助力
    if(app.getCache('friendUserId')){
      console.log('缓存中的friendUserId' + app.getCache('friendUserId'));
      //助力逻辑
      that.friendHelp();
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('test');
    this.getRaffleTicketListByUserId();
    wx.stopPullDownRefresh();
  },

  //检验登录，未登录的话提示登录
  getUserInfo: function (e) {
    var that = this;
    wx.showLoading({
      title: '正在登录',
    })
    // console.log(e)
    //访问服务器保存用户信息并缓存在本地
    app.loginUser();
    that.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true,
      hasUserId: true,
    });
    wx.hideLoading();
    setTimeout(function (){
      that.onLoad();
    }, 1000);
  },

  bindKeyInput: function (e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  /**
   * 触发生成海报
   */
  createPoster: function () {
    var that = this;
    that.setData({
      maskHidden: false
    });
    wx.showToast({
      title: '生成海报中...',
      icon: 'loading',
      duration: 1000
    });
    
    //校验是否有带参数二维码缓存
    var aqrCodePath = app.getCache('my_aqr_code_path');
    if(aqrCodePath){ 
      console.log('生成活动二维码命中缓存');
      //下载带参数二维码到本地，供生成海报时使用
      wx.getImageInfo({
        src: aqrCodePath,
        success: function (res) {
          that.setData({
            aqrCodeLocalPath: res.path
          });
        }
      });
    } else {
      //从服务器获取access_token
      wx.request({
        url: 'https://www.qianzhuli.top/just/getaccesstoken',
        success: function (res) {
          console.log(res);
          if (res.data.access_token) {
            //从服务器获取二维码url
            var userId = wx.getStorageSync('userId');
            wx.request({
              url: 'https://www.qianzhuli.top/just/getaqrcodepath',
              data: {
                scene: userId,
                page: "pages/activity/newYearActivity/newYearActivity",
                access_token: res.data.access_token
              },
              method: "POST",
              success: function (res) {
                console.log('服务器生成二维码接口返回:')
                console.log(res);

                if (res.data.url != undefined || res.data.url != null) {
                  //放入缓存，过期时间1天
                  app.setCache('my_aqr_code_path', res.data.url, 86400);
                  aqrCodePath = res.data.url;
                  //下载带参数二维码到本地，供生成海报时使用
                  wx.getImageInfo({
                    src: aqrCodePath,
                    success: function (res) {
                      that.setData({
                        aqrCodeLocalPath: res.path
                      });
                    }
                  });
                } else {
                  console.log('二维码url为空,msg='+res.data.errmsg);
                }
              }
            })
          } else {
            console.log('getaccesstoken未返回token');
          }
        },
        fail: function (res) {
          console.log('调用服务器获取access_token失败');
        }
      });
    }

    //延时，等待图片下载完成
    setTimeout(function () {
      if(that.data.aqrCodeLocalPath == "" || that.data.aqrCodeLocalPath == undefined){
        wx.showToast({
          title: '出了点小状况，点击重试',
          icon: 'none'
        });
        return;
      }
      that.doCreateNewPoster();
      wx.hideToast()
      that.setData({
        maskHidden: true
      });
    }, 2000);
  },

  /**
   * 执行生成海报
   */
  doCreateNewPoster: function () {
    var that = this;
    var context = wx.createCanvasContext('mycanvas');
    var path = "/images/newYearPoster.png";
    //绘制背景
    context.drawImage(path, 0, 0, 500, 631);

    //绘制用户名
    var userName = '@' + that.data.userInfo.nickName;
    context.setFontSize(20);
    context.setFillStyle('#000000');
    context.fillText(userName, 20, 611);

    //绘制个人邀请二维码
    var aqrCodeLocalPath = that.data.aqrCodeLocalPath;
    context.drawImage(aqrCodeLocalPath, 155, 375, 200, 200);

    // 最终绘制
    context.draw();
    //将生成好的图片保存到本地，需要延迟一会，绘制期间耗时
    setTimeout(function () {
      wx.canvasToTempFilePath({
        canvasId: 'mycanvas',
        destWidth: 500,
        destHeight: 631,
        fileType: 'jpg',
        quality: 1,
        success: function (res) {
          var tempFilePath = res.tempFilePath;
          //获取屏幕可用高度，计算海报距离屏幕顶部距离
          //todo lisihao 不同宽高比下，适配问题
          var systemInfo = wx.getSystemInfoSync();
          var canvasWidth = systemInfo.windowWidth * 0.8;
          // var canvasHeight = canvasWidth / (375 / 614);
          var canvasHeight = canvasWidth / (500 / 631);
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
   * 用户点击保存到本地
   */
  saveToAlbum: function () {
    var that = this
    wx.saveImageToPhotosAlbum({
      filePath: that.data.imagePath,
      success(res) {
        // that.setData({
        //   maskHidden: false
        // })
        // wx.showToast({
        //   title: '邀请好友助力',
        // })
        wx.showModal({
          content: '保存成功，邀请好友助力增加机会',
          showCancel: false,
          confirmText: '好的',
          confirmColor: '#333',
          success: function (res) {
            if (res.confirm) {
              console.log('用户点击确定');
              // 给用户奖励积分
              // that.shareOk();
              /* 该隐藏的隐藏 */
              that.setData({
                maskHidden: false
              })
            }
          },
          fail: function (res) {
            console.log("弹窗失败");
          }
        })
      }
    })
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
   * 立下新年Flag后的奖励
   */
  shareOk: function () {
    var that = this;
    console.log('用户立Flag完成');
    //请求服务端奖励用户抽奖券
    wx.request({
      url: 'https://www.qianzhuli.top/just/createticket',
      method: 'POST',
      data: {
        userId: wx.getStorageSync('userId'),
        channel: '立新年Flag',
      },
      success: function (res) {
        console.log('调用服务器获取奖券成功,res=');
        console.log(res);
        //服务器返回奖励奖券成功
        if (res.data.code == 200) {
          console.log('服务器成功,res=');
          console.log(res);
          wx.showToast({
            title: '奖券到手！',
          });
        } else {
          wx.showToast({
            title: 'Flag立下了！',
            icon: 'none',
          });
        }
      },
      fail: function (res) {
        //清除订单备注的缓存
        console.log('奖券失败,res=' + res)
      },
      complete: function(res) {
        //防止toast一闪而过
        setTimeout(() => {
          // 出海报
          // that.createPoster();
          //跳转首页
          wx.navigateTo({
            url: '/pages/index/index'
          });
        }, 1500);
      }
    })
  },

  /**
   * 好友助力逻辑
   */
  friendHelp: function(){
    var that = this;

    //获取缓存中的friendUserId（被助力人）
    var friendUserId = app.getCache('friendUserId');
    console.log('friendUserId:'+friendUserId);
    
    //获取userId
    var userId = wx.getStorageSync('userId');
    console.log('userId:' + userId);

    //调用服务器奖励奖券
    wx.request({
      url: 'https://www.qianzhuli.top/just/friendhelp',
      method: 'POST',
      data: {
        userId: userId,
        friendUserId: friendUserId,
      },
      success: function (res){
        console.log(res);
        var content = '已助力好友';
        if(res.data.code == 200){
          content = '助力好友成功，奖励你一张奖券！';
        }
        //提示用户助力成功！然后刷新页面
        wx.showModal({
          content: content,
          showCancel: false,
          success: function (res) {
            if (res.confirm) {
              app.deleteCache('friendUserId');
              that.onLoad();
            }
          }
        });
      }
    })
    
    //助力完成后删除scene缓存
    // app.deleteCache('scene');
    // console.log('执行完助力逻辑，删除scene缓存');
  },

  /**
   * 根据userId获取用户奖券
   */
  getRaffleTicketListByUserId: function () {
    var that = this;
    var userId = wx.getStorageSync('userId');
    console.log(userId);
    //请求服务器，获取该用户实时的RaffleTicketList并放入缓存
    wx.request({
      url: 'https://www.qianzhuli.top/just/getraffleticketlistbyuserid?userId=' + userId,
      success: function (res) {
        console.log('请求服务器获取用户RaffleTicketList成功 res=');
        console.log(res);
        var raffleTicketList = res.data.raffle_ticket_list;
        //放入本地缓存
        //wx.setStorageSync(key, orderList);
        //放入页面data
        if (raffleTicketList != false && raffleTicketList != undefined) {
          that.setData({
            raffleTicketList: raffleTicketList,
            hasRaffleTicket: true
          })
        } else {
          that.setData({
            hasRaffleTicket: false
          })
        }
      },
      fail: function (res) {
        console.log('请求服务器获取用户orderlist失败');
        console.log(res);
      }
    })
  },

  /**
   * 检查是否有userId，活动兼容历史用户
   */
  checkHasUserId: function (){
    var that = this;
    if(wx.getStorageSync('userId')){
      that.setData({
        hasUserId: true,
      });
    }else{
      //从缓存中清除用户信息，兼容历史用户无userId的问题
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('utoken');
      wx.removeStorageSync('userId');
      return false;
    }
    return true;
  },

  /**
   * 活动页增加待办时调用,调用完给予用户奖励（服务端限制一次）
   */
  addTodo: function () {
    var that = this;
    var value = that.data.inputValue;
    // console.log(value);
    if (!value) {
      wx.showToast({
        title: 'Flag为空哦！',
        icon: 'none'
      });
    } else {
      var data = that.loadData();
      var todo = { "title": value, "done": false, "top": false };
      data.push(todo);
      that.saveData(data);

      //调服务端奖励抽奖券（服务端限制一次）
      that.shareOk();
    }
  },

  /**
   * loadData 获取缓存中的所有事项
   */
  loadData: function () {
    var collection = wx.getStorageSync('todo');
    if (!collection) {
      return [];
    } else {
      return JSON.parse(collection);
    }
  },

  /**
   * saveData
   */
  saveData: function (data) {
    wx.setStorageSync("todo", JSON.stringify(data));
  },

  /**
   * 开奖页
   */
  newYearResult: function (e){
    wx.navigateTo({
      url: '/pages/activity/newYearResult/newYearResult?ticketCode=' + e.currentTarget.dataset.ticketcode,
    })
  }
})
