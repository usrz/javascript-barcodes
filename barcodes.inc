var Barcode = function() {

  /* ======================================================================= */
  /* Our "Barcode" object                                                    */
  /* ======================================================================= */

  var Barcode = function(type, code, parameters) {
    var _function = __formats[type];

    if (_function == null) {
      throw new Error('Unsupported barcode type "' + type + '"');
    }
    
    var _barcode = _function(code, parameters);
    this.parameters = _barcode.parameters || parameters || {};
    this.format = type;
    this.rows = _barcode.rows;
    this.cols = _barcode.cols;
    this.data = _barcode.data;
    this.contents = code;
  }

  Barcode.prototype.createCanvas = function(scaleX, scaleY) {
    var scale = normalizeScale(scaleX, scaleY);

    /* Create our Canvas element */
    canvas = document.createElement('canvas');
    canvas.width  = scale.x * this.cols;
    canvas.height = scale.y * this.rows;

    /* Paint! */
    var ctx = canvas.getContext('2d');                    
    for (var r = 0, y = 0; r < this.rows; r ++, y += scale.y) {
        for (var c = 0, x = 0; c < this.cols; c ++, x += scale.x) {
            if (this.data[r][c]) {                        
                ctx.fillRect(x, y, scale.x, scale.y);
            }
        }
    } 
    return canvas;
  }
  
  Barcode.prototype.createImageData = function(scaleX, scaleY) {
    var scale = normalizeScale(scaleX, scaleY);

    var _data = this.data;
    var _rows = this.rows;
    var _cols = this.cols;
    return __create_image_data(_cols * scale.x, _rows * scale.y, function(x, y) {
      var c = Math.floor(x / scale.x);
      var r = Math.floor(y / scale.y);
      if ((r >= 0) && (r < _rows) && (c >= 0) && (c < _cols)) {
        return _data[r][c] ? 0 : 1;
      } else {
        return 1;
      }
    });
  }

  /* ======================================================================= */
  /* Constants                                                               */
  /* ======================================================================= */
  Object.defineProperty(Barcode, 'PDF417_FORMAT',                              { enumerable: true, value: 'pdf417' });
                                                                              
  Object.defineProperty(Barcode, 'PDF417_KEY_ASPECT_RATIO',                    { enumerable: true, value: 'aspectRatio' });
  Object.defineProperty(Barcode, 'PDF417_VAL_ASPECT_RATIO_DEFAULT',            { enumerable: true, value: 2 });
                                                                              
  Object.defineProperty(Barcode, 'PDF417_KEY_ERROR_CORRECTION_LEVEL',          { enumerable: true, value: 'errorCorrectionLevel' });
  Object.defineProperty(Barcode, 'PDF417_VAL_ERROR_CORRECTION_LEVEL_DEFAULT',  { enumerable: true, value: -1 });
  Object.defineProperty(Barcode, 'PDF417_VAL_ERROR_CORRECTION_LEVEL_AUTO',     { enumerable: true, value: -1 });
  Object.defineProperty(Barcode, 'PDF417_VAL_ERROR_CORRECTION_LEVEL_0',        { enumerable: true, value: 0 });
  Object.defineProperty(Barcode, 'PDF417_VAL_ERROR_CORRECTION_LEVEL_1',        { enumerable: true, value: 1 });
  Object.defineProperty(Barcode, 'PDF417_VAL_ERROR_CORRECTION_LEVEL_2',        { enumerable: true, value: 2 });
  Object.defineProperty(Barcode, 'PDF417_VAL_ERROR_CORRECTION_LEVEL_3',        { enumerable: true, value: 3 });
  Object.defineProperty(Barcode, 'PDF417_VAL_ERROR_CORRECTION_LEVEL_4',        { enumerable: true, value: 4 });
  Object.defineProperty(Barcode, 'PDF417_VAL_ERROR_CORRECTION_LEVEL_5',        { enumerable: true, value: 5 });
  Object.defineProperty(Barcode, 'PDF417_VAL_ERROR_CORRECTION_LEVEL_6',        { enumerable: true, value: 6 });
  Object.defineProperty(Barcode, 'PDF417_VAL_ERROR_CORRECTION_LEVEL_7',        { enumerable: true, value: 7 });
  Object.defineProperty(Barcode, 'PDF417_VAL_ERROR_CORRECTION_LEVEL_8',        { enumerable: true, value: 8 });
  
  Object.defineProperty(Barcode, 'QRCODE_FORMAT',                              { enumerable: true, value: 'qrcode' });
  
  Object.defineProperty(Barcode, 'QRCODE_KEY_VERSION',                         { enumerable: true, value: 'version' });
  Object.defineProperty(Barcode, 'QRCODE_VAL_VERSION_DEFAULT',                 { enumerable: true, value: 4 });
  Object.defineProperty(Barcode, 'QRCODE_VAL_VERSION_1',                       { enumerable: true, value: 1 });
  Object.defineProperty(Barcode, 'QRCODE_VAL_VERSION_2',                       { enumerable: true, value: 2 });
  Object.defineProperty(Barcode, 'QRCODE_VAL_VERSION_3',                       { enumerable: true, value: 3 });
  Object.defineProperty(Barcode, 'QRCODE_VAL_VERSION_4',                       { enumerable: true, value: 4 });
  Object.defineProperty(Barcode, 'QRCODE_VAL_VERSION_5',                       { enumerable: true, value: 5 });
  Object.defineProperty(Barcode, 'QRCODE_VAL_VERSION_6',                       { enumerable: true, value: 6 });
  Object.defineProperty(Barcode, 'QRCODE_VAL_VERSION_7',                       { enumerable: true, value: 7 });
  Object.defineProperty(Barcode, 'QRCODE_VAL_VERSION_8',                       { enumerable: true, value: 8 });
  Object.defineProperty(Barcode, 'QRCODE_VAL_VERSION_9',                       { enumerable: true, value: 9 });
  Object.defineProperty(Barcode, 'QRCODE_VAL_VERSION_10',                      { enumerable: true, value: 10 });

  Object.defineProperty(Barcode, 'QRCODE_KEY_ERROR_CORRECTION_LEVEL',          { enumerable: true, value: 'errorCorrectionLevel' });
  Object.defineProperty(Barcode, 'QRCODE_VAL_ERROR_CORRECTION_LEVEL_DEFAULT',  { enumerable: true, value: -1 });
  Object.defineProperty(Barcode, 'QRCODE_VAL_ERROR_CORRECTION_LEVEL_LOW',      { enumerable: true, value: 0 });
  Object.defineProperty(Barcode, 'QRCODE_VAL_ERROR_CORRECTION_LEVEL_MEDIUM',   { enumerable: true, value: 1 });
  Object.defineProperty(Barcode, 'QRCODE_VAL_ERROR_CORRECTION_LEVEL_QUARTILE', { enumerable: true, value: 2 });
  Object.defineProperty(Barcode, 'QRCODE_VAL_ERROR_CORRECTION_LEVEL_HIGH',     { enumerable: true, value: 3 });

  /* ======================================================================= */
  /* Little helper functions                                                 */
  /* ======================================================================= */
  var normalizeScale = function(scaleX, scaleY) {

    /* One parameter? Scale both! */
    if ((scaleX != null) && (scaleY == null)) {
      scaleY = scaleX;
    }
    
    /* Convert to numbers (keep barcodes pixel perfect) */
    scaleX = Math.round(Number(scaleX) || 2);
    scaleY = Math.round(Number(scaleY) || 2);

    /* Return them */
    return { x: scaleX, y: scaleY };
  }

  /* ======================================================================= */
  /* Imported libraries                                                      */
  /* ======================================================================= */

  /* Formats creation functions */
  var __formats = {};
  var __create_image_data;

  +function() {
    /* BCMath library statically included */
    // #include "bcmath/libbcmath.js"
    // #include "bcmath/libbcmath.add.js"
    // #include "bcmath/libbcmath.div.js"
    // #include "bcmath/libbcmath.doaddsub.js"
    // #include "bcmath/libbcmath.recmul.js"
    // #include "bcmath/bcmath.js"
    
    /* Import the PDF417 library */
    // #include "pdf417/pdf417_constants.js"
    // #include "pdf417/pdf417_helpers.js"
    // #include "pdf417/pdf417_create.js"
    __formats['pdf417'] = pdf417_create;

    /* Import the QRCODE creation code */
    // #include "qrcode/qrcode_create.js"
    __formats['qrcode'] = qrcode_create;

    /* Import the QRCODE GIF library */
    // #include "qrcode/qrcode_giflib.js"
    __create_image_data = create_image_data;
  }();


  /* ======================================================================= */
  /* Return our object definition                                            */
  /* ======================================================================= */
  return Barcode;

}();
