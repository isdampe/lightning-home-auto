#!/usr/bin/env node

var fs = require('fs');
var express = require('express');
var wpi = require('wiring-pi');
var exec = require('child_process').exec;
var pins = {};
var pinsKeys = {};

try {
  var config = JSON.parse(fs.readFileSync('config.json',{encoding:"utf8"}));
} catch(e) {
  console.error("Invalid or missing config.json");
  process.exit(1);
}

var app = express();
wpi.setup('wpi');

//Web socket.
var expressWs = require('express-ws')(app);
var wsI = expressWs.getWss();

//Accept requests for WS.
app.ws('*',function(ws,req){});

//Open GPIO for writing.
for ( var i=1; i<=config.pins; i++ ) {
  wpi.pinMode(i,wpi.OUTPUT);
  pins[i] = 0;
  wpi.digitalWrite(i,1);
}

//Server static files.
app.use(express.static('../front-end'));

//require('./controllers/cron.js')(app,toggleSwitch);

app.get('/list', function(req,res){
  res.end(JSON.stringify(pinsKeys));
});

app.get('/shutdown', function(req,res){
  exec('/sbin/init 0');
	res.end('Shutting down!');
})

app.get('/restart', function(req,res){
  exec('/sbin/reboot now');
  res.end('Rebooting!');
})

app.get('/switch*', function(req,res){

  if ( typeof req.query === 'undefined' || typeof req.query.sw === 'undefined' || typeof req.query.st === 'undefined' ) {
    res.status(400);
    res.end('Missing arguments');
    return false;
  }

  toggleSwitch(req.query.sw, req.query.st, function(status){
    if ( status === true ) {
      res.status(200);
      res.end('1');
    } else {
      res.status(500);
      res.end('-1');
    }
  });

  return true;

});

app.listen(config.port, function () {
  console.log('HTTP listening on port ' + config.port);
});

function toggleSwitch(sw,status,callback) {

  //Do GPIO things.
  var gs = sw.split("__");
  if ( gs.length < 2 ) {
    console.error("Request received with no switch group");
    callback(false);
    return false;
  }
  var group = gs[0];
  var swName = gs[1];

  if (! config.switches.hasOwnProperty(group) || ! config.switches[group].hasOwnProperty(swName) ) {
    console.error('Request received with switches or groups not defined in config.json');
    callback(false);
    return false;
  }

  //Do GPIO things.
  var pin = config.switches[group][swName];
  var val = 0;
  //console.log("Set pin " + pin + " to " + status);

  if ( status === "off" ) {
    val = 1;
  }

  wpi.digitalWrite(pin,val);
  pins[pin] = val;
  //console.log(pins);

  //Update my internal store.
  pinsKeys[sw] = status;
  //console.log(pinsKeys);

  wsI.clients.forEach(function (client) {
    client.send(JSON.stringify({
      sw: sw,
      status: status
    }));
  });

  if ( typeof callback !== 'undefined' ) {
    callback(true);
  }

};
