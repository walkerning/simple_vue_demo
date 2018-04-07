<template>
  <div id="app">
    <canvas ref="tmp" style="display: none" :height="height" :width="width"></canvas>
    <!--
        <div class="row cv_cont" :style="{height: 300,   position: 'relative'}">-->
    <div class="container">
      <div class="row">
        <div class="col-sm">
        <video class="vd" :width="width" :height="height" ref="video" @loadedmetadata="set_height" v-show="video_show"></video>
      <canvas :width="width" :height="height"  :style="{'margin-left': video_show?'-320px':'0px'}" ref="canvas"></canvas>
      <!-- style="border:1px solid #BBB;" -->
        </div>
      </div>
    <div class="row">
      <template v-if="video_show">
        <span class="shoot" @click="take_picture">
        </span>
      </template>
    </div>
    <div class="row" v-if="box_loaded">
      <div class="col-sm" v-for="(tp, ind) in pic_lst.slice(0, 3)" :key="tp.type">
        <img :ref="'photo_' + tp.type" :alt="tp.type" :class="{hightlight: tp.type == current_pictype}" :src="preview_map[tp.type].pic?preview_map[tp.type].pic:preview_map[tp.type].box" @click="change_cur_pictype(tp.type)"/>
        <p>{{ pic_type_string(tp.type) }}</p>
      </div>
    </div>
    <div class="row" v-if="box_loaded">
      <div class="col-sm" v-for="tp in pic_lst.slice(3, 6)" :key="tp.type">
        <img :ref="'photo_' + tp.type" :alt="tp.type" :class="{hightlight: tp.type == current_pictype}" :src="preview_map[tp.type].pic?preview_map[tp.type].pic:preview_map[tp.type].box" @click="change_cur_pictype(tp.type)"/>
        <p>{{ pic_type_string(tp.type) }}</p>
      </div>
    </div>
    <mt-actionsheet
       :actions="actions"
       v-model="sheet_visible">
    </mt-actionsheet>
    <mt-actionsheet
       :actions="shoe_models_actions"
       v-model="choose_sheet_visible">
    </mt-actionsheet>
    <!-- <mt-picker -->
    <!--    :slots="shoe_models_slot" -->
    <!--    :value-key="name" -->
    <!--    @change="on_choose_change" -->
    <!--    :visible-item-count="5"> -->
    <!-- </mt-picker> -->
    <mt-cell title="球鞋型号"
             is-link
             @click.native="choose_sheet_visible=true"
             :value="shoe_models[selected_sm_id].name"></mt-cell>
      <!-- <el-col> -->
      <!--   <el-select v-model="selected_sm_id"> -->
      <!--     <template v-for="s in shoe_models"> -->
      <!--       <el-option :label="s.name" :value="s.id"></el-option> -->
      <!--     </template> -->
      <!--   </el-select> -->
      <!-- </el-col> -->
      <mt-field label="备注信息" placeholder="备注信息" type="textarea" rows="4" v-model="comment"></mt-field>

      <div class="row">
        <div class="col-sm">
          <mt-button @click.native="submit_pics" :disabled="!all_photoed">提交</mt-button>
          <mt-button @click.native="reset_all">重置</mt-button>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
  import { MessageBox, Indicator } from 'mint-ui'
import LZString from 'lz-string'
import pic_type from "./common/pic_type"
import sm from "./common/shoe_models"
import axios from 'axios';
  import _ from "lodash"

var PREVIEW_RATIO = 4;

export const api_version = "v1";
export const base = "https://foxfi.eva6.nics.cc";
export const api_base = base + "/api/" + api_version;

