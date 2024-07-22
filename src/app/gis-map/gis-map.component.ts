import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, } from '@angular/core';
import { Route } from '@angular/router';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
//import { HttpClient } from '@angular/common/http';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getDatabase } from 'firebase/database';
import { map, Subscription } from 'rxjs';
import { FireHydrantPoi } from '../shared/models/fire-hydrant.model';
import { DbFunctionService } from '../shared/services/db-functions.service';


@Component({
  selector: 'app-gis-map',
  templateUrl: './gis-map.component.html',
  styleUrl: './gis-map.component.css'
})
export class GisMapComponent implements OnInit, AfterViewInit {

  map!: L.Map;
  marker!: L.Marker<any>;
  circle!: L.Circle<any>;
  setView = true;
  isNavigationOn = false;
  isUserLogedIn = false;
  //latlng!: L.LatLng = (0,0);
  routingControl!: L.Routing.Control;
  distance = 0;
  minDistance = 10;
  closestPoint: FireHydrantPoi = { Id: '', Lat: 0, Lng: 0, Address: 'a', State: 'b', HoseDiameter: '' };
  nearestMArker!: FireHydrantPoi;

  myModal: any = document.getElementById('exampleModal');
  myInput: any  = document.getElementById('myInput');

  getPOI: Subscription = new Subscription;
  updatePOI: Subscription = new Subscription;

  // Your web app's Firebase configuration
  firebaseConfig = {
    apiKey: "AIzaSyDNwNNygCdaAGYIxWWDlMKHtYddEb3nQZo",
    authDomain: "eod-mg-gis.firebaseapp.com",
    databaseURL: "https://eod-mg-gis-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "eod-mg-gis",
    storageBucket: "eod-mg-gis.appspot.com",
    messagingSenderId: "130989582145",
    appId: "1:130989582145:web:6855bec56d2dfd8cb7a3c0"
  };


  fireHydrantMarkers = [{ Id: '', Lat: 0, Lng: 0, Address: '', State: '', HoseDiameter: '' }
    // { Id: '', Lat: 39.303044, Lng: 22.937749, Address: 'Αγ. Στεφάνου, Σωρός', State: 'Ενεργός', HoseDiameter: '' },
    // { Id: '', Lat: 39.301463, Lng: 22.940258, Address: 'Αλόης, Σωρός', State: 'Ενεργός', HoseDiameter: '' },
    // { Id: '', Lat: 39.302951, Lng: 22.938931, Address: 'Αμαρυλίδος, Σωρός', State: 'Ενεργός', HoseDiameter: '' },
    // { Id: '', Lat: 39.304238, Lng: 22.940437, Address: 'Σωρός', State: 'Ενεργός', HoseDiameter: '' },
    // { Id: '', Lat: 39.298565, Lng: 22.940683, Address: 'Σωρός', State: 'Ενεργός', HoseDiameter: '' },
    // { Id: '', Lat: 39.30932, Lng: 22.934969, Address: 'Σωρός', State: 'Ενεργός', HoseDiameter: '' },
    // { Id: '', Lat: 39.340313, Lng: 22.937627, Address: 'Ασκαλάμου, Νέες Παγασές', State: 'Ενεργός', HoseDiameter: '' },
    // { Id: '', Lat: 39.368091, Lng: 22.937751, Address: '2ας Νοεμβρίου 67, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.363834, Lng: 22.940542, Address: 'Πλ. Ρήγα Φεραίου (Δημητριάδος), Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.359487, Lng: 22.95042, Address: 'Ογλ-Ερμού, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.361184, Lng: 22.947422, Address: 'Κ. Καρτάλη 64, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.36164, Lng: 22.946275, Address: 'Ελ. Βενιζέλου 20, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.368900, Lng: 22.945117, Address: 'Βασσάνη 109, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.370517, Lng: 22.946622, Address: 'Βασσάνη 141-127, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.370525, Lng: 22.94827, Address: 'Στρ. Μακρυγιάννη 71, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.364914, Lng: 22.953848, Address: 'Γκλαβάνη 149, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.369205, Lng: 22.950564, Address: 'Στρ. Μακρυγιάννη 103, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.367765, Lng: 22.919093, Address: 'Σπετσών 4, Βόλος', State: 'Ενεργός', HoseDiameter: '' },
    // { Id: '', Lat: 39.356358, Lng: 22.956956, Address: 'Πολυμέρη 77, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.36149, Lng: 22.936784, Address: 'Μητροπολήτου Γρηγορίου, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.363816, Lng: 22.93784, Address: 'Βασάνη 2-4, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.366683, Lng: 22.941403, Address: 'Γ. Καρτάλη - Κουντουριώτου, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.36797, Lng: 22.942569, Address: 'Κωνσταντά 43-39, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.369021, Lng: 22.94363, Address: 'Κουντουριώτου 89-85, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' },
    // { Id: '', Lat: 39.369897, Lng: 22.944506, Address: 'Αναλήψεως, Βόλος', State: 'Δεν ελέγθηκε', HoseDiameter: '' }
  ];

