var wafer = require("../bower_components/wafer-client-sdk/index")
var consts = require("./consts")
var utils = require("./utils")

// Only in development mode!!!
var HOST_URL = null
var API_BASE_URL = null
var tryurl = `${consts.PROTOCOL}://${consts.HOST}`
var cfg_promise = utils.timeout(new Promise((resolve, reject) => {
  wx.request({
    url: `${tryurl}${consts.AUTH_PATH}`,
    success: () => {
      resolve()
    },
    fail: (err) => {
      reject()
    }
  })
}), 3000)
  .then(() => { HOST_URL = tryurl })
  .catch(() => { HOST_URL = `${consts.PROTOCOL}://${consts.BACKUP_HOST}` })
  .then(() => {
    console.log("host url: ", HOST_URL)
    wafer.setLoginUrl(HOST_URL + `${consts.AUTH_PATH}`)
    API_BASE_URL = HOST_URL + `${consts.API_PATH}`
})

// https://github.com/tencentyun/wafer-node-session
function wrap_cfg_promise(func) {
  return function() {
    return cfg_promise.then(() => { return func.apply(this, arguments) })
  }
}

function p_request(arg) {
  return cfg_promise.then(() => {
    return new Promise((resolve, reject) => {
      arg["url"] = API_BASE_URL + arg.url
      arg["success"] = function(res) {
        // TODO: status
        console.log(res)
        if (Math.floor(res.statusCode / 100) != 2) {
          reject(res)
        } else {
          resolve(res.data)
        }
      }
      arg["fail"] = function(err) {
        console.log("error: ", err)
        reject(err)
      }
      wafer.request(arg)
    })
  })
}

module.exports = {
  apiGetUserMe: function apiGetUserMe() {
    return p_request({
      login: true,
      url: `/users/me`,
      method: "GET"
    })
  },
  apiGetUserTask: function apiGetUserTask(user_id, task_id) {
    return p_request({
      login: true,
      url: `/users/${user_id}/tasks/${task_id}`,
      method: "GET"
    })
  },
  apiGetUserTasks: function apiGetUserTasks(user_id) {
    return p_request({
      login: true,
      url: `/users/${user_id}/tasks`,
      method: "GET"
    })
  },
  apiCreateUserTask: function apiCreateTask(user_id) {
    return p_request({
      login: true,
      url: `/users/${user_id}/tasks`,
      method: "POST",
      data: {
        meta_tag: "v0.1"
      }
    })
  },
  apiDownloadFile: wrap_cfg_promise(function apiDownloadFile(user_id, task_id, file_type) {
    var url = API_BASE_URL + `/users/${user_id}/tasks/${task_id}/files/${file_type}`
    return new Promise((resolve, reject) => {
      wafer.downloadFile({
        login: true,
        url: url,
        success: (res) => {
          console.log(res)
          if (res.statusCode == 204) {
            resolve(undefined)
          } else {
            resolve(res["tempFilePath"])
          }
        },
        fail: (err) => {
          if (err.errMsg.includes("file data is empty")) {
            // FIXME: a temp fix...
            resolve(undefined)
          } else {
            reject(err)
          }
        }
      })
    })
  }),
  apiUploadFile: wrap_cfg_promise(function apiUploadFile(user_id, task_id, file_path, file_type, onProgressUpdate) {
    var task_url = API_BASE_URL + `/users/${user_id}/tasks/${task_id}`
    return new Promise((resolve, reject) => {
      wafer.uploadFile({
        login: true,
        url: `${task_url}/files`,
        method: "POST",
        filePath: file_path,
        name: "file",
        formData: {
          type: file_type
        },
        success: (res) => {
          resolve(res.data)
        },
        fail: (err) => {
          reject(err)
        }
      }, (task) => {
        if (onProgressUpdate !== undefined) {
          task.onProgressUpdate(onProgressUpdate)
        }
      })
    })
  }),
  apiUpdateTask: function apiUpdateTask(user_id, task_id, data) {
    return p_request({
      login: true,
      url: `/users/${user_id}/tasks/${task_id}`,
      method: "PUT",
      data: data
    })
  },
  apiRunTask: function apiRunTask(user_id, task_id, form_id) {
    var options = {
      login: true,
      url: `/users/${user_id}/tasks/${task_id}/run`,
      method: "PUT"
    }
    if (form_id) {
      options["data"] = { form_id }
    }
    return p_request(options);
  }
}
