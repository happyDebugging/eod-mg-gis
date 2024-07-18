import { Component, OnInit, ViewChild, ElementRef, } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-gis-map',
  templateUrl: './gis-map.component.html',
  styleUrl: './gis-map.component.css'
})
export class GisMapComponent implements OnInit {

  map!: L.Map;
  marker!: L.Marker<any>;
  circle!: L.Circle<any>;
  setView = true;
  isNavigationOn = false;

  poiMarkers = [
    { Lat: 39.303044, Long: 22.937749, Address: 'Αγ. Στεφάνου, Σωρός', State: 'Ενεργός' },
    { Lat: 39.301463, Long: 22.940258, Address: 'Αλόης, Σωρός', State: 'Ενεργός' },
    { Lat: 39.302951, Long: 22.938931, Address: 'Αμαρυλίδος, Σωρός', State: 'Ενεργός' },
    { Lat: 39.304238, Long: 22.940437, Address: 'Σωρός', State: 'Ενεργός' },
    { Lat: 39.298565, Long: 22.940683, Address: 'Σωρός', State: 'Ενεργός' },
    { Lat: 39.30932, Long: 22.934969, Address: 'Σωρός', State: 'Ενεργός' },
    { Lat: 39.340313, Long: 22.937627, Address: 'Ασκαλάμου, Νέες Παγασές', State: 'Ενεργός' },
    { Lat: 39.368091, Long: 22.937751, Address: '2ας Νοεμβρίου 67, Βόλος', State: 'Δεν ελέγθηκε' },
    { Lat: 39.363834, Long: 22.940542, Address: 'Πλ. Ρήγα Φεραίου (Δημητριάδος), Βόλος', State: 'Δεν ελέγθηκε' },
    { Lat: 39.359487, Long: 22.95042, Address: 'Ογλ-Ερμού, Βόλος', State: 'Δεν ελέγθηκε' },
    { Lat: 39.361184, Long: 22.947422, Address: 'Κ. Καρτάλη 64, Βόλος', State: 'Δεν ελέγθηκε' },
    { Lat: 39.36164, Long: 22.946275, Address: 'Ελ. Βενιζέλου 20, Βόλος', State: 'Δεν ελέγθηκε' },
    { Lat: 39.368900, Long: 22.945117, Address: 'Βασσάνη 109, Βόλος', State: 'Δεν ελέγθηκε' },
    { Lat: 39.370517, Long: 22.946622, Address: 'Βασσάνη 141-127, Βόλος', State: 'Δεν ελέγθηκε' },
    { Lat: 39.370525, Long: 22.94827, Address: 'Στρ. Μακρυγιάννη 71, Βόλος', State: 'Δεν ελέγθηκε' },
    { Lat: 39.364914, Long: 22.953848, Address: 'Γκλαβάνη 149, Βόλος', State: 'Δεν ελέγθηκε' },
    { Lat: 39.369205, Long: 22.950564, Address: 'Στρ. Μακρυγιάννη 103, Βόλος', State: 'Δεν ελέγθηκε' }
  ];

  fireHydrantIcon = L.icon({
    iconUrl: 'fire-hydrant-marker-icon.png',
    iconSize: [45, 45]
  });

  // @ViewChild('currentLocationButton') public searchElementRef: ElementRef;

  // constructor(public map: L.Map) { }
 
  ngOnInit(): void {

    // Initiate map
     this.map = L.map('map').setView([39.340313, 22.937627], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    this.AddFireHydrantMarkersOnMap(this.map);

    this.GetRealTimeUserLocation();
   
    this.AddNewFireHydrantPOI(this.map);


    // // User Real-Time Location
    // if (!navigator.geolocation) {
    //   console.log('Your browser does not support geolocation.')
    // } else {
    //   setInterval(() => {
    //     //this.GetRealTimeUserLocation(map); //Initial location

    //     navigator.geolocation.getCurrentPosition((position) => {
    //       this.GetRealTimeLocation(position, map);
    //     }, null, {
    //       enableHighAccuracy: true,
    //       timeout: 5000,
    //       maximumAge: 1000000
    //    });

    //   }, 3000);
    // }

  }

  // GetRealTimeLocation(position: GeolocationPosition, map: L.Map){
  //   var lat = position.coords.latitude;
  //   var lng = position.coords.longitude;
  //   var accuracy = position.coords.accuracy;

  //   if (this.marker) {
  //     map.removeLayer(this.marker);
  //   }

  //   if (this.circle) {
  //     map.removeLayer(this.circle);
  //   }

  //   this.marker = L.marker([lat,lng]);
  //   this.circle = L.circle([lat,lng], {radius: accuracy});

  //   var featureGroup = L.featureGroup([this.marker,this.circle]).addTo(map);

  //   map.fitBounds(featureGroup.getBounds());

  // }
  

  AddFireHydrantMarkersOnMap(map: L.Map) {
    // Add fire hydrant POI on map
    for (const marker of this.poiMarkers) {
      L.marker([marker.Lat, marker.Long], { icon: this.fireHydrantIcon })
        .addTo(map)
        .bindPopup('<b>'+marker.Address + '</b><br>' + marker.State);
    }
  }

  GetRealTimeUserLocation() {
    
    // Locate user
    if (!this.isNavigationOn) {
      const userLocation = this.map.locate({setView: true, maxZoom: 16}); //setView: true, , watch: true
      //this.setView = false;
      console.log('1')
    } else {
      this.map.stopLocate();
      const userLocation = this.map.locate({setView: false, maxZoom: 10, watch: true});
      console.log('2')
    }

    if (this.isNavigationOn) {
      const userLocation = this.map.locate({setView: true, maxZoom: 16, watch: true}); 
    }
    
    // Use map event 'locationfound' to perform some operations once the browser locates the user.
    this.map.on('locationfound', (position) => {
      
      var latlng = position.latlng;
      var accuracy = position.accuracy;

      if (this.marker) {
        this.map.removeLayer(this.marker);
      }
  
      if (this.circle) {
        this.map.removeLayer(this.circle);
      }
  
      this.marker = L.marker(latlng);
      this.circle = L.circle(latlng, {radius: accuracy, color: '#2940a6', fillColor: '#2940a6', fillOpacity: 0.7}).addTo(this.map);
  
      //map.panTo(latlng);

      //var featureGroup = L.featureGroup([this.marker,this.circle]).addTo(map);
  
      //map.fitBounds(featureGroup.getBounds());

    //   this.circle = L.circle(event.latlng, event.accuracy, {
    //     radius: 100,
    //     color: '#2940a6',
    //     fillColor: '#2940a6',
    //     fillOpacity: 0.7        
    // }).addTo(map);
    //   var locationPopup = L.popup().
    //       setContent("Your Location").
    //       setLatLng(event.latlng).addTo(map);
    });

  }

  AddNewFireHydrantPOI(map: L.Map) {  //Enable finally
    // map.on('click',  (event) => {
    //   console.log(event.latlng)
    //   L.marker([event.latlng.lat, event.latlng.lng], { icon: this.fireHydrantIcon }).addTo(map);
    // });
  }

  StartNavigation() {

    if (!this.isNavigationOn) {
      this.isNavigationOn = true;
      this.GetRealTimeUserLocation();
    } else {
      this.isNavigationOn = false;
      this.map.stopLocate();
    }
    
  }

}
