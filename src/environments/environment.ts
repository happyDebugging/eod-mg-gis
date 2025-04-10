export const environment = {
    production: true,

    appUrl: "https://eodmg-gis.netlify.app",
  
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
    navigationAPIKey: '&apiKey=ac36f38b7d3f41d99b9a19780f251b24',

    supabaseUrl: 'https://ccuxygolitirdpzhfkvr.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjdXh5Z29saXRpcmRwemhma3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMDkwNzgsImV4cCI6MjA1OTg4NTA3OH0.lZHI2fl-blEv8B3xZMs77EOhlrgFK-AjI5ey-3W99_U',
};
