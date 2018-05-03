//app.js
var api = require("./common/api")

App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync("logs") || []
    logs.unshift(Date.now())
    wx.setStorageSync("logs", logs)

    // // 登录
    // wx.login({
    //   success: res => {
    //     // 发送 res.code 到后台换取 openId, sessionKey, unionId
    //     console.log("wx on login");
    //   }
    // })
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
    })
    // wafer.request({
    //   login: true,
    //   url: `http://${consts.HOST}/api/v1/users/me`,
    //   success: function(res) {
    //     console.log(res);
    //     console.log("send request")
    //     // wafer.request({
    //     //   login: true,
    //     //   url: `http://${consts.HOST}/api/v1/users/${res.data.id}/tasks`,
    //     //   method: "POST",
    //     //   data: {
    //     //     meta_tag: "v0.1"
    //     //   },
    //     //   success: function(res2) {
    //     //     console.log("create res:", res2);
    //     //   }
    //     // });
    //     // wafer.request({
    //     //   login: true,
    //     //   url: `http://${consts.HOST}/api/v1/users/${res.data.id}/tasks/1`,
    //     //   method: "PUT",
    //     //   data: {
    //     //     "shoe_model": "hey",
    //     //     "state": "complete"
    //     //   },
    //     //   success: function (res2) {
    //     //     console.log("create res:", res2);
    //     //   }
    //     // })
    //   // },
    //     // wafer.uploadFile({
    //     //   login: true,
    //     //   url: `http://${consts.HOST}/api/v1/users/${res.data.id}/tasks/1/files`,
    //     //   method: "POST",
    //     //   filePath: "/images/index/mask3.png",
    //     //   name: "file",
    //     //   formData: {
    //     //     type: "appear"
    //     //   },
    //     //   success: function (res2) {
    //     //     console.log("create res:", res2);
    //     //   }
    //     // })

    //             // wafer.request({
    //     //   login: true,
    //     //   url: `http://${consts.HOST}/api/v1/users/${res.data.id}/tasks/1`,
    //     //   method: "PUT",
    //     //   data: {
    //     //     "shoe_model": "hey",
    //     //     "state": "complete"
    //     //   },
    //     //   success: function (res2) {
    //     //     console.log("create res:", res2);
    //     //   }
    //     // })
    //     // wafer.request({
    //     //   login: true,
    //     //   url: `http://${consts.HOST}/api/v1/users/${res.data.id}/tasks/1/run`,
    //     //   method: "PUT",
    //     //   success: function (res2) {
    //     //     console.log("create res:", res2);
    //     //   }
    //     // })
    //     //         wafer.request({
    //     //   login: true,
    //     //   url: `http://${consts.HOST}/api/v1/users/${res.data.id}/tasks`,
    //     //   method: "GET",
    //     //   success: function (res2) {
    //     //     console.log("create res:", res2);
    //     //   }
    //     // })
      
    //   },
    //   fail: function(err) {
    //     console.log(err)
    //   }
    // })
  },
  globalData: {
    userInfo: null,
    userObj: null
  }
})
