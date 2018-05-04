var wafer = require("../bower_components/wafer-client-sdk/index")
var consts = require("./consts")

const API_BASE_URL = `${consts.PROTOCOL}://${consts.HOST}${consts.API_PATH}`

// https://github.com/tencentyun/wafer-node-session
wafer.setLoginUrl(`${consts.PROTOCOL}://${consts.HOST}${consts.AUTH_PATH}`);

function p_request(arg) {
  return new Promise((resolve, reject) => {
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
}

module.exports = {
  apiGetUserMe: function apiGetUserMe() {
    return p_request({
      login: true,
      url: `${API_BASE_URL}/users/me`,
      method: "GET"
    })
  },
  apiGetUserTask: function apiGetUserTask(user_id, task_id) {
    return p_request({
      login: true,
      url: `${API_BASE_URL}/users/${user_id}/tasks/${task_id}`,
      method: "GET"
    })
  },
  apiGetUserTasks: function apiGetUserTasks(user_id) {
    return p_request({
      login: true,
      url: `${API_BASE_URL}/users/${user_id}/tasks`,
      method: "GET"
    })
  },
  apiCreateUserTask: function apiCreateTask(user_id) {
    return p_request({
      login: true,
      url: `${API_BASE_URL}/users/${user_id}/tasks`,
      method: "POST",
      data: {
        meta_tag: "v0.1"
      }
    })
  },
  apiDownloadFile: function apiDownloadFile(user_id, task_id, file_type) {
    var url = `${API_BASE_URL}/users/${user_id}/tasks/${task_id}/files/${file_type}`
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
  },
  apiUploadFile: function apiUploadFile(user_id, task_id, file_path, file_type, onProgressUpdate) {
    var task_url = `${API_BASE_URL}/users/${user_id}/tasks/${task_id}`
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
  },
  apiUpdateTask: function apiUpdateTask(user_id, task_id, data) {
    var task_url = `${API_BASE_URL}/users/${user_id}/tasks/${task_id}`
    return p_request({
      login: true,
      url: `${task_url}`,
      method: "PUT",
      data: data
    })
  },
  apiRunTask: function apiRunTask(user_id, task_id) {
    var task_url = `${API_BASE_URL}/users/${user_id}/tasks/${task_id}`
    return p_request({
      login: true,
      url: `${task_url}/run`,
      method: "PUT"
    });
  }
}
