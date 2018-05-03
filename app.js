//app.js
var api = require("./common/api")
var utils = require("./common/utils")

App({
  onLaunch: function () {
    // 获取用户信息
    wx.getSetting({
      success: res => {
        console.log("on get setting success", res)
        if (res.authSetting["scope.userInfo"]) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
    api.apiGetUserMe().then((u) => {
      console.log("get user ", u);
      this.globalData.userObj = u;
      if (this.userObjReadyCallback) {
        this.userObjReadyCallback(u)
      }
    }).catch((err) => {
      utils.error(err)
    })
  },

  waitLogin: function() {
    var app = this
    return utils.timeout(new Promise((resolve, reject) => {
      if (app.globalData.userInfo) {
        resolve(app.globalData.userInfo)
      } else {
        app.userInfoReadyCallback = uInfo => {
          resolve(uInfo)
        }
      }
    }).then((uInfo) => {
      return new Promise((resolve, reject) => {
        if (app.globalData.userObj) {
          resolve(app.globalData.userObj)
        } else {
          app.userObjReadyCallback = uObj => {
            resolve(uObj)
          }
        }
      }).then((uObj) => {
        return [uInfo, uObj]
      })
    }), 10000, "登录超时")
  },

  globalData: {
    userInfo: null,
    userObj: null
  }
})
