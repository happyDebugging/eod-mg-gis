import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener, } from '@angular/core';
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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-gis-map',
  templateUrl: './gis-map.component.html',
  styleUrl: './gis-map.component.css'
})
export class GisMapComponent implements OnInit, AfterViewInit {

  map!: L.Map;
  marker!: L.Marker<any>;
  circle!: L.CircleMarker<any>;
  outerCircle!: L.CircleMarker<any>;
  setView = true;
  isNavigationOn = false;
  isUserLogedIn = false;
  //latlng!: L.LatLng = (0,0);
  routingControl!: L.Routing.Control;
  distance = 0;
  minDistance = 10;
  closestPoint: FireHydrantPoi = { Id: '', Lat: 0, Lng: 0, Address: 'a', State: 'b', StateDescription: '', HoseDiameter: '' };
  nearestMarker!: FireHydrantPoi;
  fireHydrantId = '';
  fireHydrantAddress = '';
  fireHydrantState = '';
  fireHydrantStateDescription = '';
  fireHydrantType = '';
  fireHydrantLat = 0;
  fireHydrantLng = 0;
  isAddNewLocationActive = false;
  eventL!: L.LeafletMouseEvent;
  zoomLevel = 19;

  userLocationLat = 0;
  userLocationLng = 0;

  navigationWayPoints: Array<any> = [];
  navigationPolyline: any;

  @ViewChild('details') details: any;
  @ViewChild('detailsToPost') detailsToPost: any;

  // @HostListener("click") onClick(){
  //   this.elementRef.nativeElement.addEventListener("click", this.FillDetailsForUpdate());
  // }

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


  fireHydrantMarkers = [{ Id: '', Lat: 0, Lng: 0, Address: '', State: '', StateDescription: '', HoseDiameter: '' }
    // { Id: '', Lat: 39.303044, Lng: 22.937749, Address: 'Αγ. Στεφάνου, Σωρός', State: 'active', StateDescription: 'Ενεργός', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.301463, Lng: 22.940258, Address: 'Αλόης, Σωρός', State: 'active', StateDescription: 'Ενεργός', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.302951, Lng: 22.938931, Address: 'Αμαρυλίδος, Σωρός', State: 'active', StateDescription: 'Ενεργός', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.304238, Lng: 22.940437, Address: 'Σωρός', State: 'active', StateDescription: 'Ενεργός', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.298565, Lng: 22.940683, Address: 'Σωρός', State: 'active', StateDescription: 'Ενεργός', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.30932, Lng: 22.934969, Address: 'Σωρός', State: 'active', StateDescription: 'Ενεργός', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.340313, Lng: 22.937627, Address: 'Ασκαλάμου, Νέες Παγασές', State: 'active', StateDescription: 'Ενεργός', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.368091, Lng: 22.937751, Address: '2ας Νοεμβρίου 67, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.363834, Lng: 22.940542, Address: 'Πλ. Ρήγα Φεραίου (Δημητριάδος), Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.359487, Lng: 22.95042, Address: 'Ογλ-Ερμού, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.361184, Lng: 22.947422, Address: 'Κ. Καρτάλη 64, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.36164, Lng: 22.946275, Address: 'Ελ. Βενιζέλου 20, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.368900, Lng: 22.945117, Address: 'Βασσάνη 109, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.370517, Lng: 22.946622, Address: 'Βασσάνη 141-127, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.370525, Lng: 22.94827, Address: 'Στρ. Μακρυγιάννη 71, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.364914, Lng: 22.953848, Address: 'Γκλαβάνη 149, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.369205, Lng: 22.950564, Address: 'Στρ. Μακρυγιάννη 103, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.367765, Lng: 22.919093, Address: 'Σπετσών 4, Βόλος', State: 'active', StateDescription: 'Ενεργός', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.356358, Lng: 22.956956, Address: 'Πολυμέρη 77, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.36149, Lng: 22.936784, Address: 'Μητροπολήτου Γρηγορίου, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.363816, Lng: 22.93784, Address: 'Βασάνη 2-4, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.366683, Lng: 22.941403, Address: 'Γ. Καρτάλη - Κουντουριώτου, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.36797, Lng: 22.942569, Address: 'Κωνσταντά 43-39, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.369021, Lng: 22.94363, Address: 'Κουντουριώτου 89-85, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' },
    // { Id: '', Lat: 39.369897, Lng: 22.944506, Address: 'Αναλήψεως, Βόλος', State: 'undefined', StateDescription: 'Δεν ελέγθηκε', HoseDiameter: 'undefined' }
  ];

