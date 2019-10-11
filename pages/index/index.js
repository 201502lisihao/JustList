//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    adding: '',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    var that = this;
    if (app.globalData.userInfo) {
      that.setData({
        userInfo: app.globalData.userInfo,
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
          app.globalData.userInfo = res.userInfo
          that.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }

    //获取页面可用高度
    var usefulWindowHeight = wx.getSystemInfoSync().windowHeight;
    //获取下方操作框高度
    that.createSelectorQuery().select('#operate-bar').boundingClientRect(function (rect) {
      that.setData({
        usefulWindowHeight: usefulWindowHeight - rect.height
      });
    }).exec();

    //初始化
    that.load();
  },

  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },

  /**
   * add todo 添加待办事项
   */
  addTodo: function(e) {
    var that = this;
    var value = e.detail.value;
    console.log(value);
    if( ! value){
      that.setData({
        errorMsg: '内容不能为空'
      });
    } else {
      var data = this.loadData();
      var todo = {"title": value, "done": false};
      data.push(todo);
      this.saveData(data);
      // 回车后重置输入框
      that.setData({
        adding: '',
        errorMsg: ''
      });
      this.load();
    }
  },

  /**
   * loadData
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
   * load()
   */
  load: function(){
    var that = this;
    var collection = wx.getStorageSync('todo');
    console.log(collection.length);
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
      that.setData({
        todoCount: todoCount,
        todoList: todoList,
        doneCount: doneCount,
        doneList: doneList,
        hasItem: true
      });
    }else{
      console.log('11132');
      that.setData({
        todoCount: 0,
        todoList: {},
        doneCount: 0,
        doneList: {},
        hasItem: false
      });
    }
  },
  
  /**
   * 删除待办事项
   */
  deleteItem: function(event){
    var that = this;
    var id = event.currentTarget.dataset.id;
    var data = that.loadData();
    data.splice(id, 1);
    that.saveData(data);
    that.load();
  },

  /**
   * 完成item
   */
  doToDone: function(event){
    var that = this;
    var id = event.currentTarget.dataset.id;
    var data = that.loadData();
    var todo = data.splice(id, 1)[0];
    todo.done = true;
    data.splice(id, 0, todo);
    that.saveData(data);
    that.load();
  },

  /**
   * 取消完成item
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
   * 清除前确认
   */
  openConfirm: function () {
    var that = this;
    wx.showModal({
      title: '删除所有事项？',
      content: '请确认是否所有待办事项已无用',
      confirmText: "给我删！",
      cancelText: "回去工作",
      success: function (res) {
        console.log(res);
        if (res.confirm) {
          that.clearAll();
        } else {
          //console.log('用户点击辅助操作')
        }
      }
    });
  },

  /**
   * clearAll
   */
  clearAll: function(){
    wx.clearStorageSync();
    this.load();
  }
})
