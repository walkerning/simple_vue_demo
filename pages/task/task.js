//index.js
//获取应用实例
var consts = require("../../common/consts");
var api = require("../../common/api");
// var UNorm = require("../../bower_components/unorm/lib/unorm");
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
    canIUse: wx.canIUse('button.open-type.getUserInfo'),

    // view data
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

    // Upload
    canUpload: false,
    uploading: false,
    requesting: false,
    uploadPercent: [],
    toastText: "",
    toastHidden: true,

    // task infos
    id: null,
    user_id: null,
    meta_tag: "",
    comment: "",
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
    // console.log(option)
    // // var shoe_models = this.data.shoeModels
    // // for (var i in shoe_models) {
    // //   shoe_models[i] = UNorm.nfkc(shoe_models[i])
    // // }
    // // this.setData({ shoeModels: shoe_models })
    // for (var key in option) {
    //   // option[key] = UNorm.nfkc(decodeURIComponent(option[key]))
    //   console.log(option[key])
    //   option[key] = decodeURIComponent(unescape(option[key]))
    //   console.log(option[key])
    // }
    // this.setData(option) // TODO: filter option
    this.setData(app.now_task)
    var ind = this.data.shoeModels.indexOf(this.data.shoe_model)
    console.log(this.data.shoeModels, this.data.shoe_model, ind, typeof(this.data.shoeModels[1]), typeof(this.data.shoe_model))
    this.setData({ shoeModelIndex: ind })
    // this.setData({
    //   taskId: option.task_id,
    //   userId: option.user_id,
    //   shoeModelIndex: ind,
    //   shoe_model: option.shoe_model,
    //   comment: option.comment,
    //   state: option.state,
    //   log: option.log,
    //   answer: option.answer,
    //   runTime: option.run_time,
    //   startTime: option.start_time,
    //   finishTime: option.finish_time,
    //   metaTag: option.meta_tag
    // });
    // **TODO**: get picture from server
    this.len = this.data.picTypes.length
    console.log("state: ", this.data.state)
    if (this.data.state == 'incomplete') {
      this.ctx = wx.createCameraContext()
    }
    this.setData({
      maskSrc: this.data.picTypes[this.data.currentIndex]["mask_pic"],
      uploadPercent: new Array(this.len).fill(0)
    })
    this.changeCurrentIndex(this.data.currentIndex)
  },

  onPullDownRefresh: function () {
    api.apiGetUserTask(this.data.user_id, this.data.id)
      .then(function (t) {
        this.setData(t)
      })
  },

  changeCurrentIndex: function (newInd) {
    if (this.data.state == "incomplete") {
      this.setData({ currentIndex: newInd })
      this.setData({ maskSrc: this.data.picTypes[this.data.currentIndex]["mask_pic"] })
      if (this.data.uploading || this.data.detecting) {
        this.setData({ previewShow: true, previewSrc: this.data.pics[newInd] })
        return
      }
      if (this.data.pics[newInd]) { // if has data, show the action sheet
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

  bindCommentInput: function(e) {
    this.setData({ comment: e.detail.value })
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

  // bindCommentInput: function(e) {
  //   this.setData({ comment: e.detail.value })
  // },

  bindToastChange: function(e) {
    this.setData( {toastHidden: true })
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
        "comment": this.data.comment
      });
    }).then((task) => {
      this.setData(task)
      this.setData({
        uploading: false
      })
    }).catch((err) => {
      this.setData({
        uploading: false
      })
      throw err
    })
  },
  // bindResetTap: function(e) {
  //   // if (this.data.state !== "incomplete") {
  //   //   return
  //   // }
  //   this.setData({
  //     currentIndex: 0,
  //     pics: {},
  //     actionSheetHidden: true,
  //     previewShow: false,
  //     previewSrc: null,
  //     shoeModelIndex: 0,
  //     shoe_model: null,
  //     comment: "",
  //     canUpload: false,
  //     uploading: false,
  //     requesting: false,
  //     uploadPercent: new Array(this.len).fill(0),
  //     toastText: "",
  //     toastHidden: true,
  //     answer: ""
  //   })
  // },

  bindUploadTap: function(e) {
    var user_id = this.data.user_id
    var task_id = this.data.id
    return this.bindSaveTap().then(() => {
      this.setData({
        requesting: true
      })
      return api.apiRunTask(user_id, task_id)
        .then((task) => {
          // TODO: update this page...
          this.setData(task)
          this.setData({
            requesting: false
          })
        })
      // TODO: handle error! connection or server return validation/bad request error and so on.
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
