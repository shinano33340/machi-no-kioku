'use strict';
const params = new URLSearchParams(location.search);
const lat = Number(params.get('lat')), lon = Number(params.get('lon'));
const fallback = document.getElementById('fallback');
const status = document.getElementById('mapStatus');
const retry = document.getElementById('retryMap');
let timer, map, tiles;
function failed(message) {
  clearTimeout(timer);
  status.textContent = message;
  retry.hidden = false;
  fallback.hidden = false;
}
function reloadTiles() {
  status.textContent = '地図を読み込んでいます…';
  retry.hidden = true;
  fallback.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => failed('地図を読み込めませんでした。再読み込みするか、下の「Googleマップで開く」をご利用ください。'), 15000);
  tiles.redraw();
}
retry.onclick = () => tiles ? reloadTiles() : location.reload();
if (!params.has('lat') || !params.has('lon') || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
  failed('地図の位置を取得できませんでした。地名を選び直してください。');
  retry.hidden = true;
} else if (!window.L) {
  failed('地図を起動できませんでした。再読み込みをお試しください。');
} else {
  try {
    map = L.map('map', {scrollWheelZoom: false}).setView([lat, lon], params.get('zoom') === '4' ? 4 : 12);
    tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    });
    // Keep the loading message until map images have actually loaded.
    tiles.on('load', () => {
      const images = [...document.querySelectorAll('.leaflet-tile')];
      if (images.some(image => image.complete && image.naturalWidth > 0)) {
        clearTimeout(timer);
        fallback.hidden = true;
      } else {
        failed('地図の画像を読み込めませんでした。再読み込みするか、下の「Googleマップで開く」をご利用ください。');
      }
    });
    timer = setTimeout(() => failed('地図を読み込めませんでした。再読み込みするか、下の「Googleマップで開く」をご利用ください。'), 15000);
    tiles.addTo(map);
    L.circleMarker([lat, lon], {radius: 8, color: '#fff', weight: 3, fillColor: '#b46143', fillOpacity: 1}).addTo(map);
    window.addEventListener('pageshow', () => map.invalidateSize());
    window.addEventListener('resize', () => map.invalidateSize());
  } catch {
    failed('地図を起動できませんでした。再読み込みをお試しください。');
  }
}
