/*
 Maps — Google Maps APIv3 wrapper with OSM, Yandex and 2GIS layers support
 Version 21.05.13 by yurik@unix.am
 
 Methods: createMap, createMarker, createDraggableMarker, codeAddress
*/

// OSM
var osmMap = new google.maps.ImageMapType({
 getTileUrl: function(ll, z) {
  var x = ll.x % (1 << z);
  return "http://tile.openstreetmap.org/" + z + "/" + x + "/" + ll.y + ".png";
 },
 tileSize: new google.maps.Size(256, 256),
 isPng: true,
 maxZoom: 18,
 name: "OSM",
 alt: "OpenStreetMap"
});
// 2GIS
var gisMap = new google.maps.ImageMapType({
 getTileUrl: function(ll, z) {
  return "http://tile0.maps.2gis.com/tiles?x=" + ll.x + "&y=" + ll.y + "&z=" + z + "&v=31";
 },
 tileSize: new google.maps.Size(256, 256),
 isPng: true,
 maxZoom: 18,
 name: "2GIS",
 // alt: "2GIS"
});
// Yandex
var projectionYandexPrototype = function(){
 function atanh(x){
  return 0.5*Math.log((1+x)/(1-x));
 };
 function degreesToRadians(deg) {
  return deg * (Math.PI / 180);
 };
 function radiansToDegrees(rad) {
  return rad / (Math.PI / 180);
 };
 function bound(value, opt_min, opt_max) {
  if(opt_min != null) value = Math.max(value, opt_min);
  if(opt_max != null) value = Math.min(value, opt_max);
  return value;
 };
 this.prototype.MERCATOR_RANGE = 256;
 this.prototype.fromLatLngToPoint = function(latLng) {
  var me = this;
  var point = new google.maps.Point(0, 0);
  var origin = me.pixelOrigin_;
  var siny = bound(Math.sin(degreesToRadians(latLng.lat())), -0.9999, 0.9999);
  point.x = origin.x + latLng.lng() *me.pixelsPerLonDegree_;
  var exct = 0.0818197;
  var z = Math.sin(latLng.lat()/180*Math.PI);
  point.y = Math.abs(origin.y - me.pixelsPerLonRadian_*(atanh(z)-exct*atanh(exct*z)));
  return point;
 };
 this.prototype.fromPointToLatLng = function(point) {
  var me = this;
  var origin = me.pixelOrigin_;
  var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
  var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
  var lat = Math.abs((2*Math.atan(Math.exp(latRadians))-Math.PI/2)*180/Math.PI);
  var Zu = lat/(180/Math.PI);
  var Zum1 = Zu+1;
  var exct = 0.0818197;
  var yy = -Math.abs(((point.y)-128));
  while (Math.abs(Zum1-Zu)>0.0000001){
   Zum1 = Zu;
   Zu = Math.asin(1-((1+Math.sin(Zum1))*Math.pow(1-exct*Math.sin(Zum1),exct))/(Math.exp((2*yy)/-(256/(2*Math.PI)))*Math.pow(1+exct*Math.sin(Zum1),exct)));
  }
  if(point.y>256/2) {
   lat=-Zu*180/Math.PI;
  } else {
   lat=Zu*180/Math.PI;
  }
  return new google.maps.LatLng(lat, lng);
 };
};
var projectionYandex = function () {
 this.pixelOrigin_ = new google.maps.Point(128,128);
 this.pixelsPerLonDegree_ = this.MERCATOR_RANGE / 360;
 this.pixelsPerLonRadian_ = this.MERCATOR_RANGE / (2 * Math.PI);
};
var yandexMap = new google.maps.ImageMapType({
 getTileUrl: function(coord, zoom) {
  return "http://vec0"+((coord.x+coord.y)%5)+".maps.yandex.net/tiles?l=map&v=2.16.0&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "";
 },
 tileSize: new google.maps.Size(256, 256),
 isPng: true,
 // alt: 'Показать карту Яндекса',
 name: 'Yandex',
 maxZoom: 17,
 minZoom:0
});
yandexMap.projection = (function(projection) {
 projectionYandexPrototype.call(projection);
 return new projection(projection);
})(projectionYandex);

