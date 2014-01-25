/*==================================================================================================================================================*
 | PDF417 BARCODE HELPER FUNCTIONS                                                                                                                  |
 *==================================================================================================================================================*/
var _get_input_sequences = function(code) {
  var sequence_array = []; // array to be returned
  var numseq = [];
  // get numeric sequences    
  numseq = code.match(/([0-9]{13,44})/g);
  if (numseq == null) {
    numseq = [];      
  } else {
    // add offset to each matched line
    for (var n=0;n<numseq.length;n++) {
      var offset = code.indexOf(numseq[n]);
      numseq[n] = [numseq[n], offset];
    }
  }
  numseq.push(['', code.length]);
  var offset = 0;
  for(var i=0; i<numseq.length; i++) {
    var seq = numseq[i];      
    var seqlen = seq[0].length;
    if (seq[1] > 0) {
      // extract text sequence before the number sequence
      var prevseq = code.substr(offset, (seq[1] - offset));
      var textseq = [];
      // get text sequences       
      textseq = prevseq.match(/([\x09\x0a\x0d\x20-\x7e]{5,})/g);
      if (textseq == null) {
        textseq = [];       
      } else {
        // add offset to each matched line
        for (var n=0;n<textseq.length;n++) {
          var offset = prevseq.indexOf(textseq[n]);
          textseq[n] = [textseq[n], offset];
        }
      }       
      textseq.push(['', prevseq.length]);
      var txtoffset = 0;
      for(var j=0; j<textseq.length; j++) {
        var txtseq = textseq[j];
        var txtseqlen = txtseq[0].length;
        if (txtseq[1] > 0) {
          // extract byte sequence before the text sequence
          var prevtxtseq = prevseq.substr(txtoffset, (txtseq[1] - txtoffset));
          if (prevtxtseq.length > 0) {
            // add BYTE sequence
            if ((prevtxtseq.length == 1) && (sequence_array.length > 0) && (sequence_array[sequence_array.length - 1][0] == 900)) {
              sequence_array.push([913, prevtxtseq]);
            } else if ((prevtxtseq.length % 6) == 0) {
              sequence_array.push([924, prevtxtseq]);
            } else {
              sequence_array.push([901, prevtxtseq]);
            }
          }
        }
        if (txtseqlen > 0) {
          // add numeric sequence
          sequence_array.push([900, txtseq[0]]);
        }
        txtoffset = txtseq[1] + txtseqlen;
      }
    }
    if (seqlen > 0) {
      // add numeric sequence
      sequence_array.push([902, seq[0]]);
    }
    offset = seq[1] + seqlen;
  }
  return sequence_array;
};

/*==============================================================================================================================================*/

