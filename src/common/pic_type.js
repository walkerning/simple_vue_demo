export default {
  PIC_TYPE_LST: ["appear", "tag", "stitch", "pad", "side_tag", "seal"],
  PIC_TYPE: {
    APPEAR: "appear",
    TAG: "tag",
    STITCH: "stitch",
    PAD: "pad",
    SIDE_TAG: "side_tag",
    SEAL: "seal"
  },
  PIC_TYPE_IND: {
    "appear": 0,
    "tag": 1,
    "stitch": 2,
    "pad": 3,
    "side_tag": 4,
    "seal": 5
  },
  BOX_IMAGE_MAP: {
    "appear":require("../assets/images/appear.png"),
    "tag":require("../assets/images/appear.png"),
    "stitch": require("../assets/images/appear.png"),
    "pad": require("../assets/images/appear.png"),
    "side_tag": require("../assets/images/appear.png"),
    "seal": require("../assets/images/appear.png")
  },
  picTypeString: function(type) {
    if (type === this.PIC_TYPE.APPEAR) {
      return "球鞋外观";
    } else if (type === this.PIC_TYPE.TAG) {
      return "球鞋鞋标";
    } else if (type === this.PIC_TYPE.STITCH) {
      return "中底走线";
    } else if (type === this.PIC_TYPE.PAD) {
      return "球鞋鞋垫";
    } else if (type === this.PIC_TYPE.SIDE_TAG) {
      return "鞋盒侧标";
    } else if (type === this.PIC_TYPE.SEAL) {
      return "鞋盒钢印";
    } else {
      return "";
    }
  },
  picTypeBoxFile: function(type) {
    if (type === this.PIC_TYPE.APPEAR) {
      return "assets/images/eg.png";
    } else if (type === this.PIC_TYPE.TAG) {
      return "球鞋鞋标";
    } else if (type === this.PIC_TYPE.STITCH) {
      return "中底走线";
    } else if (type === this.PIC_TYPE.PAD) {
      return "鞋垫";
    } else if (type === this.PIC_TYPE.SIDE_TAG) {
      return "鞋盒侧标";
    } else if (type === this.PIC_TYPE.SEAL) {
      return "鞋盒钢印";
    } else {
      return "";
    }
  }
};
