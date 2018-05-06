// pages/list.js
var api = require("../../common/api")
var utils = require("../../common/utils")
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    gotInfo: false,
    fetching: false,
    loginging: false,
    userInfo: {},
    userObj: {},
    tasks: []
  },

  refreshList: function() {
    this.setData({ fetching: true })
    return api.apiGetUserTasks(this.data.userObj.id).then((lst) => {
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
    this.setData({ logining: true })
    this.glUserInfo().then(() => {
      this.setData({ logining: false })
      this.refreshList().then(() => { this.setData({ gotInfo: true }) })
    })
      .catch((err) => {
        this.setData({ logining: false })
        utils.error(err)
      })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    //this.glUserInfo().then(() => {
    this.refreshList()
      .then(() => {
        wx.stopPullDownRefresh()
      })
    //})
  },

  onHide: function () {
    this.hide = true
  },

  onShow: function () {
    if (this.hide) {
      this.glUserInfo()
    }
      //this.refreshList().then(() => { this.setData({ gotInfo: true }) })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  glUserInfo: function() {
    return app.waitLogin().then((ures) => {
      var [uInfo, uObj] = ures
      this.setData({
        userInfo: uInfo,
        userObj: uObj
      })
    })
  },

  bindOpenTask: function (e) {
    var task_index = e.currentTarget.id
    // var query = serialize(this.data.tasks[task_id])
    // app.now_task = this.data.tasks[task_id]
    var user_id = this.data.tasks[task_index].user_id
    var task_id = this.data.tasks[task_index].id
    wx.navigateTo({
      url: `../task/task?user_id=${user_id}&id=${task_id}`
    })
  },

  bindCreateTask: function(e) {
    api.apiCreateUserTask(this.data.userObj.id)
      .then((t) => {
        this.data.tasks.push(t)
        this.setData({ tasks: this.data.tasks })
        // open the newly created task directly
        wx.navigateTo({ url: `../task/task?user_id=${t.user_id}&id=${t.id}` })
      })
  }
})