var _get_compaction = function(mode, code, addmode) {
  addmode = addmode || true;
  var cw = []; // array of codewords to return
  switch(mode) {
    case 900: { // Text Compaction mode latch
      var submode = 0; // default Alpha sub-mode
      var txtarr = []; // array of characters and sub-mode switching characters
      var codelen = code.length;
      for (var i = 0; i < codelen; ++i) {
        var chval = _ord(code.charAt(i));
        var k;
        if ((k = _array_search(chval, TEXT_SUBMODES[submode])) !== false) {
          // we are on the same sub-mode
          txtarr.push(k);
        } else {
          // the sub-mode is changed
          for (var s = 0; s < 4; ++s) {
            // search new sub-mode
            if ((s != submode) && ((k = _array_search(chval, TEXT_SUBMODES[s])) !== false)) {
              // s is the new submode
              if ((((i + 1) == codelen) || (((i + 1) < codelen) && (_array_search(_ord(code.charAt(i + 1)), TEXT_SUBMODES[submode]) !== false))) && ((s == 3) || ((s == 0) && (submode == 1)))) {
                // shift (temporary change only for this char)
                if (s == 3) {
                  // shift to puntuaction
                  txtarr.push(29);
                } else {
                  // shift from lower to alpha
                  txtarr.push(27);
                }
              } else {
                // latch
                txtarr  = txtarr.concat(TEXT_LATCH[''+submode+s]);
                // set new submode
                submode = s;
              }
              // add characted code to array
              txtarr.push(k);
              break;
            }
          }
        }
      }
      var txtarrlen = txtarr.length;
      if ((txtarrlen % 2) != 0) {
        // add padding
        txtarr.push(29);
        ++txtarrlen;
      }
      // calculate codewords
      for (var i = 0; i < txtarrlen; i += 2) {
        cw.push((30 * parseInt(txtarr[i])) + parseInt(txtarr[(i + 1)]));
      }
      break;
    }
    case 901:
    case 924: { // Byte Compaction mode latch
      var rest;
      var sublen;
      var codelen;
      while ((codelen = code.length) > 0) {         
        if (codelen > 6) {
          rest = code.substring(6);
          code = code.substring(0, 6);
          sublen = 6;
        } else {            
          rest = '';
          sublen = code.length;
        }
        if (sublen == 6) {
          var t = bcmul(''+_ord(code.charAt(0)), '1099511627776');
          t = bcadd(t, bcmul('' + _ord(code.charAt(1)), '4294967296'));
          t = bcadd(t, bcmul('' + _ord(code.charAt(2)), '16777216'));
          t = bcadd(t, bcmul('' + _ord(code.charAt(3)), '65536'));
          t = bcadd(t, bcmul('' + _ord(code.charAt(4)), '256'));
          t = bcadd(t, '' + _ord(code.charAt(5)));
          do {
            var d = _my_bcmod(t, '900');
            t = bcdiv(t, '900');
            cw.unshift(d);
          } while (t != '0');
        } else {
          for (var i = 0; i < sublen; ++i) {
            cw.push(_ord(code.charAt(i)));
          }
        }
        code = rest;
      }
      break;
    }
    case 902: { // Numeric Compaction mode latch
      var rest;
      var codelen;
      while ((codelen = code.length) > 0) {
        if (codelen > 44) {
          rest = code.substring(44);
          code = code.substring(0, 44);
        } else {
          rest = '';
        }
        var t = '1' + code;
        do {
          var d = _my_bcmod(t, '900');
          t = bcdiv(t, '900');
          cw.unshift(d);
        } while (t != '0');
        code = rest;
      }
      break;
    }
    case 913: { // Byte Compaction mode shift
      cw.push(_ord(code));
      break;
    }
  }
  if (addmode) {
    // add the compaction mode codeword at the beginning
    cw.unshift(mode);
  }
  return cw;
};

/*==============================================================================================================================================*/

var _ord = function(string) {
  return string.charCodeAt(0);
};

/*==============================================================================================================================================*/

var _get_error_correction_level = function(ecl, numcw) {
  // get maximum correction level
  var maxecl = 8; // starting error level
  var maxerrsize = (928 - numcw); // available codewords for error
  while (maxecl > 0) {
    var errsize = (2 << ecl);
    if (maxerrsize >= errsize) {
      break;
    }
    --maxecl;
  }
  // check for automatic levels
  if ((ecl < 0) || (ecl > 8)) {
    if (numcw < 41) {
      ecl = 2;
    } else if (numcw < 161) {
      ecl = 3;
    } else if (numcw < 321) {
      ecl = 4;
    } else if (numcw < 864) {
      ecl = 5;
    } else {
      ecl = maxecl;
    }
  }
  if (ecl > maxecl) {
    ecl = maxecl;
  }
  return ecl;
};

/*==============================================================================================================================================*/

var _get_error_correction_word = function(cw, ecl) {
  // get error correction coefficients
  var ecc = RSFACTORS[ecl];
  // number of error correction factors
  var eclsize = (2 << ecl);
  // maximum index for RSFACTORS[ecl]
  var eclmaxid = (eclsize - 1);
  // initialize array of error correction codewords
  var ecw = _array_fill(0, eclsize, 0);
  // for each data codeword
  for (var k=0; k<cw.length;k++) {
    var t1 = (cw[k] + ecw[eclmaxid]) % 929;
    for (var j = eclmaxid; j > 0; --j) {
      var t2 = (t1 * ecc[j]) % 929;
      var t3 = 929 - t2;
      ecw[j] = (ecw[(j - 1)] + t3) % 929;
    }
    t2 = (t1 * ecc[0]) % 929;
    t3 = 929 - t2;
    ecw[0] = t3 % 929;
  }
  for (var j=0;j<ecw.length;j++) {
    if (ecw[j] != 0) {
      ecw[j] = 929 - ecw[j];
    }
  }       
  ecw = ecw.reverse();
  return ecw;
};

