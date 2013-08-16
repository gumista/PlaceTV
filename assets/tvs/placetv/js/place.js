/*
	Place — Google Maps API3 wrapper
	Version 16.08.13 by Yurik Dertlyan, yurik@unix.am
	
	Maps:
		roadmap, satellite, hybrid, terrain, yandex, yandex.s, yandex.p, 2gis, osm
	Methods:
		createMarker(point, title, content)
		createDraggableMarker(point, title, elementId)
		geocodeMarker()
		redraw()
*/
function Place(elementId, point, zoom, type, typeIds) {
	var map;
	var geocoder;
	type = typeof type !== 'undefined' ? type : 'osm';
	typeIds = typeof typeIds !== 'undefined' ? typeIds : ['osm', 'roadmap', 'yandex', '2gis'];
	var mapOptions = {
		zoom: zoom,
		center: point,
		mapTypeControlOptions: {
			mapTypeIds: typeIds,
			style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
		},
		mapTypeId: type
	}
	this.map = new google.maps.Map(document.getElementById(elementId), mapOptions);
	this.map.mapTypes.set('osm', this.createMapType('osm'));
	this.map.mapTypes.set('yandex', this.createMapType('yandex'));
	this.map.mapTypes.set('yandex.s', this.createMapType('yandex.s'));
	this.map.mapTypes.set('yandex.p', this.createMapType('yandex.p'));
	this.map.mapTypes.set('2gis', this.createMapType('2gis'));
	this.geocoder = new google.maps.Geocoder();
}
Place.prototype = {
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
		// element.addEventListener('change', function() {});
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
		});
		return marker;
	},
	redraw: function() {
		var center = this.map.getCenter();
		google.maps.event.trigger(this.map, 'resize');
		this.map.setCenter(center);
	},
	isLatLng: function(string) {
		var regexp = new RegExp("/^\d+\.?\d*\s*,\s*\d+\.?\d*$/");
		return regexp.test(string);
	},
	geocodeMarker: function(marker, address, geocoder) {
		// set defoult geocoder
		geocoder = typeof geocoder !== 'undefined' ? geocoder : 'google';
		var map = this.map;
		if(this.isLatLng(address)) {
			var value = address.split(',');
			if (value.length == 2) {
				marker.setPosition(new google.maps.LatLng(value[0], value[1]));
			}
			return;
		}
		if(geocoder == 'yandex') { // yandex geocoder
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open('GET', 'https://geocode-maps.yandex.ru/1.x/?format=json&results=1&geocode=' + encodeURIComponent(address), true);
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState == 4) {
					if(xmlhttp.status == 200) {
						var data = JSON.parse(xmlhttp.responseText);
						if(data.response.GeoObjectCollection.metaDataProperty.GeocoderResponseMetaData.found > 0) {
							var pos = data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos;
							var value = pos.split(' ');
							if (value.length == 2) {
								latlng = new google.maps.LatLng(value[1], value[0]);
								marker.setPosition(latlng);
								map.setCenter(latlng);
							}
						}
					}
				}
			};
			xmlhttp.send(null);
		}
		else { // google geocoder
			this.geocoder.geocode( { 'address': address}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					map.setCenter(results[0].geometry.location);
					marker.setPosition(results[0].geometry.location);
					google.maps.event.trigger(marker, 'drag');
					google.maps.event.trigger(marker, 'dragend');
				} else {
					// console.log("Not successful geocoding for the following reason: " + status);
				}
			});
		}
	},
	renameMap: function (id, name, alt) {
		var map = this.map.mapTypes.get(id);
		if(map) {
			map.name = name;
			if(typeof alt !== 'undefined') map.alt = alt;
		}
	},
	createMapType: function(name) {
		var mapType;
		switch(name) {
			case 'osm': // OSM
				mapType = new google.maps.ImageMapType({
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
			break;
			case '2gis': // 2GIS
				mapType = new google.maps.ImageMapType({
					getTileUrl: function(ll, z) {
						return "http://tile0.maps.2gis.com/tiles?x=" + ll.x + "&y=" + ll.y + "&z=" + z; // + "&v=31";
					},
					tileSize: new google.maps.Size(256, 256),
					isPng: true,
					maxZoom: 18,
					name: "2GIS",
					// alt: "2GIS"
				});
			break;
			case 'yandex':
				mapType = new google.maps.ImageMapType({
					getTileUrl: function(ll, zoom) {
						return "http://vec0"+((ll.x+ll.y)%5)+".maps.yandex.net/tiles?l=map&x=" + ll.x + "&y=" + ll.y + "&z=" + zoom; // &v=2.44.0
					},
					tileSize: new google.maps.Size(256, 256),
					isPng: true,
					maxZoom: 17,
					minZoom: 0,
					name: 'Яндекс',
					// alt: 'Показать карту Яндекса',
				});
				mapType.projection = (function(projection) {
					projectionYandexPrototype.call(projection);
					return new projection(projection);
				})(projectionYandex);
				return mapType;
			break;
			case 'yandex.s':
				mapType = new google.maps.ImageMapType({
					getTileUrl: function(ll, zoom) {
						return "http://sat0"+((ll.x+ll.y)%5)+".maps.yandex.net/tiles?l=sat&x=" + ll.x + "&y=" + ll.y + "&z=" + zoom; // &v=2.44.0
					},
					tileSize: new google.maps.Size(256, 256),
					isPng: true,
					maxZoom: 19,
					minZoom: 0,
					name: 'Я.Спутник',
					// alt: 'Показать спутниковую карту Яндекса',
				});
				mapType.projection = (function(projection) {
					projectionYandexPrototype.call(projection);
					return new projection(projection);
				})(projectionYandex);
				return mapType;
			break;
			case 'yandex.p':
				mapType = new google.maps.ImageMapType({
					getTileUrl: function(ll, zoom) {
						return "https://0"+((ll.x+ll.y)%5)+".pvec.maps.yandex.net/tiles?l=pmap&x=" + ll.x + "&y=" + ll.y + "&z=" + zoom; // &v=2.44.0
					},
					tileSize: new google.maps.Size(256, 256),
					isPng: true,
					maxZoom: 18,
					minZoom: 0,
					name: 'Я.Народная',
					// alt: 'Показать народную карту Яндекса',
				});
				mapType.projection = (function(projection) {
					projectionYandexPrototype.call(projection);
					return new projection(projection);
				})(projectionYandex);
				return mapType;
			break;
		}
		return mapType;
	}
};
// Yandex projection support
projectionYandexPrototype = function() {
	function atanh(x) {
		return 0.5 * Math.log((1+x)/(1-x));
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
projectionYandex = function () {
	this.pixelOrigin_ = new google.maps.Point(128,128);
	this.pixelsPerLonDegree_ = this.MERCATOR_RANGE / 360;
	this.pixelsPerLonRadian_ = this.MERCATOR_RANGE / (2 * Math.PI);
}
