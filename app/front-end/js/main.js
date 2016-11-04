( function() {

  core = this;
  window.core = this;
  core.debug = true;
  core.baseUrl = "/switch/";
  core.connection = null;

  core.request = function( switchname, state, ignoreServer ) {

    var postTo = core.baseUrl + '?sw=' + switchname + '&st=' + state;

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
      if ( xmlhttp.readyState == XMLHttpRequest.DONE ) {
        if ( xmlhttp.status == 200 ) {
          core.log( "Response: " + xmlhttp.responseText );
        } else {
          core.error( "Res error: " + xmlhttp.status );
        }
      }
    };

    xmlhttp.open( "GET", postTo, true );
    xmlhttp.send();

  };

  core.toggleSwitch = function( e, el ) {
    if ( typeof e !== 'undefined' && e !== false ) e.preventDefault();
    if ( typeof el === 'undefined' ) el = this;

    var sw = el.name;
    var val = el.checked;
    var onoff = "on";

    if ( val === true ) {
      onoff = 'on';
    } else {
      onoff = 'off';
    }

    core.log( 'Setting ' + sw + ' to ' + onoff );
    core.request( sw, onoff );

  };

  core.log = function( msg ) {
    if ( core.debug !== true ) return;
    console.log( msg );
  }

  core.error = function( msg ) {
    if ( core.debug !== true ) return;
    console.error( msg );
  }

  core.toggleGroup = function( e ) {
    if ( typeof e !== 'undefined' ) e.preventDefault();

    var group = this.getAttribute( 'data-switch-all' );
    var btns = document.querySelectorAll( '[data-group=' + group + '] [data-switch=true]' );
    var totalH = btns.length / 2;
    var totalOn = 0;
    var direction = true;

    for ( var i = 0; i < btns.length; i++ ) {
      if ( btns[ i ].checked == true ) {
        totalOn++;
      }
    }

    if ( totalOn >= totalH ) {
      direction = false;
    }

    for ( var i = 0; i < btns.length; i++ ) {
      btns[ i ].checked = direction;
      core.toggleSwitch( false, btns[ i ] );
    }

  };

  core.setSwitchEmulated = function(el,stat) {

    var chk = ( stat == "on" ? true : false );

    el.checked = chk;

  };

  core.handleServerUpdate = function(e) {

    var res;

    try {
      res = JSON.parse(e.data);
    } catch(e) {
      console.error('Invalid data packet over websocket, ' + e.data);
      return false;
    }

    var btn = document.querySelector('[name=' + res.sw + ']');
    if (! btn ) {
      console.error('Could not find relative element from server update');
      console.error(res.sw);
      return false;
    }

    core.setSwitchEmulated(btn,res.status);

  };

  core.manageInitialServerLoad = function(data) {

    var obj;

    try {
      obj = JSON.parse(data);
    } catch(e) {
      console.error('Invalid initial server load data');
      return false;
    }

    for ( var key in obj ) {
      if ( obj.hasOwnProperty(key) ) {
        core.handleServerUpdate({
          data: JSON.stringify({
            sw: key,
            status: obj[key]
          })
        });
      }
    }

  };

  core.getInitialStatus = function() {
    //Request initial switch status.
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
      if ( xmlhttp.readyState == XMLHttpRequest.DONE ) {
        if ( xmlhttp.status == 200 ) {
          core.manageInitialServerLoad(xmlhttp.responseText);
        } else {
          core.error( "Res error: " + xmlhttp.status );
        }
      }
    };

    xmlhttp.open( "GET", '/list', true );
    xmlhttp.send();
  }

  core.main = function() {

    var buttons = document.querySelectorAll( '[data-switch=true]' );
    for ( var i = 0; i < buttons.length; i++ ) {
      buttons[ i ].addEventListener( 'change', core.toggleSwitch );
    }

    var toggleAlls = document.querySelectorAll( '[data-switch-all]' );
    for ( var i = 0; i < toggleAlls.length; i++ ) {
      toggleAlls[ i ].addEventListener( 'click', core.toggleGroup );
      toggleAlls[ i ].addEventListener( 'touchstart', core.toggleGroup );
    }

    //Websocket.
    var loc = window.location, new_uri;
    if (loc.protocol === "https:") {
        new_uri = "wss:";
    } else {
        new_uri = "ws:";
    }
    new_uri += "//" + loc.host;
    core.connection = new WebSocket(new_uri,['soap','xmpp']);

    // When the connection is open, send some data to the server
    core.connection.onopen = function () {
      connection.send('HELO'); // Send the message 'Ping' to the server
    };

    // Log errors
    core.connection.onerror = function (error) {
      console.error('WS error');
      console.error(error);
    };

    // Log messages from the server
    core.connection.onmessage = function (e) {
      console.log('Websocket data received');
      console.log(e.data);
      core.handleServerUpdate(e);
    };

    core.getInitialStatus();
    window.setInterval(core.getInitialStatus,30000);

  };

  core.main();

} )();