  fireHydrantIcon = L.icon({
    iconUrl: 'fire-hydrant-marker-icon.png',
    iconSize: [45, 45]
  });

  userLocationIcon = L.icon({
    iconUrl: 'user-location-marker-icon.png',
    iconSize: [45, 45]
  });

  // @ViewChild('currentLocationButton') public searchElementRef: ElementRef;

  constructor(private dbFunctionService: DbFunctionService, private modalService: NgbModal, private elementRef: ElementRef) { }

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

    // this.SaveFireHydrantsPOIs();

    this.GetFireHydrantsPOI();

    // //////
    // const options = {
    //   enableHighAccuracy: true,
    //   // Get high accuracy reading, if available (default false)
    //   timeout: 5000,
    //   // Time to return a position successfully before error (default infinity)
    //   maximumAge: 2000,
    //   // Milliseconds for which it is acceptable to use cached position (default 0)
    // };
    // navigator.geolocation.watchPosition(
    //   (pos) => {
    //     const lat = pos.coords.latitude;
    //     const lng = pos.coords.longitude;
    //     const accuracy = pos.coords.accuracy; // Accuracy in metres
    //     this.marker = L.marker([lat,lng]).addTo(this.map);
    //     this.circle = L.circle([lat,lng],
    //       {
    //         radius: 28, //radius: accuracy
    //         color: '#2940a6',
    //         fillColor: '#2940a6',
    //         fillOpacity: 0.7
    //       })
    //       .addTo(this.map);
    //       console.log('lala')
    //   },
    //   (err) => {
    //     if (err.code === 1) {
    //       alert("Please allow geolocation access");
    //       // Runs if user refuses access
    //     } else {
    //       //alert("Cannot get current location");
    //       // Runs if there was a technical problem.
    //     }
    //   }, options);
    // ////////

    this.GetRealTimeUserLocation(); //uncomment

    //this.AddNewFireHydrantPOI();


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
      const popupInfo = '<b>' + marker.Address + '</b><br>' + marker.StateDescription + '  ' +
        `<div class="d-grid">
          <button type="button" class="btn btn-secondary btn-sm edit"> 
            Edit
          </buton></div>
      `;

