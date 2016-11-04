( function() {

  core = this;
  window.core = this;
  core.debug = true;
  core.baseUrl = "/switch/";

  core.request = function( switchname, state ) {

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

  };

  core.main();

} )();