/*==============================================================================================================================================*/

var _array_fill = function(start_index, num, mixed_val) { 
  var key, tmp_arr = {};  

  if (start_index == 0) {
    var tmpArray = [];
    for (var i=0;i<num;i++) {
      tmpArray.push(mixed_val);
    }
    return tmpArray;
  }

    if (!isNaN(start_index) && !isNaN(num)) {
      for (key = 0; key < num; key++) {
        tmp_arr[(key + start_index)] = mixed_val;
      }
    }

    return tmp_arr;
};

/*==============================================================================================================================================*/

var _intval = function(mixed_var, base) {
  // http://kevin.vanzonneveld.net
  // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   improved by: stensi
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   input by: Matteo
  // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
  // +   bugfixed by: Rafał Kukawski (http://kukawski.pl)
  // *     example 1: intval('Kevin van Zonneveld');
  // *     returns 1: 0
  // *     example 2: intval(4.2);
  // *     returns 2: 4
  // *     example 3: intval(42, 8);
  // *     returns 3: 42
  // *     example 4: intval('09');
  // *     returns 4: 9
  // *     example 5: intval('1e', 16);
  // *     returns 5: 30
  var tmp;

  var type = typeof(mixed_var);

  if (type === 'boolean') {
    return +mixed_var;
  } else if (type === 'string') {
    tmp = parseInt(mixed_var, base || 10);
    return (isNaN(tmp) || !isFinite(tmp)) ? 0 : tmp;
  } else if (type === 'number' && isFinite(mixed_var)) {
    return mixed_var | 0;
  } else {
    return 0;
  }
};

/*==============================================================================================================================================*/

var _binary17 = function(number) {
  var padded = '00000000000000000' + new Number(number).toString(2);
  return padded.substring(padded.length - 17);
}

/*==============================================================================================================================================*/

var _array_search = function(needle, haystack, argStrict) {
  // http://kevin.vanzonneveld.net
  // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +      input by: Brett Zamir (http://brett-zamir.me)
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // *     example 1: array_search('zonneveld', {firstname: 'kevin', middle: 'van', surname: 'zonneveld'});
  // *     returns 1: 'surname'
  // *     example 2: ini_set('phpjs.return_phpjs_arrays', 'on');
  // *     example 2: var ordered_arr = array({3:'value'}, {2:'value'}, {'a':'value'}, {'b':'value'});
  // *     example 2: var key = array_search(/val/g, ordered_arr); // or var key = ordered_arr.search(/val/g);
  // *     returns 2: '3'

  var strict = !!argStrict,
    key = '';

  if (haystack && typeof haystack === 'object' && haystack.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
    return haystack.search(needle, argStrict);
  }
  if (typeof needle === 'object' && needle.exec) { // Duck-type for RegExp
    if (!strict) { // Let's consider case sensitive searches as strict
      var flags = 'i' + (needle.global ? 'g' : '') +
            (needle.multiline ? 'm' : '') +
            (needle.sticky ? 'y' : ''); // sticky is FF only
      needle = new RegExp(needle.source, flags);
    }
    for (key in haystack) {
      if (needle.test(haystack[key])) {
        return key;
      }
    }
    return false;
  }

  for (key in haystack) {
    if ((strict && haystack[key] === needle) || (!strict && haystack[key] == needle)) {
      return key;
    }
  }

    return false;
};

/*==============================================================================================================================================*/

var _my_bcmod = function(x, y) {
  // how many numbers to take at once? carefull not to exceed (int)
  var take = 5;    
  var mod = '';
  do {
      var a = parseInt(mod + '' + x.substring(0, take));
      x = x.substring(take);
      mod = a % y;   
  }
  while ( x.length );

  return parseInt(mod); 
};
