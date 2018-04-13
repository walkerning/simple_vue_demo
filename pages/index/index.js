//index.js
//获取应用实例
const app = getApp()
const BASE_URL = ""
const API_BASE_URL = BASE_URL + "/api/v1"
const FAKE = 0
const NOT_SURE = 1
const TRUE = 2

function range(x) {
  var res = []
  for (let i = 0; i < x; i++) {
    res.push(i)
  }
  return res
}
Page({
  data: {
    // 用户信息
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),

    currentIndex: 0,
    picTypes: [{
      "type": "appear",
      "name": "球鞋外观",
      "mask_pic": "/images/index/mask1.png"
    }, {
      "type": "tag",
      "name": "球鞋鞋标",
      "mask_pic": "/images/index/mask2.png"
    }, {
      "type": "stitch",
      "name": "中底走线",
      "mask_pic": "/images/index/mask3.png"
    }, {
      "type": "pad",
      "name": "球鞋鞋垫",
      "mask_pic": "/images/index/mask4.png"
    }, {
      "type": "side_tag",
      "name": "鞋盒测标",
      "mask_pic": "/images/index/mask5.png"
    }, {
      "type": "seal",
      "name": "鞋盒钢印",
      "mask_pic": "/images/index/mask6.png"
    }],
    pics: {},
    actionSheetHidden: true,
    actionSheetItems: ["预览", "重拍"],
    previewShow: false,
    previewSrc: null,

    // shoe models
    shoeModels: ["Addidas 三叶草", "VANS CLASSIC", "AJ"],
    shoeModelIndex: 0,
    // Upload
    comment: "",
    canUpload: false,
    uploading: false,
    detecting: false,
    detected: false,
    uploadPercent: [],
    toastText: "",
    toastHidden: true,
    detectRes: ""
  },
  //事件处理函数
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        app.globalData.userInfo = res.userInfo
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
    this.len = this.data.picTypes.length
    this.ctx = wx.createCameraContext()
    this.setData({ maskSrc: this.data.picTypes[this.data.currentIndex]["mask_pic"],
                   uploadPercent: new Array(this.len).fill(0) })
  },

  changeCurrentIndex: function (e) {
    console.log(e);
    var newInd = e.target.id
    this.setData({ currentIndex: newInd })
    this.setData({ maskSrc: this.data.picTypes[this.data.currentIndex]["mask_pic"] })
    if (this.data.uploading || this.data.detecting || this.data.detected) {
      this.setData({ previewShow: true, previewSrc: this.data.pics[newInd] })
      return
    }
    if (this.data.pics[newInd]) {
      this.setData({ actionSheetHidden: false })
    } else {
      this.setData({ previewShow: false })
    }
  },

  bindActionChoose: function (e) {
    if (e.target.dataset.name == 0) {
      // 预览
      this.setData({ previewShow: true, previewSrc: this.data.pics[this.data.currentIndex] })
    } else {
      // 重拍
      this.setData({ previewShow: false })
      this.setData({ ["pics["+this.data.currentIndex+"]"]: null })
      this.setData({ canUpload: false })
    }
    this.setData({ actionSheetHidden: true })
  },

  bindPickerChange: function(e) {
    this.setData({ shoeModelIndex: e.detail.value })
  },

  bindCommentInput: function(e) {
    this.setData({ comment: e.detail.value })
  },

  bindToastChange: function(e) {
    this.setData( {toastHidden: true })
  },
  
  bindResetTap: function(e) {
    this.setData({
      currentIndex: 0,
      pics: {},
      actionSheetHidden: true,
      previewShow: false,
      previewSrc: null,
      shoeModelIndex: 0,
      comment: "",
      canUpload: false,
      uploading: false,
      detecting: false,
      detected: false,
      uploadPercent: new Array(this.len).fill(0),
      toastText: "",
      toastHidden: true,
      detectRes: ""
    })
  },

  bindUploadTap: function(e) {
    this.setData({ uploading: true,
                   uploadPercent: new Array(this.len).fill(0) })
    var user_id = 1
    var random_ind = parseInt(Math.random() * 100000)
    var uploadTask = Promise.all(range(this.len).map((ind) => {
      var tempPath = this.data.pics[ind]
      var tname = this.data.picTypes[ind].type
      // **TODO**: need wechat user information, and every user level index...
      return new Promise((resolve, reject) => {
        var singleUploadTask = wx.uploadFile({
          url: `${API_BASE_URL}/users/${user_id}/${random_ind}/`,
          filePath: tempPath,
          name: tname,
          formData: {
            type: tname
          },
          success: (res) => {
            resolve(res.data)
          }
        })
        singleUploadTask.onProgressUpdate((res) => {
          var percent = res.totalBytesSent / res.totalBytesSent
          var toset = "uploadPercent[" + ind + "]"
          this.setData({ [toset] : parseInt(percent * 100) })
        })
      })
    }))
    uploadTask.then(() => {
      this.setData({
        uploading: false,
        detecting: true
      })
      wx.request({
        method: "POST",
        url: `${API_BASE_URL}/users/${user_id}/${random_ind}/detect`,
        data: {
          shoeModelIndex: this.data.shoeModelIndex,
          comment: this.data.comment
        },
        success: (res) => {
          this.setData({ detecting: false, detected: true })
          var ans;
          switch (res.data["answer"]) {
            case FAKE: ans = "假鞋"; break
            case NOT_SURE: ans = "不确定"; break
            case TRUE: ans = "真鞋"; break
            default: { console.error("错误!!!");
                       this.setData({ toastText: "服务器返回数据错误",
                                      toastHidden: false })
            }
          }
          this.setData({ detectRes: ans })
        }
      })
    })
  },

  takePhoto() {
    if (this.data.previewShow || this.data.canUpload) {
      return
    }
    var cInd = parseInt(this.data.currentIndex);
    console.log("take photo called.", cInd)
    this.ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        this.setData({ ["pics["+cInd+"]"]: res.tempImagePath })
        // Find next index that is not photoed
        var tn = this.len
        var finished = true
        for (let i = 1; i < tn; i++) {
          var nInd = (cInd + i) % tn
          if (!this.data.pics[nInd]) {
            this.setData({ currentIndex: nInd })
            finished = false
            break
          }
        }
        if (finished) {
          this.setData({ canUpload: true,
                         previewShow: true,
                         previewSrc: this.data.pics[this.data.currentIndex]
          })
        }
      }
    })
  },

  getUserInfo: function(e) {
    console.log("at getUserInfo", e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },

  error(e) {
    console.log(e.detail)
  }
})