export default {
  name: "app",
  computed: {
    shoe_models_actions: function () {
      return _.map(this.shoe_models, (v, ind) => { return {name: v.name, method: () => {this.selected_sm_id = v.id; this.choose_sheet_visible = false;}}});
    },
    shoe_models_map: function () {
      return _.keyBy(this.shoe_models, "id")
    },
    compressed_pic_lst: function () {
      console.log("start compress");
      return _.map(this.pic_lst, (p) => {return {type: p.type, pic: LZString.compress(p.pic)};});
    }
  },
  data () {
    return {
      choose_sheet_visible: false, /* **TODO** 用picker做choose可能合适点???哇不会调... */
      sheet_visible: false,
      cur_sheet_click: false,
      actions: [{name: "预览",
                 method: () => {this.show_preview(this.cur_sheet_click);}},
                {name: "重拍",
                 method: () => {this.rephoto(this.cur_sheet_click);}}
               ],
      box_loaded: false,
      streaming: false,
      all_photoed: false,
      current_pictype: pic_type.PIC_TYPE.APPEAR,
      pic_lst: _.map(pic_type.PIC_TYPE_LST, (tp) => {return {type: tp, pic: null}}),
      box_map: {},
      preview_map: {},
      width: 320,
      height: 0,
      video_show: true,
      PREVIEW_RATIO: PREVIEW_RATIO,

      selected_sm_id: 0,
      shoe_models: sm.SHOE_MODELS,
      shoe_models_slot: [{
        defaultIndex: 0,
        values: sm.SHOE_MODELS
      }],
      comment: "" // 备注信息
    }
  },
  methods: {
    // on_choose_change: function (picker, value) {
    //   this.selected_sm_id = value.id;
    // },
    pic_type_string: function(pt) {
      return pic_type.picTypeString(pt);
    },
    img_to_base64: function(img, width, height) {
      return new Promise(function (resolve, reject) {
        var t_img = new Image();
        t_img.onload = function() {
          if (!width) {
            width = t_img.width;
            height = t_img.height;
          }
          var sizer;
          if (!height) {
            sizer = width / t_img.width;
            height = t_img.height * sizer;
          } else {
            var sizer = Math.min((width/t_img.width),(height/t_img.height));
          }
          var d_w = t_img.width * sizer;
          var d_h = t_img.height * sizer;
          var canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(t_img, 0, 0, t_img.width, t_img.height, (width - d_w) / 2, (height - d_h) / 2, d_w, d_h);
          var t_data = canvas.toDataURL('image/png');
          resolve(t_data);
        }
        t_img.onerror = reject;
        t_img.src = img;
        });
    },
    next_not_photoed: function() {
      var not_photoed = _.filter(this.pic_lst, (p) => {return p.pic == null});
      if (not_photoed.length == 0) {
        return null;
      }
      return not_photoed[0].type;
    },
    change_cur_pictype: function(tp) {
      // **TODO**: 判断弹出预览/重拍选择...
      //if (tp !== this.current_pictype) {
      var pic_data = this.pic_lst[pic_type.PIC_TYPE_IND[tp]].pic;
      if (!pic_data) {
        this.current_pictype = tp;
        this.video_show = true;
        var video = this.$refs.video;
        video.play();
        this.plot_box(this.current_pictype);
      } else {
        this.sheet_visible = true;
        this.cur_sheet_click = tp;
      }
    },
    show_preview: function (tp) {
      // **TODO**改成用popup会不会好点?
      this.sheet_visible = false;
      this.current_pictype = tp;
      this.video_show = false;
      var pic_data = this.pic_lst[pic_type.PIC_TYPE_IND[tp]].pic;
      this.plot_canvas(pic_data);
    },
    rephoto: function (tp) {
      this.sheet_visible = false;
      this.current_pictype = tp;
      var obj = this.pic_lst[pic_type.PIC_TYPE_IND[tp]];
      obj.pic = null;
      this.pic_lst.splice(pic_type.PIC_TYPE_IND[tp], 1, obj);
      this.preview_map[this.current_pictype].pic = null;
      this.video_show = true;
      var video = this.$refs.video;
      video.play();
      this.plot_box(this.current_pictype);
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
        var d_w = t_img.width * sizer;
        var d_h = t_img.height * sizer;
        ctx.drawImage(t_img, 0, 0, t_img.width, t_img.height, (c_w - d_w) / 2, (c_h - d_h) / 2, d_w, d_h);
      }
      t_img.src = img;
    },
    plot_box: function(ctype) {
      //this.plot_canvas(pic_type.BOX_IMAGE_MAP[ctype]);
      this.plot_canvas(this.box_map[ctype]);
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

      //this.$refs["photo_" + this.current_pictype][0].setAttribute('src', data);
      this.preview_map[this.current_pictype].pic = data;

      var next_tp = this.next_not_photoed();
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
    reset_all: function() {
      var i;
      for (i in pic_type.PIC_TYPE_LST) {
        this.pic_lst[i].pic = null;
      }
      for (i in pic_type.PIC_TYPE_LST) {
        this.preview_map[pic_type.PIC_TYPE_LST[i]].pic = null;
      }
      this.$refs.canvas.getContext('2d').clearRect(0, 0, this.width, this.height);
      this.comment = "";
      this.selected_sm_id = 0;
      this.current_pictype = pic_type.PIC_TYPE.APPEAR;
      this.plot_box(this.current_pictype);
      this.video_show = true;
      this.$refs.video.play();
    },
    submit_pics: function() {
      // **TODO**: axios send to server
      MessageBox.confirm("请确认已选择正确的球鞋型号( 当前选择 " + this.shoe_models_map[this.selected_sm_id].name + " ), 并正确拍照", "确认提交?")
        .then(action => {
          Indicator.open({
            text: '等待计算...',
            spinnerType: 'fading-circle'
          });

           //console.log(this.compressed_pic_lst[0].pic.length, this.pic_lst[0].pic.length)//, this.compressed_pic_lst[0].pic);
          var params = {
            sm_id: this.selected_sm_id,
            sm_name: this.shoe_models_map[this.selected_sm_id].name,
            comment: this.comment,
            // pic_lst: this.compressed_pic_lst
          pic_lst: this.pic_lst
          };

          axios.post(`${api_base}/detect`, params)
            .then((ans) => {
              Indicator.close();
              MessageBox.alert("此次提交判断为" + ans.result?"真":"假", "结果");
            })
            .catch(err => {
              Indicator.close();
              MessageBox.alert("出现错误");
              console.log(err);
            });
        })
        .catch((err) => {});
    }
  },
  mounted() {
    var video = this.$refs.video;
    var canvas = this.$refs.canvas;
    // **TODO**: 先把几个box resize到width/PREVIEW_RATIO height/PREVIEW_RATIO的precomputed好, 不要每次去load from file.... 把所有box的大小两个size的base64也都compute好... 可以pic_list里吧直接...嗯嗯... 然后img显示的直接把小图的base64放在一个list里.... pic不存在就显示box...            大图也是一样的pic和box放在pic_list里...每次从那里面画就好了...所有precompute box都放这里做吧...

    navigator.mediaDevices.getUserMedia({video: true, audio: false})
      .then((stream) => {
        video.srcObject = stream;
        video.play();
      })
      .then(() => {
        return Promise.all(_.map(this.pic_lst, (po) => { return  this.img_to_base64(pic_type.BOX_IMAGE_MAP[po.type], this.width); }))
          .then((big_boxes) => {
            this.box_map = _.reduce(_.zip(_.range(6), big_boxes), (obj, b) => { obj[this.pic_lst[b[0]].type] = b[1]; return obj;}, {});
        });
      })
      .then(() => {
        return Promise.all(_.map(this.pic_lst, (po) => { return  this.img_to_base64(pic_type.BOX_IMAGE_MAP[po.type], this.width/PREVIEW_RATIO); }))
          .then((small_boxes) => {
            this.preview_map = _.keyBy(_.map(small_boxes, (b, i) => {return {box: b, type:this.pic_lst[i].type, pic: null};}), "type");
            this.box_loaded = true;
        });
      })
      .catch((err) => {
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
  width: 9rem;
  height: 9rem;
  display: block;
  border-radius: 50%;
  margin: .3rem auto;
  background:url('./assets/images/shoot.png') no-repeat;
  -webkit-background-size: 4rem 4rem;
  background-size: 4.8rem 4.8rem;
  background-position: 50%  50%;
}
.row {
    display:block;
    position:relative;
    text-align: center;
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

p {

}
</style>
<style lang="scss">
@import '../node_modules/bootstrap/scss/bootstrap.scss';

</style>