  fireHydrantIcon = L.icon({
    iconUrl: 'fire-hydrant-marker-icon.png',
    iconSize: [45, 45]
  });

  // @ViewChild('currentLocationButton') public searchElementRef: ElementRef;

  constructor(private dbFunctionService: DbFunctionService) { }

  ngOnInit(): void {

    // Initialize Firebase
    const firebaseApp = initializeApp(this.firebaseConfig);
    // Initialize Realtime Database and get a reference to the service
    const database = getDatabase(firebaseApp);

    // Initiate map
    this.map = L.map('map').setView([39.340313, 22.937627], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    this.GetFireHydrantsPOI();

    this.GetRealTimeUserLocation();

    this.AddNewFireHydrantPOI(this.map);

    //this.SaveFireHydrantsPOI();


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

    // const templatlng: L.LatLng = L.latLng(39.368900, 22.945117);
    // // Find nearest fire hydrant
    //   // ....
    //   this.FindNearestPoint(templatlng);

  }

  ngAfterViewInit(): void {

    // Get device orientation
    window.addEventListener("deviceorientation", handleOrientation, true);
    function handleOrientation(event: any) {
      var absolute = event.absolute;
      var alpha = event.alpha;
      var beta = event.beta;
      var gamma = event.gamma;
      // Do stuff with the new orientation data
      console.log(absolute, ' ', alpha, ' ', beta, ' ', gamma)
    }

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
    for (const marker of this.fireHydrantMarkers) {
      L.marker([marker.Lat, marker.Lng], { icon: this.fireHydrantIcon })
        .addTo(map)
        .bindPopup('<b>' + marker.Address + '</b><br>' + marker.State + '  ' + `<div class="d-grid"><button type="button" style="" class="btn btn-secondary btn-sm" (click)="FillDetailsForUpdate()">Edit</button></div>`);
    }
  }


  GetRealTimeUserLocation() {

    // Locate user
    if (!this.isNavigationOn) {
      const userLocation = this.map.locate({ setView: true, maxZoom: 16 }); //setView: true, , watch: true
      //this.setView = false;
      console.log('1')
    } else {
      this.map.stopLocate();
      const userLocation = this.map.locate({ setView: false, maxZoom: 10, watch: true });
      console.log('2')
    }

    if (this.isNavigationOn) {
      const userLocation = this.map.locate({ setView: true, maxZoom: 16, watch: true });

      if (this.routingControl) {
        this.map.removeControl(this.routingControl);
      }

      // Navigating from current position to nearest fire hydrant point
      this.routingControl = L.Routing.control({
        router: L.Routing.osrmv1({
          serviceUrl: `http://router.project-osrm.org/route/v1`
        }),
        waypoints: [
          L.latLng(0, 0),
          L.latLng(39.364914, 22.953848)  // Nearest fire hydrant
        ],
        routeWhileDragging: true
      }).on('routesfound', (waypoints) => {
        console.log(waypoints);

        // this.marker = L.marker(latlng);
        // this.circle = L.circle(latlng, {radius: accuracy, color: '#2940a6', fillColor: '#2940a6', fillOpacity: 0.7}).addTo(this.map);

      }).addTo(this.map);
      this.routingControl.hide();  // Hides the directions panel
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
      this.circle = L.circle(latlng,
        {
          radius: 28, //radius: accuracy
          color: '#2940a6',
          fillColor: '#2940a6',
          fillOpacity: 0.7
        })
        .addTo(this.map);

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


      // Find nearest fire hydrant
      // ....
      this.FindNearestPoint(latlng);


      // Update navigation route
      if (this.isNavigationOn) {
        var newWaypoint = this.routingControl.getWaypoints()[0].latLng;
        this.routingControl.setWaypoints([
          L.latLng(latlng.lat, latlng.lng),
          L.latLng(this.nearestMArker.Lat, this.nearestMArker.Lng)
        ]);


      }


    });

  }

  AddNewFireHydrantPOI(map: L.Map) {  //Enable finally
    // map.on('click',  (event) => {
    //   console.log(event.latlng)
    //   L.marker([event.latlng.lat, event.latlng.lng], { icon: this.fireHydrantIcon }).addTo(map);
    // });
  }

  StartStopNavigation() {

    if (!this.isNavigationOn) {
      this.isNavigationOn = true;
      this.GetRealTimeUserLocation();
    } else {
      this.isNavigationOn = false;
      this.map.stopLocate();
      this.map.removeControl(this.routingControl);
    }

  }


