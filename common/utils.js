module.exports = {
  error: function error(err, prefix) {
    console.log(err)
    if (!err) {
      return
    }
    var errMsg = err // failed connection and so on
    if (err.statusCode) {
      // for failed api request
      if (err.data.message) {
        errMsg = err.data.message
      } else {
        errMsg = `错误: 返回代码 ${err.statusCode}`
      }
    } else if (err.message) {
      errMsg = err.message // wechat api error
    }
    if (prefix) {
      errMsg = prefix + errMsg
    }
    wx.showToast({
      title: errMsg,
      icon: "none",
      duration: 3000
    })
  },

  timeout: function timeout(promise, ms, rejectMsg) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(rejectMsg ? rejectMsg: "操作超时")
      }, ms)
      promise
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}