      L.marker([marker.Lat, marker.Lng], { icon: this.fireHydrantIcon })
        .addTo(map)
        .bindPopup(popupInfo)
        .on("popupopen", e => {
          this.elementRef.nativeElement
            .querySelector(".edit")
            .addEventListener("click", (e: any) => {
              this.FillDetailsForUpdate(marker);
            });
        });

    }
    const editPointButton = L.DomUtil.get('button-submit');
  }

  GetUserLocation() {
    if (this.userLocationLat != 0 && this.userLocationLng != 0 && this.isNavigationOn) {
      this.map.flyTo([this.userLocationLat, this.userLocationLng], 18);
    }
    if (!this.isNavigationOn) {
      this.GetRealTimeUserLocation();
    }
  }

  GetRealTimeUserLocation() {

    // Locate user
    if (!this.isNavigationOn) {
      const userLocation = this.map.locate({ setView: true, maxZoom: 18, enableHighAccuracy: true }); //setView: true, , watch: true
      //this.setView = false;
      console.log('1')
    } else {
      this.map.stopLocate();
      console.log('2')

      const userLocation = this.map.locate({ setView: false, maxZoom: 16, watch: true, enableHighAccuracy: true }); //.on('');

      if (this.navigationPolyline) {
        //this.map.removeControl(this.routingControl);
        this.navigationPolyline.removeFrom(this.map);
      }

      // Navigating from current position to nearest fire hydrant point
      // this.routingControl = L.Routing.control({
      //   // router: L.Routing.osrmv1({
      //   //   serviceUrl: `http://router.project-osrm.org/route/v1`
      //   // }),
      //   // waypoints: [
      //   //   L.latLng(0, 0),
      //   //   L.latLng(39.364914, 22.953848)  // Nearest fire hydrant
      //   // ],
      //   routeWhileDragging: true
      // })
      //   // .on('routesfound', (waypoints) => {
      //   //   console.log(waypoints);

      //   //   // this.marker = L.marker(latlng);
      //   //   // this.circle = L.circle(latlng, {radius: accuracy, color: '#2940a6', fillColor: '#2940a6', fillOpacity: 0.7}).addTo(this.map);

      //   // })
      //   .addTo(this.map);
      // this.routingControl.hide();  // Hides the directions panel

    }



    // Use map event 'locationfound' to perform some operations once the browser locates the user.
    this.map.on('locationfound', (position) => {

      var latlng = position.latlng;
      var accuracy = position.accuracy;

      this.userLocationLat = latlng.lat;
      this.userLocationLng = latlng.lng;

      if (this.marker) {
        this.map.removeLayer(this.marker);
      }

      if (this.circle) {
        this.map.removeLayer(this.circle);
        this.map.removeLayer(this.outerCircle);
      }

      this.marker = L.marker(latlng, { icon: this.userLocationIcon });//.addTo(this.map);
      this.outerCircle = L.circleMarker(latlng,
        {
          radius: 14, //radius: accuracy
          color: '#a9c4f5',
          fillColor: '#ffffff',
          fillOpacity: 0.9,
        }).addTo(this.map);
      this.circle = L.circleMarker(latlng,
        {
          radius: 9, //radius: accuracy
          color: '#2940a6',
          fillColor: '#2940a6',
          fillOpacity: 1
        }).addTo(this.map);

      //this.map.panTo(latlng);

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


      // // Update navigation route
      // if (this.isNavigationOn) {
      //   //var newWaypoint = this.routingControl.getWaypoints()[0].latLng;
      //   this.routingControl.setWaypoints([
      //     L.latLng(latlng.lat, latlng.lng),
      //     L.latLng(this.nearestMarker.Lat, this.nearestMarker.Lng)
      //   ]);
      // }

      if (this.isNavigationOn) {
        // Fetch navigation route
        this.GetNavigationWaypoints(latlng.lat, latlng.lng);
      } else {
        this.navigationPolyline.removeFrom(this.map);
      }


    });

  }


  StartStopNavigation() {

    if (!this.isNavigationOn) {
      this.isNavigationOn = true;
      this.GetRealTimeUserLocation();
    } else {
      this.isNavigationOn = false;
      this.map.stopLocate();
      //this.map.removeControl(this.routingControl);
      this.navigationPolyline.removeFrom(this.map);
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

    this.nearestMarker = this.closestPoint;
    //console.log('nearestMarker: ' + this.nearestMarker.Address)
    //L.marker([this.nearestMarker.Lat, this.nearestMarker.Long]);


  }

  GetFireHydrantsPOI() {
    this.fireHydrantMarkers = [];

    this.getPOI = this.dbFunctionService.getFireHydrantsFromDb()
      .pipe(map((response: any) => {
        const markerArray: FireHydrantPoi[] = [];

        for (const key in response) {
          if (response.hasOwnProperty(key)) {

            markerArray.push({ ...response[key], Id: key })

          }
        }
        //console.log(markerArray)
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
              resObj.StateDescription = data.StateDescription;
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

  GetAddressDetails() {
    this.getPOI = this.dbFunctionService.getAddressDetails(this.fireHydrantLat, this.fireHydrantLng)
      .pipe(map((response: any) => {

        const geocodingResult = response.features[0].properties.geocoding;

        const addressName = geocodingResult.name;
        const addressStreet = geocodingResult.street;
        const addressHousenumber = geocodingResult.housenumber;
        const addressLocality = geocodingResult.locality;

        let fullAddress = '';
        if (addressStreet != null) {
          fullAddress = fullAddress + addressStreet;
        }
        if (addressHousenumber != null) {
          fullAddress = fullAddress + ', ' + addressHousenumber;
        }
        if (addressLocality != null) {
          fullAddress = fullAddress + ', ' + addressLocality;
        }
        console.log(fullAddress)

      }))
      .subscribe(
        (res: any) => {
          if ((res != null) || (res != undefined)) {
            //console.log(res)

          }
          //this.isLoadingResults = false;
        },
        err => {
          //console.log(err);
          //this.isLoadingResults = false;
        }
      );
  }

  SaveFireHydrantsPOIs() {

    for (const m of this.fireHydrantMarkers) {

      let fireHydrants = new FireHydrantPoi;

      fireHydrants.Id = m.Id;
      fireHydrants.Lat = m.Lat;
      fireHydrants.Lng = m.Lng;
      fireHydrants.Address = m.Address;
      fireHydrants.State = m.State;
      fireHydrants.StateDescription = m.StateDescription;
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

  FillDetailsForUpdate(marker: FireHydrantPoi) {

    this.fireHydrantId = marker.Id;
    this.fireHydrantLat = marker.Lat;
    this.fireHydrantLng = marker.Lng;
    this.fireHydrantAddress = marker.Address;
    this.fireHydrantState = marker.State;
    if (this.fireHydrantState == 'active') { this.fireHydrantStateDescription = 'Ενεργός'; }
    else if (this.fireHydrantState == 'inactive') { this.fireHydrantStateDescription = 'Μη Ενεργός'; }
    else if (this.fireHydrantState == 'undefined') { this.fireHydrantStateDescription = 'Δεν Ελέγχθηκε'; }
    this.fireHydrantType = marker.HoseDiameter;

    this.modalService.open(this.details, { centered: true, size: 'sm', windowClass: 'zindex' });

  }


  AddNewFireHydrantPOI() {  //event: L.LeafletMouseEvent (map: L.Map) //Enable finally
    this.isAddNewLocationActive = !this.isAddNewLocationActive;
    console.log(this.isAddNewLocationActive)

    if (this.isAddNewLocationActive) {

      this.PlaceNewPOIOnMap();
      // .then((res) => {
      //   //this.FillDetailsBeforeNewPost();
      // },
      //   () => console.log('failure')
      // );
    }
  }

  async PlaceNewPOIOnMap() {
    //let promise = new Promise(async (resolve, reject) => {

    //this.map.on('click', () => {  //evgala ta buttons apo to map kai de xreiazetai pleon

    this.map.on('click', (event) => {

      this.modalService.dismissAll();

      this.ResetFireHydrantDetails();

      if (this.isAddNewLocationActive) {
        console.log(event.latlng)

        this.eventL = event;

        this.fireHydrantLat = event.latlng.lat;
        this.fireHydrantLng = event.latlng.lng;

        this.GetAddressDetails();

        this.FillDetailsBeforeNewPost();

        //resolve(this.fireHydrantLng);
      }
    })
      //})
      ;

    //});
    //return promise;
  }

  FillDetailsBeforeNewPost() {

    if (this.isAddNewLocationActive) {
      this.modalService.open(this.detailsToPost, { centered: true, size: 'sm', windowClass: 'zindex' });
    }

  }

  PostFireHydrantPOI() {

    L.marker([this.eventL.latlng.lat, this.eventL.latlng.lng], { icon: this.fireHydrantIcon }).addTo(this.map);

    //this.map.on('click', () => {}).clearAllEventListeners();
    //this.isAddNewLocationActive = !this.isAddNewLocationActive;
    this.dismissDetailsModal();

    let fireHydrant = new FireHydrantPoi;
    console.log(this.fireHydrantId)
    fireHydrant.Id = this.fireHydrantId;
    fireHydrant.Lat = this.fireHydrantLat;
    fireHydrant.Lng = this.fireHydrantLng;
    fireHydrant.Address = this.fireHydrantAddress;
    fireHydrant.State = this.fireHydrantState;
    if (this.fireHydrantState == 'active') { fireHydrant.StateDescription = 'Ενεργός'; }
    else if (this.fireHydrantState == 'inactive') { fireHydrant.StateDescription = 'Μη Ενεργός'; }
    else if (this.fireHydrantState == 'undefined') { fireHydrant.StateDescription = 'Δεν Ελέγχθηκε'; }
    fireHydrant.HoseDiameter = this.fireHydrantType;

    this.dbFunctionService.postFireHydrantsToDb(fireHydrant)
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
            this.ResetFireHydrantDetails();
            this.GetFireHydrantsPOI();
            this.isAddNewLocationActive = false;
          }
        },
        err => {
          console.log(err);
        }
      );

  }


  UpdateFireHydrantsPOI() {

    this.dismissDetailsModal();

    let updatedMarker = new FireHydrantPoi;
    updatedMarker.Id = this.fireHydrantId;
    updatedMarker.Lat = this.fireHydrantLat;
    updatedMarker.Lng = this.fireHydrantLng;
    updatedMarker.Address = this.fireHydrantAddress;
    updatedMarker.State = this.fireHydrantState;
    if (this.fireHydrantState == 'active') { updatedMarker.StateDescription = 'Ενεργός'; }
    else if (this.fireHydrantState == 'inactive') { updatedMarker.StateDescription = 'Μη Ενεργός'; }
    else if (this.fireHydrantState == 'undefined') { updatedMarker.StateDescription = 'Δεν Ελέγχθηκε'; }
    updatedMarker.HoseDiameter = this.fireHydrantType;

    this.updatePOI = this.dbFunctionService.updateFireHydrantsToDb(updatedMarker)
      .pipe(map((response: any) => {

        this.GetFireHydrantsPOI();

      }))
      .subscribe(
        (res: any) => {
          if ((res != null) || (res != undefined)) {
            console.log(res)

            //this.ResetFireHydrantDetails();
            //this.GetFireHydrantsPOI();

          }

          //this.isLoadingResults = false;
        },
        err => {
          console.log(err);
          //this.isLoadingResults = false;
        }
      );
  }

  GetNavigationWaypoints(currentUserLat: number, currentUserLng: number) {

    this.getPOI = this.dbFunctionService.getNavigationWaypoints(currentUserLat, currentUserLng, this.nearestMarker.Lat, this.nearestMarker.Lng) //user location, nearest fire hydrant
      .pipe(map((response: any) => {

        this.navigationWayPoints = [];

        //console.log(response.features[0].geometry.coordinates[0])

        const navigationPOI = response.features[0].geometry.coordinates[0];

        let array = [];

        for (const poi of navigationPOI) {
          //console.log(poi[1], poi[0])
          array = [poi[1], poi[0]];
          this.navigationWayPoints.push(array);
        }

        //console.log(this.navigationWayPoints)
        
        if (this.navigationPolyline) {
          this.navigationPolyline.removeFrom(this.map);
        }
        
        this.navigationPolyline = new L.Polyline(this.navigationWayPoints, {
          color: 'blue',
          weight: 7,
          opacity: 0.6,
          smoothFactor: 1
        }).addTo(this.map);

      }))
      .subscribe(
        (res: any) => {
          if ((res != null) || (res != undefined)) {
            //console.log(res)

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

  dismissDetailsModal() {
    //this.map.on('click', () => {}).clearAllEventListeners();
    this.map.off('click');
    this.map.closePopup();
    this.isAddNewLocationActive = !this.isAddNewLocationActive;
    this.modalService.dismissAll();
  }

  ResetFireHydrantDetails() {
    this.fireHydrantId = '';
    this.fireHydrantLat = 0;
    this.fireHydrantLng = 0;
    this.fireHydrantAddress = '';
    this.fireHydrantState = '';
    this.fireHydrantStateDescription = '';
    this.fireHydrantType = '';

    //this.eventL = 0;

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
