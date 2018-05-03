// components/task.js
var viewCfg = require("../../common/view")

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    userId: {
      type: Number
    },
    taskId: {
      type: Number
    },
    state: {
      type: String
    },
    answer: {
      type: String
    },
    shoeModel: {
      type: String
    }
  },

  data: {
    stateViewCfg: viewCfg.stateViewCfg,
    answerViewCfg: viewCfg.answerViewCfg
  }
})
