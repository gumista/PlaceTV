<?php
/*
 PlaceTV — custom TV for MODx Evolution
 Version 16.08.13 by Yurik Dertlyan, yurik@unix.am
*/

if (IN_MANAGER_MODE != 'true') {
 die('<h1>Error:</h1><p>Please use the MODx content manager instead of accessing this file directly.</p>');
}

$includeOnce = <<<EOD
<script type="text/javascript" src="https://maps.google.com/maps/api/js"></script>
<script src="/assets/tvs/placetv/js/place.js" type="text/javascript"></script>
EOD;

if(!defined('PLACETV')) {
 $placetv['dir'] = dirname(__FILE__);
 $placetv['lang'] = file_exists($placetv['dir'].'/i18n/'.$modx->config['manager_language'].'.php') ? include('i18n/'.$modx->config['manager_language'].'.php') : include('i18n/english.php');
 echo $includeOnce;
 define('PLACETV', 1);
}

$value = empty($row['value']) ? $row['default_text'] : $row['value'];
$id = $row['id'];

echo <<<EOD
<input type="text" id="tv{$id}" name="tv{$id}" value="{$value}" style="width:300px;" onchange="documentDirty=true;"/><input id="tv{$id}geocode" type="button" style="vertical-align:top;" value="{$placetv['lang']['search']}"/>
<div class="map" id="map{$id}" style="height:300px; background:#eee; width:100%;"></div>
<script type="text/javascript">
var point{$id} = new google.maps.LatLng({$value});
map{$id} = new Place('map{$id}', point{$id}, 16);
var mapMarker{$id} = map{$id}.createDraggableMarker(point{$id}, '{$placetv['lang']['location']}', 'tv{$id}');
$('tv{$id}geocode').addEvents({
 'click':function() {
  var value = $('tv{$id}').value;
  map{$id}.geocodeMarker(mapMarker{$id}, value);
 }
});
</script>
EOD;
?>
