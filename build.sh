#!/bin/sh

preprocess barcodes.inc > barcodes.js
uglifyjs barcodes.js > barcodes.min.js
