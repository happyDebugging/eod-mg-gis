export const environment = {
    production: false,
  
    databaseURL: "https://eod-mg-gis-default-rtdb.europe-west1.firebasedatabase.app",
    fireHydrantTable: '/fireHydrantPOI',

    reverseGeocodeURL: 'https://nominatim.openstreetmap.org/reverse?format=geocodejson',
    reverseGeocodeLat: '&lat=',
    reverseGeocodeLng: '&lon=',
    reverseGeocodeOptions: '&addressdetails=1&namedetails=1&zoom=18&layer=poi',

    navigationURL: 'https://api.geoapify.com/v1/routing?waypoints=',
    navigationMode: '&mode=drive',
    navigationAPIKey: '&apiKey=ac36f38b7d3f41d99b9a19780f251b24'
};
