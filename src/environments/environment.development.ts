export const environment = {
    production: false,
  
    databaseURL: "https://eod-mg-gis-default-rtdb.europe-west1.firebasedatabase.app",
    fireHydrantTable: '/fireHydrantPOI',

    // reverseGeocodeURL: 'https://nominatim.openstreetmap.org/reverse?format=geocodejson',
    // reverseGeocodeLat: '&lat=',
    // reverseGeocodeLng: '&lon=',
    // reverseGeocodeOptions: '&addressdetails=1&namedetails=1&zoom=18&layer=poi',

    reverseGeocodeURL: 'https://api.opencagedata.com/geocode/v1/geojson?q=',
    apiKey: '&key=5dae0b576aa84958bbf7de6eb87cd01f',
    reverseGeocodeOptions: '&language=el',

    navigationURL: 'https://api.geoapify.com/v1/routing?waypoints=',
    navigationMode: '&mode=drive',
    navigationAPIKey: '&apiKey=ac36f38b7d3f41d99b9a19780f251b24'
};
