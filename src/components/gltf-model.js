var registerComponent = require('../core/component').registerComponent;
var THREE = require('../lib/three');
var utils = require('../utils/');
var warn = utils.debug('components:gltf-model:warn');

/**
 * glTF model loader.
 */
module.exports.Component = registerComponent('gltf-model', {
  schema: {type: 'model'},

  init: function () {
    var self = this;
    var dracoLoader = this.system.getDRACOLoader();
    var meshoptDecoder = this.system.getMeshoptDecoder();
    var ktxLoader = this.system.getKTX2Loader();
    this.model = null;
    this.loader = new THREE.GLTFLoader();
    if (dracoLoader) {
      this.loader.setDRACOLoader(dracoLoader);
    }
    if (meshoptDecoder) {
      this.ready = meshoptDecoder.then(function (meshoptDecoder) {
        self.loader.setMeshoptDecoder(meshoptDecoder);
      });
    } else {
      this.ready = Promise.resolve();
    }
    if (ktxLoader) {
      this.loader.setKTX2Loader(ktxLoader);
    }
  },

  update: function () {
    var self = this;
    var el = this.el;
    var src = this.data;

    if (!src) { return; }

    this.remove();

    this.ready.then(function () {
      self.loader.load(src, function gltfLoaded (gltfModel) {
        self.model = gltfModel.scene || gltfModel.scenes[0];
        self.model.animations = gltfModel.animations;

        self.centerModel();

        el.setObject3D('mesh', self.model);
        el.emit('model-loaded', {format: 'gltf', model: self.model});
      }, undefined /* onProgress */, function gltfFailed (error) {
        var message = (error && error.message) ? error.message : 'Failed to load glTF model';
        warn(message);
        el.emit('model-error', {format: 'gltf', src: src});
      });
    });
  },

  centerModel: function () {
    var model = this.model;
    var box = new THREE.Box3().setFromObject(model);
    var center = box.getCenter(new THREE.Vector3());

    model.position.x += (model.position.x - center.x);
    model.position.y += (model.position.y - center.y);
    model.position.z += (model.position.z - center.z);
  },

  remove: function () {
    if (!this.model) { return; }
    this.el.removeObject3D('mesh');
  }
});
