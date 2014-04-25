var desiredPace = null; // minutes / mile
var desiredDistance = null; // miles
var currentDistance = 0;
var currentPace = 0;
var remainingDistance = null;
var checkInterval = 5000;
var lastCheckTimeStamp;
var prevLatitude;
var prevLongitude;

function convertToRadian( number ){
  return number * Math.PI / 180;
}

function calculate_distance( latitude1, longitude1, latitude2, longitude2 ) {
        // using the Haversine formula
        var earthRadius = 3959; // Radius of the earth in miles
        //var earthRadiusKM = 6371; // Radius of the earth in KM
        var dLatitude = convertToRadian(latitude2 - latitude1);
        var dLongitude = convertToRadian(longitude2 - longitude1);
        var a = Math.sin(dLatitude / 2) * Math.sin(dLatitude / 2) + Math.cos(convertToRadian(latitude1)) * Math.cos(convertToRadian(latitude2)) * Math.sin(dLongitude / 2) * Math.sin(dLongitude / 2);
        var greatCircleDistance = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var distance = earthRadius * greatCircleDistance; // distance converted to miles from radians
        return distance;
}

function convertMetersPerSecondToMilesPerHour(mps) {
        var mph = ( mps * 3600 ) * 0.000621371192;
        return mph;
}

function minPerMileToMilesPerHour(mpm){
  var mph;
  if( !isNaN( mpm ) && mpm > 0 ) {
    mph = 60 / mpm;
  }
  return mph;
}

function pickUpThePace(){
  console.log("Faster fool!");
  $("input[name='desiredSpeed']").val("Faster!! : " + " " + " " + currentPace);
}

function runComplete(){
  console.log("Run complete!");
}

function call_check( position ){
  var segmentTime = Date.parse( new Date() ) - lastCheckTimeStamp;
  var segmentDistance = ( prevLatitude === undefined || prevLongitude === undefined ) ? null : calculate_distance( prevLatitude, prevLongitude, position.coords.latitude, position.coords.longitude );
  currentDistance = ( segmentDistance === null ) ? currentDistance : currentDistance + segmentDistance;
  remainingDistance = desiredDistance - currentDistance;
  
  if( remainingDistance <= 0 ){
    runComplete();
  }

  if ( true ){//(position.coords.speed === null) || (isNaN(position.coords.speed))) {
    // cant use speed
    currentPace = ( segmentDistance / ( segmentTime / 3600000 ) ) / 60;
  } else {
    currentPace = ( convertMetersPerSecondToMilesPerHour( position.coords.speed ) ) / 60; 
    console.log( "Current Pace: " + currentPace );
  }


  // Set the current latitude and longitude to the previous, to calc the next segment
  prevLatitude = position.coords.latitude;
  prevLongitude = position.coords.longitude;

}

function gMapInit(){
  var google_tile = "http://maps.google.com/maps/api/staticmap?sensor=false&center=-34.397,150.644&zoom=8&size=300x400";
  jQuery("#googleMap").html(
      jQuery(document.createElement("img")).attr("src", google_tile)
  );
}

    var watchProcess = null;

function initiate_watchlocation() {
  lastCheckTimeStamp = Date.parse( new Date() );
  desiredPace = $("input[name='desiredPace']").val(); // minutes / mile
  console.log("Desired Pace: " + desiredPace );
  desiredDistance = $("input[name='desiredDistance']").val(); // miles
  console.log("Desired Distance: " + desiredDistance );
  checkInterval = $("input[name='desiredSpeed']").val() || 5000; //5s default value
  lastCheckTimeStamp = lastCheckTimeStamp || Date.parse( new Date() ); // if lastCheckTimeStamp is not set, set it to the current time in ms. 

  if (watchProcess === null) {
      watchProcess = navigator.geolocation.watchPosition(handle_geolocation_query, handle_errors, {'enableHighAccuracy':true,'timeout':10000,'maximumAge':0});
  }
  
  setInterval(function(){
        console.log("Hello");
        // Check pace
        //checkPace( currentPace, desiredPace );
        if( currentPace < desiredPace ){
          pickUpThePace();
          console.log("Your current pace is:" + " " + currentPace);
        }

  }, 3000);

}

function stop_watchlocation() {
  if (watchProcess !== null){
    navigator.geolocation.clearWatch(watchProcess);
    watchProcess = null;
  }
}

function handle_errors(error){
    switch(error.code){
        case error.PERMISSION_DENIED: alert("user did not share geolocation data");
        break;

        case error.POSITION_UNAVAILABLE: alert("could not detect current position");
        break;

        case error.TIMEOUT: alert("retrieving position timedout");
        break;

        default: alert("unknown error");
        break;
    }
}

function handle_geolocation_query( position ) {
        //compare lastCheckTimeStamp and see if it has been checkInterval since then, if so, run message, and update timestamp
        var currentTime = Date.parse( new Date() );
        if( currentTime - checkInterval >= lastCheckTimeStamp ){
                call_check( position );
    lastCheckTimeStamp = Date.parse( new Date() );
        }

  var text = "";
  text += "position.coords.latitude: "  + position.coords.latitude  + "<br/>";
  text += "position.coords.longitude: " + position.coords.longitude + "<br/>";
  text += "position.coords.altitude: " + position.coords.altitude + "<br/>";
  text += "position.coords.accuracy(meters): "  + position.coords.accuracy  + "<br/>";
  text += "position.coords.altitudeAccuracy(meters): "  + position.coords.altitudeAccuracy  + "<br/>";
  text += "position.coords.heading: "  + position.coords.heading  + "<br/>";
  text += "position.coords.speed: "  + position.coords.speed  + "<br/>";
  text += "position.timestamp: " + new Date(position.timestamp) + "<br/>";
  text += "Current pace: " + currentPace + "<br/>";
  text += "Desired pace: " + desiredPace + "<br/>";
  text += "Current distance: " + currentDistance + "<br/>";
  text += "Current pace: " + currentPace + "<br/>";
  jQuery("#APIReturnValues").html(text);
  jQuery("#APIReturnValues").css("border","3px solid green");

  var image_url = "http://maps.google.com/maps/api/staticmap?sensor=false&center=" + position.coords.latitude + ',' + position.coords.longitude +
                  "&zoom=14&size=300x400&markers=color:blue|label:S|" + position.coords.latitude + ',' + position.coords.longitude;
  
  jQuery("#googleMap").html(
      jQuery(document.createElement("img")).attr("src", image_url)
  );
}

jQuery(window).ready(function(){
  gMapInit();
  jQuery("#watchPositionBtn").click( initiate_watchlocation );
  jQuery("#stopWatchBtn").click( stop_watchlocation );
});