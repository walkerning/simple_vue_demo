// pages/list.js
var api = require("../../common/api")

const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    gotInfo: false,
    fetching: true,
    userInfo: {},
    userObj: {},
    tasks: []
  },

  refreshList: function() {
    this.setData({ fetching: true })
    api.apiGetUserTasks(this.data.userObj.id).then((lst) => {
      this.setData({
        tasks: lst,
        fetching: false
      })
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    app.waitLogin().then((ures) => {
      var [uInfo, uObj] = ures
      this.setData({
        userInfo: uInfo,
        userObj: uObj
      })
      this.refreshList()
      this.setData({ gotInfo: true })
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.refreshList()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  bindOpenTask: function (e) {
    var task_id = e.currentTarget.id
    // var query = serialize(this.data.tasks[task_id])
    app.now_task = this.data.tasks[task_id]
    wx.navigateTo({
      url: "../task/task"
    })
  },

  bindCreateTask: function(e) {
    api.apiCreateUserTask(this.data.userObj.id)
      .then((t) => {
        this.data.tasks.push(t)
        this.setData({ tasks: this.data.tasks })
      })
  }
})
