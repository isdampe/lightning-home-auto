var fs = require('fs');
var express = require('express');
var wpi = require('wiring-pi');
var pins = {};

try {
  var config = JSON.parse(fs.readFileSync('config.json',{encoding:"utf8"}));
} catch(e) {
  console.error("Invalid or missing config.json");
  process.exit(1);
}

var app = express();
wpi.setup('wpi');

//Open GPIO for writing.
for ( var i=1; i<=config.pins; i++ ) {
  wpi.pinMode(i,wpi.OUTPUT);
  pins[i] = 0;
}

//Server static files.
app.use(express.static('../front-end'));

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
  var gs = sw.split("|");
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
  var val = 1;
  console.log("Set pin " + pin + " to " + status);

  if ( status === "off" ) {
    val = 0;
  }

  wpi.digitalWrite(pin,val);
  pins[pin] = val;
  console.log(pins);

  callback(true);

};
