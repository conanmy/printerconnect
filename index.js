var express = require('express');
var escpos = require('escpos');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.options('/print', function(req, res) {
  res.send('ok');
});

// respond with "hello world" when a GET request is made to the homepage
app.post('/print', function (req, res) {
  var commands = req.body.commands;
  try {
    // Select the adapter based on your printer type
    var device  = new escpos.USB();
    // const device = new escpos.Serial('XPSPort:');
    // const device  = new escpos.Network('localhost');

    var printer = new escpos.Printer(device);

    device.open(function() {
      commands.map(function(command) {
        console.log(command);
        printer[command[0]].apply(printer, command.slice(1));
      });
      console.log('done');
      res.status(200).send('Success');
    });
  } catch(err) {
    console.log(err);
    res.status(500).send(err.toString());
  }
});

app.listen(3000, function(err) {
  console.log("print command listener started");
});