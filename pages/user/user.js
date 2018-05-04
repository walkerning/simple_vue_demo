// user.js
var api = require("../../common/api")
const app = getApp()

Page({
  data: {
    userInfo: {},
    userObj: {}
  },

  onLoad: function () {
    app.waitLogin().then((ures) => {
      var [uInfo, uObj] = ures
      this.setData({
        userInfo: uInfo,
        userObj: uObj
      })
    })
  },

  refreshUserObj: function() {
    return api.apiGetUserMe()
      .then((uObj) => {
        app.globalData.userObj = uObj
        this.setData({ userObj: uObj })
      })
  },

  onPullDownRefresh: function () {
    this.refreshUserObj()
      .then(() => {
        wx.stopPullDownRefresh()
      })
  }
})