// Place
function Place() {
 var map;
 var geocoder;
}
Place.prototype = {
 createMap: function (elementId, point, zoom, type) {
  type = typeof type !== 'undefined' ? type : 'osm';
  //var point = new google.maps.LatLng(lat, lng);
  var mapOptions = {
   zoom: zoom,
   center: point,
   mapTypeControlOptions: {
    mapTypeIds: ['osm', 'yandex', '2gis', google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.TERRAIN],
    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
   },
   mapTypeId: type // osm | yandex | google.maps.MapTypeId.ROADMAP
  }
  var map = new google.maps.Map(document.getElementById(elementId), mapOptions);
  map.mapTypes.set('osm', osmMap);
  map.mapTypes.set('yandex', yandexMap);
  map.mapTypes.set('2gis', gisMap);
  this.geocoder = new google.maps.Geocoder();
  /*
  var control = document.createElement('div'); 
  control.innerHTML = 'sdsdsdsddd';
  control.style.width='100px';
  control.style.height='100px';
  google.maps.event.addDomListener(control, 'click', function() {alert(1);});
  control.index = 1;   
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(control); 
  //controlText.innerHTML = '<strong>Home</strong>';
  //controlUI.appendChild(controlText);
  */
  this.map = map;
  return map;
 },
 createMarker: function (point, title, content) {
  title = typeof title !== 'undefined' ? title : '';
  var marker = new google.maps.Marker({
   position: point,
   map: this.map,
   title: title
  });
  if(typeof content !== 'undefined') {
   var map = this.map;
   google.maps.event.addListener(marker, 'click', function(e) {
       var infowindow = new google.maps.InfoWindow({
           content: content, 
           position: marker.position,
       });      
       infowindow.open(map, marker);       
       });
   /*var infoWindow = new google.maps.InfoWindow({
    content: content
   });*/
  }
  return marker;
 },
 createDraggableMarker: function (point, title, elementId) {
  var element = document.getElementById(elementId);
  // set point by element value
  var value = element.value.split(',');
  if (value.length == 2) {
   lat = value[0];
   lng = value[1];
  }
  // element.addEventListener('change', function() {alert(1)});
  var marker = this.createMarker(point, title);
  marker.setDraggable(true);
  this.map.setCenter(marker.getPosition());
  google.maps.event.addListener(marker, 'dragstart', function() {
   // start dragging marker
  });
  google.maps.event.addListener(marker, 'drag', function() {
   // dragging marker
  });
  google.maps.event.addListener(marker, 'dragend', function() {
   var ll = marker.getPosition();
   var llString = [ll.lat(),ll.lng()].join(', ');
   typeof element.value !== 'undefined' ? element.value = llString : element.innerHTML = llString;
   // end dragging marker
  });
  return marker;
 },
 redraw: function() {
  var center = this.map.getCenter();
  google.maps.event.trigger(this.map, 'resize');
  this.map.setCenter(center);
 },
 geocodeMarker: function(marker, address) {
  var map = this.map;
  var isCoordinates = /^\d+\.?\d*\s*,\s*\d+\.?\d*$/;
  if(address.test(isCoordinates)) {
   var value = address.split(',');
   if (value.length == 2) {
	marker.setPosition(new google.maps.LatLng(value[0], value[1]));
   }
   return;
  }
  this.geocoder.geocode( { 'address': address}, function(results, status) {
   if (status == google.maps.GeocoderStatus.OK) {
    map.setCenter(results[0].geometry.location);
    marker.setPosition(results[0].geometry.location);
    google.maps.event.trigger(marker, 'drag');
	google.maps.event.trigger(marker, 'dragend');
   } else {
    // alert("Geocode was not successful for the following reason: " + status);
   }
  });
 }
};
