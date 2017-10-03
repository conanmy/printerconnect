let express = require('express');
let escpos = require('escpos');
let app = express();

// respond with "hello world" when a GET request is made to the homepage
app.all('/print', function (req, res) {

  // Select the adapter based on your printer type
  const device  = new escpos.USB();
  // const device  = new escpos.Network('localhost');
  // const device  = new escpos.Serial('/dev/usb/lp0');

  const printer = new escpos.Printer(device);

  device.open(function() {
    printer
    .font('a')
    .align('ct')
    .style('bu')
    .size(1, 1)
    .text('The quick brown fox jumps over the lazy dog')
    .cut()
    .cashdraw(5);
  });
  console.log('done');
  console.log(device);
});

app.listen(3000, function(err) {
  console.log("print command listener started");
});