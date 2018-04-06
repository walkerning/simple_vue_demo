<template>
  <div id="app">
    <canvas ref="tmp" style="display: none" :height="height" :width="width"></canvas>
    <!--
        <div class="row cv_cont" :style="{height: 300,   position: 'relative'}">-->
    <el-row>
      <el-col :span="320">
        <video class="vd" :width="width" :height="height" ref="video" @loadedmetadata="set_height" v-show="video_show"></video>
      <canvas :width="width" :height="height"  :style="{'margin-left': video_show?'-320px':'0px'}" ref="canvas"></canvas>
      <!-- style="border:1px solid #BBB;" -->
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="4" v-for="tp in pic_lst.slice(0, 3)" :key="tp.type">
        <img :ref="'photo_' + tp.type" :alt="tp.type" :class="{hightlight: tp.type == current_pictype}" @click="change_cur_pictype(tp.type)"/>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="4" v-for="tp in pic_lst.slice(3, 6)" :key="tp.type">
        <img :ref="'photo_' + tp.type" :alt="tp.type" :class="{hightlight: tp.type == current_pictype}" @click="change_cur_pictype(tp.type)"/>
      </el-col>
    </el-row>

    <el-row>
      <template v-if="video_show">
        <span class="shoot" @click="take_picture">
        </span>
      </template>
      <template v-else-if="all_photoed">
        <!-- **TODO** 填写类别和备注信息才能提交 -->
        <mt-button @click.native="submit_pics">提交</mt-button>
      </template>
    </el-row>

  </div>

</template>

<script>
  import pic_type from "./common/pic_type"
  import _ from "lodash"

  var PREVIEW_RATIO = 4;