  FindNearestPoint(latlng: L.LatLng) {

    for (const marker of this.fireHydrantMarkers) {

      this.distance = Math.abs(marker.Lat - latlng.lat) + Math.abs(marker.Lng - latlng.lng);
      //console.log('this.distance: '+this.distance)

      if (this.distance < this.minDistance) { //< einai kanonika
        this.minDistance = this.distance;
        this.closestPoint = marker;
      }
    }

    this.nearestMArker = this.closestPoint;
    //console.log('nearestMArker: ' + this.nearestMArker.Address)
    //L.marker([this.nearestMArker.Lat, this.nearestMArker.Long]);


  }

  GetFireHydrantsPOI() {
    this.fireHydrantMarkers = [];

    this.getPOI = this.dbFunctionService.getFireHydrantsFromDb()
      .pipe(map((response: any) => {
        const markerArray: FireHydrantPoi[] = [];

        for (const key in response) {
          if (response.hasOwnProperty(key)) {
            markerArray.push({ ...response[key], id: key })
          }
        }
        return markerArray.reverse();
      }))
      .subscribe(
        (res: any) => {
          if ((res != null) || (res != undefined)) {
            //console.log(res)
            const responseData = new Array<FireHydrantPoi>(...res);

            for (const data of responseData) {
              const resObj = new FireHydrantPoi();

              resObj.Id = data.Id;
              resObj.Lat = data.Lat;
              resObj.Lng = data.Lng;
              resObj.Address = data.Address;
              resObj.State = data.State;
              resObj.HoseDiameter = data.HoseDiameter;

              this.fireHydrantMarkers.push(resObj);
            }
            //console.log(this.fireHydrantMarkers);
            this.AddFireHydrantMarkersOnMap(this.map);
          }
          //this.isLoadingResults = false;
        },
        err => {
          //console.log(err);
          //this.isLoadingResults = false;
        }
      );
  }

  SaveFireHydrantsPOI() {

    for (const m of this.fireHydrantMarkers) {

      let fireHydrants = new FireHydrantPoi;

      fireHydrants.Id = this.fireHydrantMarkers.length + 1;
      fireHydrants.Lat = m.Lat;
      fireHydrants.Lng = m.Lng;
      fireHydrants.Address = m.Address;
      fireHydrants.State = m.State;
      fireHydrants.HoseDiameter = m.HoseDiameter;

      this.dbFunctionService.postFireHydrantsToDb(fireHydrants)
        // .pipe(
        //   catchError((error) => {
        //     this.isLoading = false;
        //     return of('Συνέβη κάποιο σφάλμα. Προσπαθήστε ξανά.');
        //   })
        //)
        .subscribe(
          (res: any) => {
            console.log(res);
            if ((res != null) || (res != undefined)) {
              const responseData = new Array<FireHydrantPoi>(...res);
            }
          },
          err => {
            console.log(err);
          }
        );

    }

  }

  FillDetailsForUpdate() {
    console.log('uuuuu')
    this.myModal.addEventListener('shown.bs.modal', () => {
      this.myInput.focus();
    })
    
  }

  UpdateFireHydrantsPOI() {
    this.updatePOI = this.dbFunctionService.updateFireHydrantsToDb(this.fireHydrantMarkers[0])
      .pipe(map((response: any) => {
        const markerArray: FireHydrantPoi[] = [];

        for (const key in response) {
          if (response.hasOwnProperty(key)) {
            markerArray.push({ ...response[key], id: key })
          }
        }
        return markerArray.reverse();
      }))
      .subscribe(
        (res: any) => {
          if ((res != null) || (res != undefined)) {
            //console.log(res)
            const responseData = new Array<FireHydrantPoi>(...res);

            for (const data of responseData) {
              const resObj = new FireHydrantPoi();

              resObj.Id = data.Id;
              resObj.Lat = data.Lat;
              resObj.Lng = data.Lng;
              resObj.Address = data.Address;
              resObj.State = data.State;
              resObj.HoseDiameter = data.HoseDiameter;

              this.fireHydrantMarkers.push(resObj);
            }
            //console.log(this.fireHydrantMarkers);
          }
          //this.isLoadingResults = false;
        },
        err => {
          //console.log(err);
          //this.isLoadingResults = false;
        }
      );
  }

  UserLogin() {

  }


  ngOnDestroy() {

    if (this.getPOI && !this.getPOI.closed) {
      this.getPOI.unsubscribe();
    }

    if (this.updatePOI && !this.updatePOI.closed) {
      this.updatePOI.unsubscribe();
    }

  }



}
