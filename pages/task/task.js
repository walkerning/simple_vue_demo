// task.js
var consts = require("../../common/consts");
var api = require("../../common/api");
var utils = require("../../common/utils")
var viewCfg = require("../../common/view")

const app = getApp()

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
    canIUse: wx.canIUse("button.open-type.getUserInfo"),

    // view data
    stateViewCfg: viewCfg.stateViewCfg,
    answerViewCfg: viewCfg.answerViewCfg,
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

    fetching: false,
    // Upload
    canUpload: false,
    uploading: false,
    requesting: false,
    uploadPercent: [],
    toastText: "",
    toastHidden: true,
    reportSubmit: false,

    // task infos
    id: null,
    user_id: null,
    meta_tag: "",
    task_name: "",
    comment: "",
    comment_len: 0,
    shoe_model: "", // FIXME: shoe_model这里处理一下...

    // shoe models
    shoeModels: [null, "Addidas 三叶草", "VANS CLASSIC", "AJ"],
    shoeModelIndex: 0,

    // state infos
    state: "",
    answer: "",
    log: "",
    run_time: "",
    start_time: "",
    finish_time: ""
  },
  //事件处理函数
  onLoad: function (option) {
    // FIXME: supported shoe model should be fetched from server too...
    // this.setData(app.now_task)
    this.len = this.data.picTypes.length
    // this.setData({
    //   user_id: app.now_task.user_id,
    //   id: app.now_task.id
    // })
    this.setData({
      user_id: option.user_id,
      id: option.id
    })
    this.refreshTaskInfo()
      .then(() => {
        if (this.data.state == "incomplete") {
          this.ctx = wx.createCameraContext()
        }
        this.setData({
          maskSrc: this.data.picTypes[this.data.currentIndex]["mask_pic"],
          uploadPercent: new Array(this.len).fill(0)
        })
      })
      .catch((err) => { utils.error(err) })
  },

  downloadFiles: function() {
    return Promise.all(this.data.picTypes.map((p) => {
      return api.apiDownloadFile(this.data.user_id, this.data.id, p["type"]);
    }))
  },

  refreshTaskInfo: function() {
    this.setData({ fetching: true })
     return api.apiGetUserTask(this.data.user_id, this.data.id)
      .then((t) => {
        this.setData(t)
        var ind = this.data.shoeModels.indexOf(this.data.shoe_model)
        this.setData({ shoeModelIndex: ind })
      })
      .then(() => {
        return this.downloadFiles().then((paths) => {
          return Promise.all(paths.map((path, ind) => {
            if (path === undefined) {
              if (this.data.state !== "incomplete") {
                return Promise.reject({ message: "任务状态出错, 图片文件可能已被删除" })
              }
            } else {
              this.setData({
                ["pics[" + ind + "]"]: path
              })
            }
            return Promise.resolve(null)
          })).then(() => { this.setData({ fetching: false }) })
        })
      })
      .then(() => {
        var nInd = this.findNextNotPhotoed()
        if (nInd === undefined) {
          nInd = 0 // preview first
          this.setData({ canUpload: true })
        }
        this.changeCurrentIndex(nInd, true)
      })
  },

  onPullDownRefresh: function () {
    this.refreshTaskInfo()
      .then(() => {
        wx.stopPullDownRefresh()
      })
      .catch((err) => {
        utils.error(err)
        wx.stopPullDownRefresh()
      })
  },

  changeCurrentIndex: function (newInd, noaction) {
    if (this.data.state == "incomplete") {
      this.setData({ currentIndex: newInd })
      this.setData({ maskSrc: this.data.picTypes[this.data.currentIndex]["mask_pic"] })
      if (this.data.uploading || this.data.detecting) {
        this.setData({ previewShow: true, previewSrc: this.data.pics[newInd] })
        return
      }
      if (this.data.pics[newInd] && !noaction) { // if has data, show the action sheet
        this.setData({ actionSheetHidden: false })
      } else { // else make sure in camera mode
        this.setData({ previewShow: false })
      }
    } else {
      this.setData({ currentIndex: newInd })
      this.setData({
        maskSrc: this.data.picTypes[this.data.currentIndex]["mask_pic"],
        previewShow: true,
        previewSrc: this.data.pics[newInd]
      })
    }
  },

  changeCurrentIndexEvent: function (e) {
    this.changeCurrentIndex(e.currentTarget.id)
  },

  bindTaskNameInput: function(e) {
    this.setData({ task_name: e.detail.value })
  },

  bindCommentInput: function(e) {
    this.setData({
      comment: e.detail.value,
      comment_len: e.detail.value.length
    })
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
    this.setData({ shoeModelIndex: e.detail.value, shoe_model: this.data.shoeModels[e.detail.value] })
  },

  // bindToastChange: function(e) {
  //   this.setData( {toastHidden: true })
  // },
  bindSwitchChange: function(e) {
    this.setData({ reportSubmit: e.detail.value })
  },

  bindReturnToList: function(e) {
    wx.switchTab({ url: "/pages/list/list" })
  },

  bindSaveTap: function(e) {
    this.setData({
      uploading: true,
      uploadPercent: new Array(this.len).fill(0)
    })
    var user_id = this.data.user_id
    var task_id = this.data.id

    var uploadTask = Promise.all(range(this.len).map((ind) => {
      var tempPath = this.data.pics[ind]
      if (!tempPath) {
        return Promise.resolve(null);
      }
      var tname = this.data.picTypes[ind].type
      // **TODO**: need wechat user information, and every user level index...
      var onProgressUpdate = (res) => {
        var percent = res.totalBytesSent / res.totalBytesSent
        var toset = "uploadPercent[" + ind + "]"
        this.setData({ [toset]: parseInt(percent * 100) })
      }
      return api.apiUploadFile(user_id, task_id, tempPath, tname, onProgressUpdate)
    }))

    return uploadTask.then(() => {
      return api.apiUpdateTask(user_id, task_id, {
        "shoe_model": this.data.shoe_model,
        "comment": this.data.comment,
        "task_name": this.data.task_name
      });
    }).then((task) => {
      this.setData(task)
      this.setData({
        uploading: false
      })
    }).catch((err) => {
      utils.error(err)
      this.setData({
        uploading: false
      })
      return Promise.reject(null)
    })
  },

  bindRunSubmit: function(e) {
    console.log('e.detail.formId:', this.data.reportSubmit, e.detail.formId)
    wx.showModal({
      title: "确定开始测试吗",
      content: "一旦开始测试, 不能再改变任务配置或取消测试. 请仔细确认图片合格, 信息正确, 以及是否打开完成通知",
      confirmText: "确定",
      cancelText: "取消",
      success: (res) => {
        if (res.confirm) {
          var user_id = this.data.user_id
          var task_id = this.data.id
          return this.bindSaveTap().then(() => {
            this.setData({
              requesting: true
            })
            return api.apiRunTask(user_id, task_id, e.detail.formId)
              .then((task) => {
                // TODO: update this page...
                this.setData(task)
                this.setData({
                  requesting: false
                })
              })
          })
            .catch((err) => {
              utils.error(err)
              this.setData({
                  requesting: false
              })
            });
        }
      }
    })
    // handle error! connection or server return validation/bad request error and so on.
  },

  findNextNotPhotoed: function() {
    var cInd = parseInt(this.data.currentIndex);
    var tn = this.len
    for (let i = 0; i < tn; i++) {
      var nInd = (cInd + i) % tn
      if (!this.data.pics[nInd]) {
        return nInd;
      }
    }
    return undefined;
  },

  takePhoto() {
    if (this.data.previewShow || this.data.canUpload) {
      return
    }
    var cInd = parseInt(this.data.currentIndex);
    console.log("take photo called.", cInd)
    this.ctx.takePhoto({
      quality: "high",
      success: (res) => {
        this.setData({ ["pics["+cInd+"]"]: res.tempImagePath })
        // Find next index that is not photoed
        var nInd = this.findNextNotPhotoed()
        if (nInd !== undefined) {
          this.setData({ currentIndex: nInd })
        } else {
          this.setData({ canUpload: true,
                         previewShow: true,
                         previewSrc: this.data.pics[this.data.currentIndex]
                       })
        }
      }
    })
  },

  getUserInfo: function(e) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})
