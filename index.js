var escpos = require('escpos');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http, { path: '/socket'});
var posLink = require('./posLink');

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

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('Purchase', function (payload) {
    console.log('Purchase message received.')
    var host = payload.host;
    var port = payload.port;
    var purchaseAmount = payload.purchaseAmount;
    var cashOut = payload.cashOut;
    var processing = false;
    function emitFailMessage(message) {
      if (processing === true && client) {
        console.log(message);
        socket.emit('purchaseFailed', {
          message: message
        });
        processing = false;
        client.destroy();
      }
    }
    if (host && port && purchaseAmount) {
      var client = posLink.createPosConnection(host, port, function() {
        client.write(
          posLink.makeCommandLine(
            posLink.makePurchaseCommand(purchaseAmount, cashOut)
          )
        );
        console.log('Message send to eftpos.')
        processing = true;
      });
      client.on('data', function(data) {
        console.log('Received: ' + data);
        if (data.indexOf("WAIT") > 0 || data.indexOf("REFUND")> 0 || data.indexOf("REMOVE") > 0)
        {
          client.write('\6');
        } else if (data.indexOf("DECLINED") > 0 || data.indexOf("CANCELLED")> 0
          || data.indexOf("INVALID")> 0 || data.indexOf("INCORRECT")> 0 || data.indexOf("PIN TRIES EXCEEDED") > 0) {
          client.write('\6');
          emitFailMessage('Transaction error');
        } else if (data.indexOf("ACCEPTED") > 0) {
           client.write('\6');
           socket.emit('purchaseSuccess');
        } else if (data.indexOf("SIGNATURE OK") > 0) {
          client.write('\6');
          client.write(posLink.makeSignCommand());
        }
      });
      client.on('error', function (err) {
        emitFailMessage(err.toString());
      });
      setTimeout(function() {
        console.log('time out');
        emitFailMessage('Eftpos connector transaction timeout: 180000');
      }, 180000);
    } else {
      socket.emit('purchaseFailed', {
        message: 'No host, port, or purchaseAmount in purchase request payload.'
      });
    }
  });
});

http.listen(3000, function(err) {
  console.log("print command started listening on port 3000");
});