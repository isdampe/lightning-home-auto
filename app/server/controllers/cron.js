var fs = require('fs');
var cron = require('node-cron');

module.exports = function(app,toggleSwitch) {

  'use strict';

  var tasks = {};

  try {
    tasks = JSON.parse( fs.readFileSync('cron.json', {encoding:"utf8"}) );
  } catch(e) {
    console.error('No cron.json or corrupt cron.json. No tasks to preload.');
  }

  var onLoad = function() {

    var k;

    for ( k in tasks ) {
      console.log('Initial cron task load ' + tasks[k].name);
      cronLoadJob(tasks[k].guid);
    }

  };

  var saveCronTasks = function() {
    try {
      fs.writeFileSync('cron.json',JSON.stringify(tasks),{encoding:"utf8"});
    } catch(e){
      console.error('Could not write to cron.json');
    }
  };

  var processTask = function(task) {

    console.log('Cron processing ' + task.name + ' because of cron trigger');
    var actions = [];

    var ex = task.switches.split(",");
    if ( ex.length <= 1 ) {
      ex = [ task.switches ];
    }

    for ( var i=0; i<ex.length; i++ ) {
      let sp = ex[i].split(':');
      if ( sp.length < 2 ) {
        console.error('Switch statement on cron job does not specify on or off');
        return false;
      }

      let sg = sp[0], pm = sp[1]; //sg = gaze__feature, pm = on / off

      let switchName = sg;
      let switchStatus = sp[1];

      actions.push({
        switchTrigger: switchName,
        direction: switchStatus
      });

    }

    for ( var i=0; i<actions.length; i++ ) {
      console.log('Call cron ' + actions[i]);
      toggleSwitch(actions[i].switchTrigger, actions[i].direction);
    }

  };

  var cronLoadJob = function(guid) {

    tasks[guid].task = cron.schedule(tasks[guid].time, function(){
      processTask(tasks[guid]);
    });
    tasks[guid].task.start();

  };

  app.get('/cron/list*', function(req,res) {

    var listOfTasks = {};
    for ( var key in tasks ) {
      listOfTasks[key] = {
        name: tasks[key].name,
        time: tasks[key].time,
        switches: tasks[key].switches,
        guid: tasks[key].guid
      };
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(listOfTasks));
  });

  app.get('/cron/delete*', function(req,res){

    if ( typeof req.query.cronID === 'undefined' ) {
      res.status(400);
      res.end('No cronID provided.');
      return false;
    }

    if (! tasks.hasOwnProperty(req.query.cronID) ) {
      res.status(500);
      res.end('No cron job with that ID exists.');
      return false;
    }

    delete tasks[req.query.cronID];
    saveCronTasks();
    res.end('Cron task deleted.');

  });

  /*
   * Example url
   * /cron/crate
   * Data:
   * name: Turn on deck lights automatically
   * time: 0 6 * * *
   * switches: gazebo__decklighting1:on,gazebo__decklighting2:on
   */
  app.get('/cron/create*', function(req,res){

    if ( typeof req.query.name === 'undefined' || typeof req.query.time === 'undefined' || typeof req.query.switches === 'undefined' ) {
      res.status(400);
      res.end('Missing arguments');
      return false;
    }

    var job = {
      name: req.query.name,
      time: req.query.time,
      switches: req.query.switches,
      guid: new Date().getTime()
    };

    tasks[job.guid] = job;
    saveCronTasks();
    cronLoadJob(job.guid);
    res.status(200);
    res.end('Cron job created');

  });

  //Preload cron.
  onLoad();

};
