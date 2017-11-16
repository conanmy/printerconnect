var net = require('net');

const POLL_COMMAND = '123456,POL,1,2.4,A1 POS Company,The POS of POS,1.2.34,,N,a1g4ef26\3';
const MY_SIGN = '432234,PRT,1,POS,1,NYYNYY,CORYS FISHING,\3';
let accumulateTransNo = 0;

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

function makeTransactionNumber() {
  var coverZeros = '000000';
  accumulateTransNo = accumulateTransNo + 1;
  var numStr = accumulateTransNo + '';
  return coverZeros.slice(0, 6 - numStr.length) + numStr;
}

module.exports = {
  makePurchaseCommand(amount, cashAmount) {
    var amountStr = makePurchaseCommandNumber(amount);
    var cashAmountStr = cashAmount ? makePurchaseCommandNumber(cashAmount) : '000000.00';
    return makeTransactionNumber + ',PUR,1,' + amountStr + ',' + cashAmountStr + ',POS 1,YYYNYY,,\3';
  },
  makeCommandLine(command) {
    return '\2' + command + calculateLRC(command);
  },
  makeSignCommand() {
    return this.makeCommandLine(MY_SIGN);
  },
  createPosConnection(host, port, callback) {
    return net.createConnection({ port: port, host: host}, () => {
      //'connect' listener
      console.log('connected to server!');
      callback();
    });
  }
};