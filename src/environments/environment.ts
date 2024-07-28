export const environment = {
    production: true,
  
    databaseURL: "https://eod-mg-gis-default-rtdb.europe-west1.firebasedatabase.app",
    fireHydrantTable: '/fireHydrantPOI',
    
    reverseGeocodeURL: 'https://nominatim.openstreetmap.org/reverse?format=geocodejson',
    reverseGeocodeLat: '&lat=',
    reverseGeocodeLng: '&lon=',
    reverseGeocodeOptions: '&addressdetails=1&namedetails=1&zoom=18&layer=poi'
};
