//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    adding: '',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    list: [
      {
        id: 'daiban',
        name: '待办',
        open: false,
        pages: [
          {
            name: '使用指南',
            src: '/images/wenhao.png',
            bindtap: 'goToGuide'
          },
          {
            name: '清除全部',
            src: '/images/delAll.png',
            bindtap: 'openConfirm'
          },
          // 暂时下掉
          // {
          //   name: '生成海报',
          //   src: '/images/pengyouquan.png',
          //   bindtap: 'createPoster'
          // },
          {
            name: '意见反馈',
            src: '/images/suggest.png',
            bindtap: 'goToSuggest'
          },
          {
            name: '退出登录',
            src: '/images/logout.png',
            bindtap: 'logout'
          },
          {
            name: '新年活动',
            src: '/images/hongbao.png',
            bindtap: 'welcomeImg'
          }
        ]
      }
    ],
    // 海报
    maskHidden: false,
    imagePath: '',
    avatarUrl: '',
    //事项详情弹窗
    itemDetailBoxHidden:false,
    //事项详情的默认值
    currentItemId: null,
    currentTitle: null,
    currentDone: null,
    currentTop: null,
  },

  onLoad: function () {
    var that = this;

    //当前页面展示分享
    wx.showShareMenu({
      withShareTicket: true
    })

    if(wx.getStorageSync('userInfo')){
      that.setData({
        userInfo: wx.getStorageSync('userInfo'),
        hasUserInfo: true
      })
    } else if (that.data.canIUse){
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

    //页面初始化
    that.pageInit();
    //事项数据初始化
    that.load();
  },

  /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
  onPullDownRefresh: function () {
    this.onLoad();
    wx.stopPullDownRefresh();
  },

  getUserInfo: function(e) {
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
   * 页面初始化
   */
  pageInit: function() {
    var that = this;
    //获取页面可用高度
    var usefulWindowHeight = wx.getSystemInfoSync().windowHeight;
    //获取下方操作框高度
    that.createSelectorQuery().select('#operate-bar').boundingClientRect(function (rect) {
      that.setData({
        usefulWindowHeight: usefulWindowHeight - rect.height
      });
    }).exec();

    //获取累计使用次数
    wx.request({
      url: 'https://www.qianzhuli.top/just/getusenumber',
      success: function (res) {
        if (res.data.use_number) {
          //存入全局变量
          app.globalData.useNumber = res.data.use_number;
        }
      }
    })

    //缓存获取是否展示已完成事项，保持用户体验一致性
    var isShowDoneList = wx.getStorageSync('isShowDoneList');
    //缓存中无用户隐藏习惯的数据时，默认展示
    if(isShowDoneList == '' || isShowDoneList == null || isShowDoneList == undefined){
      isShowDoneList = true;
    }
    that.setData({
      isShowDoneList: isShowDoneList
    });
  },

  /**
   * load()
   * 初始化页面数据
   */
  load: function () {
    var that = this;
    var collection = wx.getStorageSync('todo');
    if (collection.length > 2) {
      var data = JSON.parse(collection);
      console.log(data);
      var todoCount = 0;
      var doneCount = 0;
      var todoList = [];
      var doneList = [];
      for (var i = data.length - 1; i >= 0; i--) {
        data[i].id = i;
        if (data[i].done) {
          doneList.push(data[i]);
          doneCount++;
        } else {
          todoList.push(data[i]);
          todoCount++;
        }
      };
      if(doneCount == 0){
        var hasDoneItem = false;
      } else {
        var hasDoneItem = true;
      }
      that.setData({
        todoCount: todoCount,
        todoList: todoList,
        doneCount: doneCount,
        doneList: doneList,
        "list[0].open": false,
        hasItem: true,
        hasDoneItem: hasDoneItem
      });
    } else {
      that.setData({
        todoCount: 0,
        todoList: {},
        doneCount: 0,
        doneList: {},
        "list[0].open": false,
        hasItem: false,
        hasDoneItem: hasDoneItem
      });
    }
  },

  /**
   * 列表伸缩
   */
  kindToggle: function (e) {
    console.log(e);
    var id = e.currentTarget.id, list = this.data.list;
    for (var i = 0, len = list.length; i < len; ++i) {
      if (list[i].id == id) {
        list[i].open = !list[i].open
      } else {
        list[i].open = false
      }
    }
    this.setData({
      list: list
    });
  },

  /**
   * addTodo 添加待办事项
   */
  addTodo: function(e) {
    var that = this;
    var value = e.detail.value;
    // console.log(value);
    if( ! value){
      that.setData({
        errorMsg: '内容不能为空'
      });
    } else {
      var data = that.loadData();
      var todo = {"title": value, "done": false, "top": false};
      data.push(todo);
      that.saveData(data);
      // 回车后重置输入框
      that.setData({
        adding: '',
        errorMsg: ''
      });
      that.load();
    }
  },

  /**
   * addTodoSubmit 通过提交键增加待办
   */
  addTodoSubmit: function(e){
    var that = this;
    var value = e.detail.value.addTodoInput;
    if (!value) {
      that.setData({
        errorMsg: '内容不能为空'
      });
    } else {
      var data = that.loadData();
      var todo = { "title": value, "done": false, "top": false};
      data.push(todo);
      that.saveData(data);
      // 回车后重置输入框
      that.setData({
        adding: '',
        errorMsg: ''
      });
      that.load();
    }
  },

  /**
   * loadData 获取缓存中的所有事项
   */
  loadData: function(){
    var collection = wx.getStorageSync('todo');
    if( ! collection){
      return [];
    } else {
      return JSON.parse(collection);
    }
  },

  /**
   * saveData
   */
  saveData: function(data){
    wx.setStorageSync("todo", JSON.stringify(data));
  },

  /**
   * topItem 置顶待办事项
   */
  topItem: function (event) {
    var that = this;
    var id = event.currentTarget.dataset.id;
    var collection = wx.getStorageSync('todo');
    // console.log(collection);
    if (collection.length > 2) {
      var data = JSON.parse(collection);
      // console.log(data);
      data[id].top = true;
      that.saveData(data);
      that.load();
    }
  },

  /**
   * downItem 取消置顶待办事项
   */
  downItem: function (event) {
    var that = this;
    var id = event.currentTarget.dataset.id;
    var collection = wx.getStorageSync('todo');
    // console.log(collection);
    if (collection.length > 2) {
      var data = JSON.parse(collection);
      // console.log(data);
      data[id].top = false;
      that.saveData(data);
      that.load();
    }
  },

  /**
   * deleteItem 删除待办事项
   */
  deleteItem: function(event){
    var that = this;
    var id = event.currentTarget.dataset.id;
    var data = that.loadData();
    data.splice(id, 1);
    that.saveData(data);
    that.load();
  },

  

  //todo lisihao bug: 修改事项时点击勾选完成，会异常展示
  /**
   * doToDone 完成item
   */
  doToDone: function(event){
    var that = this;
    var id = event.currentTarget.dataset.id;
    var data = that.loadData();
    var todo = data.splice(id, 1)[0];
    todo.done = true;
    // 完成时取消置顶
    // todo.top = false;
    data.splice(id, 0, todo);
    that.saveData(data);
    that.load();
  },

  /**
   * doneToDo 取消完成item
   */
  doneToDo: function(event){
    var that = this;
    var id = event.currentTarget.dataset.id;
    var data = that.loadData();
    var todo = data.splice(id, 1)[0];
    todo.done = false;
    data.splice(id, 0, todo);
    that.saveData(data);
    that.load();
  },
  

  /**
   * 隐藏已完成事项
   */
  hideDoneList: function(){
    //写入缓存，提升用户体验一致性
    wx.setStorageSync('isShowDoneList', false);
    console.log('隐藏已完成事项写入缓存');
    console.log(wx.getStorageSync('isShowDoneList'));
    this.setData({
      isShowDoneList: false
    });
  },

  /**
   * 显示已完成事项
   */
  showDoneList: function () {
    //写入缓存，提升用户体验一致性
    wx.setStorageSync('isShowDoneList', true);
    console.log('显示已完成事项写入缓存');
    console.log(wx.getStorageSync('isShowDoneList'));
    this.setData({
      isShowDoneList: true
    });
  },

  /**
   * openConfirm 清除前确认
   */
  openConfirm: function () {
    var that = this;
    wx.showModal({
      title: '删除所有事项？',
      content: '请确认所有事项无需保留后删除',
      confirmText: "给我删！",
      cancelText: "回去工作",
      success: function (res) {
        console.log(res);
        if (res.confirm) {
          that.clearAllTodoList();
        } else {
          //console.log('用户点击辅助操作')
        }
      }
    });
  },

  /**
   * clearAllTodoList 清除所有缓存
   */
  clearAllTodoList: function(){
    //
    wx.removeStorageSync('todo');
    this.load();
  },

  /**
   * goToGuide
   */
  goToGuide: function () {
    wx.navigateTo({
      url: '/pages/guide/guide',
    })
  },

  /**
   * goToSuggest
   */
  goToSuggest: function () {
    wx.navigateTo({
      url: '/pages/suggest/suggest',
    })
  },

  /**
   * 触发生成海报
   */
  // createPoster: function (){
  //   var that = this;
  //   that.setData({
  //     maskHidden: false
  //   });
  //   wx.showToast({
  //     title: '海报生成中...',
  //     icon: 'loading',
  //     duration: 1000
  //   });
  //   // todo 先下载头像到本地
  //   wx.getImageInfo({
  //     src: that.data.userInfo.avatarUrl,
  //     success: function (res){
  //       that.setData({
  //         avatarUrl: res.path
  //       });
  //     }
  //   });
  //   setTimeout(function () {
  //     that.doCreateNewPoster();
  //     wx.hideToast()
  //     that.setData({
  //       maskHidden: true
  //     });
  //   }, 1000);
  // },

  /**
   * 执行生成海报
   */
  // doCreateNewPoster: function () {
  //   var that = this;
  //   var context = wx.createCanvasContext('mycanvas');   
  //   var path = "/images/poster/posterOne.png";
  //   var randNumber = parseInt(Math.random() * 5, 10) + 1;
  //   switch (randNumber){
  //     case 1:
  //       path = "/images/poster/posterOne.png";
  //       break;
  //     case 2:
  //       path = "/images/poster/posterTwo.png";
  //       break;
  //     case 3:
  //       path = "/images/poster/posterThree.png";
  //       break;
  //     case 4:
  //       path = "/images/poster/posterFour.png";
  //       break;
  //     case 5:
  //       path = "/images/poster/posterFive.png";
  //       break;
  //   }
  //   //绘制背景
  //   context.drawImage(path, 0, 0, 750, 1228);
  //   //绘制日期-天
  //   var date = new Date();
  //   var word = date.getDate();
  //   if(word >= 10){
  //     context.setFontSize(68);
  //     context.setFillStyle('#fff');
  //     //绘制两遍，加粗
  //     context.fillText(word, 42, 143);
  //     context.fillText(word, 41, 144);
  //   } else {
  //     //一位数的天数，补0
  //     context.setFontSize(68);
  //     context.setFillStyle('#fff');
  //     //绘制两遍，加粗
  //     context.fillText(0, 42, 143);
  //     context.fillText(0, 41, 144);
  //     context.fillText(word, 85, 143);
  //     context.fillText(word, 84, 144);
  //   }
  //   //绘制日期-月
  //   var word = date.toDateString().split(" ")[1];
  //   context.setFontSize(48);
  //   context.setFillStyle('#fff');
  //   context.fillText(word, 142, 144);
    
    
  //   //绘制名人名言，随机数决定展示啥
  //   var wordOne = "";
  //   var wordTwo = "";
  //   var wordThree = "";
  //   var randNumber = parseInt(Math.random() * 19, 10) + 1;
  //   switch (randNumber) {
  //     case 1:
  //       wordOne = '世界上最快乐的事，';
  //       wordTwo = '莫过于为理想而奋斗。';
  //       break;
  //     case 2:
  //       wordOne = '希望你也能成为，';
  //       wordTwo = '你望着的那颗星。';
  //       break;
  //     case 3:
  //       wordOne = '做想做的事，见想见的人，';
  //       wordTwo = '不要考虑结果如何，奔跑便是了。';
  //       break;
  //     case 4:
  //       wordOne = '梦想是一场华美的旅途，';
  //       wordTwo = '每个人在找到它之前，都只是孤独的少年。';
  //       break;
  //     case 5:
  //       wordOne = '昨天的你确实很了不起，';
  //       wordTwo = '今天的你做了什么呢？';
  //       break;
  //     case 6:
  //       wordOne = '生活在阴沟里，';
  //       wordTwo = '依然有仰望星空的权利。';
  //       wordThree = '——王尔德'
  //       break;
  //     case 7:
  //       wordOne = '生活最佳状态是冷冷清清地风风火火。';
  //       wordTwo = '——木心';
  //       break;
  //     case 8:
  //       wordOne = '所有你乐于挥霍的时间都不能算作浪费。';
  //       wordTwo = '——约翰·列侬';
  //       break;
  //     case 9:
  //       wordOne = '每一个不曾起舞的日子，';
  //       wordTwo = '都是对生命的辜负。'
  //       wordThree = '——尼采';
  //       break;
  //     case 10:
  //       wordOne = '你千万不要见怪，';
  //       wordTwo = '城市是一个几百万人一起孤独生活的地方。'
  //       wordThree = '——梭罗';
  //       break;
  //     case 11:
  //       wordOne = '我用尽了全力，过着平凡的一生。';
  //       wordTwo = '——《月亮与六便士》'
  //       break;
  //     case 12:
  //       wordOne = '剑未佩妥，出门已是江湖。';
  //       wordTwo = '——痞子蔡'
  //       break;
  //     case 13:
  //       wordOne = '我见青山多妩媚，料青山见我应如是。';
  //       wordTwo = '——辛弃疾《贺新郎》'
  //       break;
  //     case 14:
  //       wordOne = '我当然不会试图摘月，我要月亮奔我而来。';
  //       wordTwo = '——奥黛丽·赫本'
  //       break;
  //     case 15:
  //       wordOne = '笨蛋才思考，聪明人用灵感，';
  //       wordTwo = '我们大多时间都是笨蛋，偶尔才成为聪明人。'
  //       wordThree = '——斯坦利·库布里克';
  //       break;
  //     case 16:
  //       wordOne = '人们在讨论“有朝一日”的时候，';
  //       wordTwo = '其真正意思就是“永不”。'
  //       wordThree = '——迈克尔·克莱顿《西部世界》';
  //       break;
  //     case 17:
  //       wordOne = '三月桃花，两人一马，明日天涯。';
  //       wordTwo = '——七堇年'
  //       break;
  //     case 18:
  //       wordOne = '我知道在这个世界上我无处容身，';
  //       wordTwo = '只是，你凭什么审判我的灵魂?';
  //       wordThree = '——加缪《局外人》';
  //       break;
  //     case 19:
  //       wordOne = '记住一个道理，只有自己变优秀了，';
  //       wordTwo = '其他事情才会跟着好起来';
  //       break;
  //   }
  //   //绘制名言，第一行和第二行
  //   context.setFontSize(34);
  //   context.setFillStyle('#fff');
  //   context.fillText(wordOne, 42, 224);
  //   context.fillText(wordTwo, 42, 290);
  //   if (wordThree != ""){
  //     context.fillText(wordThree, 42, 356);
  //   }
    
    
  //   //绘制今日完成前缀
  //   var word = '今日完成';
  //   context.setFontSize(35);
  //   context.setFillStyle('#fff');
  //   context.fillText(word, 140, 1115);
  //   //绘制今日完成数
  //   //获取完成事项数目
  //   //判断位数是1位还是2位
  //   //根据位数绘制完成数和后缀
  //   var word = that.data.doneCount;
  //   context.setFontSize(59);
  //   context.setFillStyle('#fff');
  //   context.fillText(word, 303, 1115);
  //   context.fillText(word, 302, 1115);
  //   if (word < 10) {
  //     var word = '个小目标';
  //     context.setFontSize(35);
  //     context.setFillStyle('#fff');
  //     context.fillText(word, 358, 1115);
  //   } else {
  //     //绘制今日完成后缀
  //     var word = '个小目标';
  //     context.setFontSize(35);
  //     context.setFillStyle('#fff');
  //     context.fillText(word, 388, 1115);
  //   }
  //   //绘制底部广告语
  //   var word = '即刻开启自己的Just清单，扫码get';
  //   context.setFontSize(30);
  //   context.setFillStyle('#08ac57');
  //   context.fillText(word, 42, 1182);

  //   //绘制头像
  //   var path1 = that.data.avatarUrl;
  //   // console.log('path1');
  //   // console.log(path1);
  //   // context.arc(186, 246, 50, 0, 2 * Math.PI) //画出圆
  //   // context.strokeStyle = "#ffe200";
  //   // context.clip(); //裁剪上面的圆形
  //   context.drawImage(path1, 42, 1060, 75, 75); // 在刚刚裁剪的园上画图

  //   // 最终绘制
  //   context.draw();
  //   //将生成好的图片保存到本地，需要延迟一会，绘制期间耗时
  //   setTimeout(function () {
  //     wx.canvasToTempFilePath({
  //       canvasId: 'mycanvas',
  //       destWidth: 750,
  //       destHeight: 1228,
  //       fileType: 'jpg',
  //       quality: 1,
  //       success: function (res) {
  //         var tempFilePath = res.tempFilePath;
  //         //获取屏幕可用高度，计算海报距离屏幕顶部距离
  //         //todo lisihao 不同宽高比下，适配问题
  //         var systemInfo = wx.getSystemInfoSync();
  //         var canvasWidth = systemInfo.windowWidth * 0.8;
  //         var canvasHeight = canvasWidth / (375 / 614);
  //         console.log('宽：' + canvasWidth + ' 高：' + canvasHeight);

  //         that.setData({
  //           imagePath: tempFilePath,
  //           canvasWidth: canvasWidth,
  //           canvasHeight: canvasHeight
  //           // canvasHidden: true
  //         });
  //       },
  //       fail: function (res) {
  //         console.log(res);
  //       }
  //     });
  //   }, 200);
  // },

  // /**
  //  * 用户点击保存到本地
  //  */
  // saveToAlbum: function () {
  //   var that = this
  //   wx.saveImageToPhotosAlbum({
  //     filePath: that.data.imagePath,
  //     success(res) {
  //       that.setData({
  //         maskHidden: false
  //       })
  //       wx.showToast({
  //         title: '分享到朋友圈吧',
  //       })
  //       // wx.showModal({
  //       //   content: '保存成功，分享到朋友圈吧',
  //       //   showCancel: false,
  //       //   confirmText: '好的',
  //       //   confirmColor: '#333',
  //       //   success: function (res) {
  //       //     if (res.confirm) {
  //       //       console.log('用户点击确定');
  //       //       /* 该隐藏的隐藏 */
  //       //       that.setData({
  //       //         maskHidden: false
  //       //       })
  //       //       // 给用户奖励积分
  //       //       // that.shareOk();
  //       //     }
  //       //   }, fail: function (res) {
  //       //     console.log("用户点击确定失败");
  //       //   }
  //       // })
  //     }
  //   })
  // },

  // /**
  //  * 生成海报后返回首页
  //  */
  // goBackToList: function () {
  //   //实质是隐藏
  //   this.setData({
  //     maskHidden:false
  //   });
  // },
  
  /**
   * 查看事项详情后返回首页
   */
  goBackToListFromDetail: function () {
    //实质是隐藏
    this.setData({
      itemDetailBoxHidden: false
    });
  },

  /**
   * 换一张海报
   */
  // createPosterAgain: function (){
  //   //省略弹窗&获取头像等步骤，直接重新绘制
  //   this.doCreateNewPoster();
  // },

  /**
   * logout
   */
  logout: function (){
    var that = this;
    wx.showModal({
      title: '退出登录',
      content: '小主，退出后没办法用这些功能啦',
      confirmText: "给我退！",
      cancelText: "继续用",
      success(res) {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('utoken');
          wx.removeStorageSync('userId');
          that.setData({
            hasUserInfo: false,
            userInfo: {},
            "list[0].open": false,
          });
        } else if (res.cancel) {
          return;
        }
      }
    })
  },

  itemDetail: function (event){
    var that = this;
    var itemId = event.currentTarget.dataset.id;
    var collection = wx.getStorageSync('todo');
    if (collection.length > 2) {
      var data = JSON.parse(collection);
      // 初始化页面数据
      console.log(data[itemId].title);
      console.log(data[itemId].done);
      console.log(data[itemId].top);
      that.setData({
        currentItemId: itemId,
        currentTitle: data[itemId].title,
        currentDone: data[itemId].done,
        currentTop: data[itemId].top,
        itemDetailBoxHidden: true
      });
    } else {
      //异常处理
    }
    
    //取这个id的相关数据，展示在浮窗上，可供修改
    // wx.navigateTo({
    //   url: '/pages/itemDetail/itemDetail?itemId=' + itemId,
    // })
  },

  /**
   * 事项详情中的按钮
   */
  switchChangeTop: function (event) {
    var that = this;
    //获取反馈结果按钮是否打开
    var checkedValue = event.detail.value;
    console.log(checkedValue);
    that.setData({
      currentTop: checkedValue,
    });
  },

  /**
   * 点击完成，提交修改事项
   */
  changeItem: function () {
    //获取页面元素的值，校验，提交
    var that = this;
    var newTitle = that.data.currentTitle;
    var newTop = that.data.currentTop;
    var itemId = that.data.currentItemId;
    //先不做非空校验

    //保存事项
    that.doEditItem(newTitle, newTop, itemId);
    that.load();
    //隱藏彈窗
    that.setData({
      itemDetailBoxHidden: false
    });
  },

  /**
  * 执行修改事项
  */
  doEditItem: function (newTitle, newTop, itemId) {
    var that = this;
    var collection = wx.getStorageSync('todo');
    if (collection.length > 2) {
      var data = JSON.parse(collection);
      data[itemId].title = newTitle;
      data[itemId].top = newTop;
      wx.setStorageSync("todo", JSON.stringify(data));
    }
  },

  /**
   * 事项详情修改时触发
   */
  titleInput: function (event) {
    var that = this;
    var editValue = event.detail.value;
    // console.log(editValue);
    that.setData({
      currentTitle: editValue
    });
  },

  doNotMove: function () {
    return;
  },

  welcomeImg: function () {
    // wx.showToast({
    //   title: '小主别着急，1月22号后点我免费抽奖！',
    //   icon: 'none'
    // })
    wx.navigateTo({
      url: '/pages/activity/newYearActivity/newYearActivity',
      success: function(res) {},
      fail: function(res) {},
      complete: function(res) {},
    })
  }
})
