/*==================================================================================================================================================*
 | PDF417 BARCODE CREATION FUNCTION                                                                                                                 |
 *==================================================================================================================================================*/
/*
 * code (string) code to represent using PDF417
 * param.ecl (int) error correction level (0-8); default -1 = automatic correction level
 * param.aspectratio (float) the width to height of the symbol
 */
var pdf417_create = function(code, parameters) {
  var _ecl = -1;
  var _aspect_ratio = 2;
  if (parameters != null) {
    _ecl = Number(parameters.errorCorrectionLevel) || -1;
    _aspect_ratio = Number(parameters.aspectRatio) || 2;
  }

  code = unescape(encodeURIComponent(code)); // covert UTF-8 to ISO-8859-1 
  if (code === "") return false;

  // get the input sequence array
  var sequence = _get_input_sequences(code);    
  var codewords = []; // array of code-words
  for(var i=0;i<sequence.length; i++) {
    var cw = _get_compaction(sequence[i][0], sequence[i][1], true);
    codewords = codewords.concat(cw);
  }
  if (codewords[0] == 900) {
    // Text Alpha is the default mode, so remove the first code
    codewords.shift();
  }
  // count number of codewords
  var numcw = codewords.length;
  if (numcw > 925) {
    // reached maximum data codeword capacity
    return false;
  }   

  // set error correction level
  var ecl = _get_error_correction_level(_ecl, numcw);
  // number of codewords for error correction
  var errsize = (2 << ecl);
  // calculate number of columns (number of codewords per row) and rows
  var nce = (numcw + errsize + 1);
  var cols = Math.round((Math.sqrt(4761 + (68 * _aspect_ratio * nce)) - 69) / 34);
  // adjust cols
  if (cols < 1) {
    cols = 1;
  } else if (cols > 30) {
    cols = 30;
  }
  var rows = Math.ceil(nce / cols);
  var size = (cols * rows);
  // adjust rows
  if ((rows < 3) || (rows > 90)) {
    if (rows < 3) {
      rows = 3;
    } else if (rows > 90) {
      rows = 90;
    }
    cols = Math.ceil(size / rows);
    size = (cols * rows);
  }
  if (size > 928) {
    // set dimensions to get maximum capacity
    if (Math.abs(_aspectRatio - (17 * 29 / 32)) < Math.abs(_aspectRatio - (17 * 16 / 58))) {
      cols = 29;
      rows = 32;
    } else {
      cols = 16;
      rows = 58;
    }
    size = 928;
  }
  // calculate padding
  var pad = (size - nce);
  if (pad > 0) {
    if ((size - rows) == nce) {
      --rows;
      size -= rows;
    } else {
      // add pading
      codewords = codewords.concat(_array_fill(0, pad, 900));
    }
  }

  // Symbol Length Descriptor (number of data codewords including Symbol Length Descriptor and pad codewords)
  var sld = size - errsize;
  // add symbol length description
  codewords.unshift(sld);
  // calculate error correction
  var ecw = _get_error_correction_word(codewords, ecl);
  // add error correction codewords
  codewords = codewords.concat(ecw);
  // create our return structure
  var _barcode_array = {
    rows: rows,
    cols: ((cols + 2) * 17) + 35,
    data: new Array(),
    parameters: {
      aspectRatio: _aspect_ratio,
      errorCorrectionLevel: ecl
    }
  };

  var L;
  var k = 0; // codeword index
  var cid = 0; // initial cluster
  // for each row
  for (var r = 0; r < rows; ++r) {
    // row start code
    var row = START_PATTERN;
    switch (cid) {
      case 0: {
        L = ((30 * _intval(r / 3)) + _intval((rows - 1) / 3));
        break;
      }
      case 1: {
        L = ((30 * _intval(r / 3)) + (ecl * 3) + ((rows - 1) % 3));
        break;
      }
      case 2: {
        L = ((30 * _intval(r / 3)) + (cols - 1));
        break;
      }
    }
    // left row indicator
    row += _binary17(CLUSTERS[cid][L]);
    // for each column
    for (var c = 0; c < cols; ++c) {
      row += _binary17(CLUSTERS[cid][codewords[k]]);
      ++k;
    }
    switch (cid) {
      case 0: {
        L = ((30 * _intval(r / 3)) + (cols - 1));
        break;
      }
      case 1: {
        L = ((30 * _intval(r / 3)) + _intval((rows - 1) / 3));
        break;
      }
      case 2: {
        L = ((30 * _intval(r / 3)) + (ecl * 3) + ((rows - 1) % 3));
        break;
      }
    }
    // right row indicator
    row += _binary17(CLUSTERS[cid][L]);
    // row stop code
    row += STOP_PATTERN;
    // convert the string to array
    var arow = new Array();
    for (var c in row) {
      arow.push(row[c] == '1')
    }
    // duplicate row to get the desired height
    _barcode_array['data'].push(arow);
    ++cid;
    if (cid > 2) {
      cid = 0;
    }
  }

  return _barcode_array;
};
