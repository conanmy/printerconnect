let express = require('express');
let escpos = require('escpos');
let cors = require('cors');
let bodyParser = require('body-parser');
let app = express();

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
  let commands = req.body.commands;
  console.log(commands);
  try {
    // Select the adapter based on your printer type
    const device  = new escpos.USB();
    // const device  = new escpos.Network('localhost');
    // const device  = new escpos.Serial('/dev/usb/lp0');

    const printer = new escpos.Printer(device);

    device.open(function() {
      commands.map(function(command) {
        console.log(command);
        printer = printer[command[0]].apply(this, command.slice(1));
      });
      console.log('done');
      res.status(200).send('Success');
    });
  } catch(err) {
    res.status(500).send(err.toString());
  }
});

app.listen(3000, function(err) {
  console.log("print command listener started");
});