var net = require('net');

function convertStringToArrayBuffer(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}

function calculateLRC(str) {
  var buffer = convertStringToArrayBuffer(str);
  var lrc = 0;
  for (var i = 0; i < str.length; i++) {
      lrc = (lrc ^ buffer[i]) & 0xFF;
  }
  return String.fromCharCode(lrc);
}

function makePurchaseCommandNumber(num) {
  var coverZeros = '00000000';
  var numStr = Number(num).toFixed(2);
  return coverZeros.slice(0, 9 - numStr.length) + numStr;
}

module.exports = {
  makePurchaseCommand(amount, cashAmount) {
    var amountStr = makePurchaseCommandNumber(amount);
    var cashAmountStr = cashAmount ? makePurchaseCommandNumber(cashAmount) : '000000.00';
    return 'PUR,1,' + amountStr + ',' + cashAmountStr + ',\3';
  },
  makeCommandLine(command) {
    return '\2' + command + calculateLRC(command);
  },
  createPosConnection(host, port, callback) {
    return net.createConnection({ port: port, host: host}, () => {
      //'connect' listener
      console.log('connected to server!');
      callback();
    });
  }
};