export default {
  name: "app",
  data () {
    return {
      streaming: false,
      all_photoed: false,
      current_pictype: pic_type.PIC_TYPE.APPEAR,
      pic_lst: _.map(pic_type.PIC_TYPE_LST, (tp) => {return {type: tp, pic: null}}),
      width: 320,
      height: 0,
      video_show: true,
      PREVIEW_RATIO: PREVIEW_RATIO
    }
  },
  methods: {
    next_not_photoed: function() {
      var not_photoed = _.filter(this.pic_lst, (p) => {return p.pic == null});
      if (not_photoed.length == 0) {
        return null;
      }
      return not_photoed[0].type;
    },
    change_cur_pictype: function(tp) {
      // **TODO**: 判断弹出预览/重拍选择...
      if (tp !== this.current_pictype) {
        this.current_pictype = tp;

        var cur_pic_data = this.pic_lst[pic_type.PIC_TYPE_IND[this.current_pictype]].pic;
        if (!cur_pic_data) {
          this.video_show = true;
          var video = this.$refs.video;
          video.play();
          this.plot_box(this.current_pictype);
        } else {
          this.video_show = false;
          this.plot_canvas(cur_pic_data);
        }
      }
    },
    set_height: function() {
      if (!this.streaming) {
        var video = this.$refs.video;
        this.height = video.videoHeight / (video.videoWidth/this.width);

        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.

        if (isNaN(this.height)) {
          this.height = this.width / (4/3);
        }
        this.streaming = true;
        this.plot_box(this.current_pictype);
        console.log("set src");
      }
    },
    plot_canvas: function(img) {
      var canvas = this.$refs.canvas;
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, this.width, this.height);
      var t_img = new Image();

      var c_w = this.width;
      var c_h = this.height;
      t_img.onload = function() {

        var sizer = Math.min((c_w/t_img.width),(c_h/t_img.height));
        console.log("plot canvas: ", t_img.width, t_img.height, sizer)
        var d_w = t_img.width * sizer;
        var d_h = t_img.height * sizer;
        ctx.drawImage(t_img, 0, 0, t_img.width, t_img.height, (c_w - d_w) / 2, (c_h - d_h) / 2, d_w, d_h);
      }
      t_img.src = img;
    },
    plot_box: function(ctype) {
      this.plot_canvas(pic_type.BOX_IMAGE_MAP[ctype]);
    },
    // plot_box: function(ctype) {
    //   var canvas = this.$refs.canvas;
    //   var ctx = canvas.getContext('2d');
    //   ctx.clearRect(0, 0, this.width, this.height);
    //   var t_img = new Image();

    //   var c_w = this.width;
    //   var c_h = this.height;
    //   t_img.onload = function() {
    //     var sizer = Math.min((c_w/t_img.width),(c_h/t_img.height));
    //     var d_w = t_img.width * sizer;
    //     var d_h = t_img.height * sizer;
    //     ctx.drawImage(t_img, 0, 0, t_img.width, t_img.height, (c_w - d_w) / 2, (c_h - d_h) / 2, d_w, d_h);
    //   }
    //   t_img.src = pic_type.BOX_IMAGE_MAP[ctype];
    // },
    // plot_on_canvas: _.debounce(function() {
    //   var video = this.$refs.video;
    //   var canvas = this.$refs.canvas;
    //   var ctx = canvas.getContext('2d');
    //   if (!video.paused) {
    //     ctx.drawImage(video, 0, 0, this.width, this.height);
    //   }
    // }, 5),
    take_picture: function() {
      console.log("hi thre", this.width, this.height);
      var video = this.$refs.video;
      var tmp_canvas = this.$refs.tmp;

      tmp_canvas.height = this.height;
      tmp_canvas.width = this.width;
      var sizer_v = video.videoHeight / this.height;
      var tmp_ctx = tmp_canvas.getContext('2d');
      tmp_ctx.drawImage(video, 0, 0, this.width * sizer_v, this.height * sizer_v, 0, 0, this.width, this.height);
      var t_data = tmp_canvas.toDataURL('image/png');
      this.pic_lst[pic_type.PIC_TYPE_IND[this.current_pictype]].pic = t_data;

      tmp_canvas.height = this.height / PREVIEW_RATIO;
      tmp_canvas.width = this.width / PREVIEW_RATIO;
      tmp_ctx = tmp_canvas.getContext('2d');
      tmp_ctx.drawImage(video, 0, 0, this.width * sizer_v, this.height * sizer_v, 0, 0, this.width / PREVIEW_RATIO, this.height / PREVIEW_RATIO);
      var data = tmp_canvas.toDataURL('image/png');

      this.$refs["photo_" + this.current_pictype][0].setAttribute('src', data);

      console.log(this.height, this.width)
      var next_tp = this.next_not_photoed();
      console.log(next_tp);
      if (next_tp == null) {
        video.pause();
        this.$refs.canvas.getContext('2d').clearRect(0, 0, this.width, this.height);
        this.video_show = false;
        this.all_photoed = true;
        // **TODO**: 画出现在的预览?
      } else {
        this.current_pictype = next_tp;
        this.plot_box(this.current_pictype);
      }
    },
    submit_pics: function() {
      // **TODO**: axios send to server
    }
  },
  mounted() {
    var video = this.$refs.video;
    var canvas = this.$refs.canvas;
    // **TODO**: 先把几个box resize到width/PREVIEW_RATIO height/PREVIEW_RATIO的precomputed好, 不要每次去load from file.... 把所有box的大小两个size的base64也都compute好... 可以pic_list里吧直接...嗯嗯... 然后img显示的直接把小图的base64放在一个list里.... pic不存在就显示box...            大图也是一样的pic和box放在pic_list里...每次从那里面画就好了...所有precompute box都放这里做吧...
    navigator.mediaDevices.getUserMedia({video: true, audio: false})
      .then(function (stream) {
        video.srcObject = stream;
        video.play();
      })
      .catch(function (err) {
        console.log(err);
      });

  },
}
</script>

<style>

  .cv_cont {
  position: relative;
  -webkit-box-align:center;
  -webkit-box-pack:center;
  }

canvas {
#display: block;
  #position: absolute;
z-index:0;
top: 0;
left: 0;
#margin: 0;
}

.vd {
#display: block;
#position: absolute;
z-index: -1;
top: 0;
left: 0;
margin: 0;
}
.shoot {
  width: 4.5rem;
  height: 4.5rem;
  display: block;
  border-radius: 50%;
  margin: .3rem auto;
  background:url('./assets/images/shoot.png') no-repeat;
  -webkit-background-size: 2rem 2rem;
  background-size: 2.4rem 2.4rem;
  background-position: 50%  50%;
}
.row {
    display:block;
    position:relative;
}
.hightlight {
border: 1mm solid red;
}
img {
display: inline;
}
.el-row {
text-align: center;
}
.el-col {
text-align: center;
margin-left: 10%;
margin-right: 10%;
float: inherit;
display: inline;
}
</style>
