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
  },

  onLoad: function () {
    var that = this;
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

    //检查是否有userId，没有userId的话，清除登录相关信息，前端页面重新登录
    this.checkHasUserId();

    //获取用户已有奖券
    this.getRaffleTicketListByUserId();
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
    // todo 先下载头像到本地
    // wx.getImageInfo({
    //   src: that.data.userInfo.avatarUrl,
    //   success: function (res) {
    //     that.setData({
    //       avatarUrl: res.path
    //     });
    //   }
    // });

    //延时，等待图片下载
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
    var path = "/images/newYearPoster.png";
    //绘制背景
    context.drawImage(path, 0, 0, 900, 1043);
    //绘制日期-天
    // var date = new Date();
    // var word = date.getDate();
    // if (word >= 10) {
    //   context.setFontSize(68);
    //   context.setFillStyle('#fff');
    //   //绘制两遍，加粗
    //   context.fillText(word, 42, 143);
    //   context.fillText(word, 41, 144);
    // } else {
    //   //一位数的天数，补0
    //   context.setFontSize(68);
    //   context.setFillStyle('#fff');
    //   //绘制两遍，加粗
    //   context.fillText(0, 42, 143);
    //   context.fillText(0, 41, 144);
    //   context.fillText(word, 85, 143);
    //   context.fillText(word, 84, 144);
    // }
    // //绘制日期-月
    // var word = date.toDateString().split(" ")[1];
    // context.setFontSize(48);
    // context.setFillStyle('#fff');
    // context.fillText(word, 142, 144);


    // //绘制名人名言，随机数决定展示啥
    // var wordOne = "";
    // var wordTwo = "";
    // var wordThree = "";
    // var randNumber = parseInt(Math.random() * 19, 10) + 1;
    // switch (randNumber) {
    //   case 1:
    //     wordOne = '世界上最快乐的事，';
    //     wordTwo = '莫过于为理想而奋斗。';
    //     break;
    //   case 2:
    //     wordOne = '希望你也能成为，';
    //     wordTwo = '你望着的那颗星。';
    //     break;
    //   case 3:
    //     wordOne = '做想做的事，见想见的人，';
    //     wordTwo = '不要考虑结果如何，奔跑便是了。';
    //     break;
    //   case 4:
    //     wordOne = '梦想是一场华美的旅途，';
    //     wordTwo = '每个人在找到它之前，都只是孤独的少年。';
    //     break;
    //   case 5:
    //     wordOne = '昨天的你确实很了不起，';
    //     wordTwo = '今天的你做了什么呢？';
    //     break;
    //   case 6:
    //     wordOne = '生活在阴沟里，';
    //     wordTwo = '依然有仰望星空的权利。';
    //     wordThree = '——王尔德'
    //     break;
    //   case 7:
    //     wordOne = '生活最佳状态是冷冷清清地风风火火。';
    //     wordTwo = '——木心';
    //     break;
    //   case 8:
    //     wordOne = '所有你乐于挥霍的时间都不能算作浪费。';
    //     wordTwo = '——约翰·列侬';
    //     break;
    //   case 9:
    //     wordOne = '每一个不曾起舞的日子，';
    //     wordTwo = '都是对生命的辜负。'
    //     wordThree = '——尼采';
    //     break;
    //   case 10:
    //     wordOne = '你千万不要见怪，';
    //     wordTwo = '城市是一个几百万人一起孤独生活的地方。'
    //     wordThree = '——梭罗';
    //     break;
    //   case 11:
    //     wordOne = '我用尽了全力，过着平凡的一生。';
    //     wordTwo = '——《月亮与六便士》'
    //     break;
    //   case 12:
    //     wordOne = '剑未佩妥，出门已是江湖。';
    //     wordTwo = '——痞子蔡'
    //     break;
    //   case 13:
    //     wordOne = '我见青山多妩媚，料青山见我应如是。';
    //     wordTwo = '——辛弃疾《贺新郎》'
    //     break;
    //   case 14:
    //     wordOne = '我当然不会试图摘月，我要月亮奔我而来。';
    //     wordTwo = '——奥黛丽·赫本'
    //     break;
    //   case 15:
    //     wordOne = '笨蛋才思考，聪明人用灵感，';
    //     wordTwo = '我们大多时间都是笨蛋，偶尔才成为聪明人。'
    //     wordThree = '——斯坦利·库布里克';
    //     break;
    //   case 16:
    //     wordOne = '人们在讨论“有朝一日”的时候，';
    //     wordTwo = '其真正意思就是“永不”。'
    //     wordThree = '——迈克尔·克莱顿《西部世界》';
    //     break;
    //   case 17:
    //     wordOne = '三月桃花，两人一马，明日天涯。';
    //     wordTwo = '——七堇年'
    //     break;
    //   case 18:
    //     wordOne = '我知道在这个世界上我无处容身，';
    //     wordTwo = '只是，你凭什么审判我的灵魂?';
    //     wordThree = '——加缪《局外人》';
    //     break;
    //   case 19:
    //     wordOne = '记住一个道理，只有自己变优秀了，';
    //     wordTwo = '其他事情才会跟着好起来';
    //     break;
    // }
    // //绘制名言，第一行和第二行
    // context.setFontSize(34);
    // context.setFillStyle('#fff');
    // context.fillText(wordOne, 42, 224);
    // context.fillText(wordTwo, 42, 290);
    // if (wordThree != "") {
    //   context.fillText(wordThree, 42, 356);
    // }


    // //绘制今日完成前缀
    // //todo lisihao 获取新年愿望
    // var word = that.data.inputValue;
    // context.setFontSize(35);
    // context.setFillStyle('#fff');
    // context.fillText(word, 140, 1115);

    //绘制今日完成数
    //获取完成事项数目
    //判断位数是1位还是2位
    //根据位数绘制完成数和后缀
    // var word = that.data.doneCount;
    // context.setFontSize(59);
    // context.setFillStyle('#fff');
    // context.fillText(word, 303, 1115);
    // context.fillText(word, 302, 1115);
    // if (word < 10) {
    //   var word = '个小目标';
    //   context.setFontSize(35);
    //   context.setFillStyle('#fff');
    //   context.fillText(word, 358, 1115);
    // } else {
    //   //绘制今日完成后缀
    //   var word = '个小目标';
    //   context.setFontSize(35);
    //   context.setFillStyle('#fff');
    //   context.fillText(word, 388, 1115);
    // }

    //绘制底部广告语
    // var word = '即刻开启自己的Just清单，扫码get';
    // context.setFontSize(30);
    // context.setFillStyle('#08ac57');
    // context.fillText(word, 42, 1182);

    //绘制头像
    // var path1 = that.data.avatarUrl;
    // context.drawImage(path1, 42, 1060, 75, 75); // 在刚刚裁剪的园上画图

    // 最终绘制
    context.draw();
    //将生成好的图片保存到本地，需要延迟一会，绘制期间耗时
    setTimeout(function () {
      wx.canvasToTempFilePath({
        canvasId: 'mycanvas',
        destWidth: 900,
        destHeight: 1043,
        fileType: 'jpg',
        quality: 1,
        success: function (res) {
          var tempFilePath = res.tempFilePath;
          //获取屏幕可用高度，计算海报距离屏幕顶部距离
          //todo lisihao 不同宽高比下，适配问题
          var systemInfo = wx.getSystemInfoSync();
          var canvasWidth = systemInfo.windowWidth * 0.8;
          // var canvasHeight = canvasWidth / (375 / 614);
          var canvasHeight = canvasWidth / (900 / 1043);
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
    var bool = false;
    if(wx.getStorageSync('userId')){
      bool = true;
    }else{
      //从缓存中清除用户信息，兼容历史用户无userId的问题
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('utoken');
      wx.removeStorageSync('userId');
    }
    that.setData({
      hasUserId: bool,
    });
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
})
