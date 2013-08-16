<?php
$id = isset($id) ? $id : 'placemap';
$latlng = isset($latlng) ? $latlng : '0,0';
$addr = isset($addr) ? $addr : null;
$title = isset($title) ? $title : $modx->documentObject['pagetitle'];
$zoom = isset($zoom) ? $zoom : 15;
$width = isset($width) ? $width : '100%';
$height = isset($height) ? $height : '400';
$geocoder = isset($geocoder) ? $geocoder : 'google';

$modx->regClientStartupScript('https://maps.google.com/maps/api/js?sensor=false');
$modx->regClientStartupScript($modx->config['site_url'].'assets/tvs/placetv/js/place.js');

$out = '<div id="placemap" style="width:'.$width.'px;height:'.$height.'px;background-color:#eee"></div>
<script type="text/javascript">
 var place;
 window.onload = function(){
  var point = new google.maps.LatLng('.$latlng.');
  place = new Place("placemap", point, '.$zoom.', "osm", ["osm", "2gis", "hybrid"]);
  var marker = place.createMarker(point, "'. $title .'", "'.$addr.'");
';
if($addr) $out.='  place.geocodeMarker(marker, "'.$addr.'","'.$geocoder.'");';
$out.='  place.redraw();
 }
</script>';
return $out;
?>
