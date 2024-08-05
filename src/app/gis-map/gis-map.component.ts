import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener, } from '@angular/core';
import { Route } from '@angular/router';
import { map, Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as L from 'leaflet';

import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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
  circle!: L.CircleMarker<any>;
  outerCircle!: L.CircleMarker<any>;
  setView = true;
  isNavigationOn = false;
  isUserLogedIn = false;
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

  userEmail = '';
  userPassword = '';
  auth: any;
  accessToken = '';
  isCredentialsWrong = false;
  loggedInUserId = '';

  @ViewChild('userLogin') userLogin: any;
  @ViewChild('details') details: any;
  @ViewChild('detailsToPost') detailsToPost: any;

  getPOI: Subscription = new Subscription;
  updatePOI: Subscription = new Subscription;

  // Firebase web app configuration
  firebaseConfig = {
    apiKey: "AIzaSyDNwNNygCdaAGYIxWWDlMKHtYddEb3nQZo",
    authDomain: "eod-mg-gis.firebaseapp.com",
    databaseURL: "https://eod-mg-gis-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "eod-mg-gis",
    storageBucket: "eod-mg-gis.appspot.com",
    messagingSenderId: "130989582145",
    appId: "1:130989582145:web:6855bec56d2dfd8cb7a3c0"
  };

  fireHydrantMarkers = [{ Id: '', Lat: 0, Lng: 0, Address: '', State: '', StateDescription: '', HoseDiameter: '' }];

  fireHydrantIcon = L.icon({
    iconUrl: 'fire-hydrant-marker-icon.png',
    iconSize: [45, 45]
  });

  userLocationIcon = L.icon({
    iconUrl: 'user-location-marker-icon.png',
    iconSize: [45, 45]
  });

  constructor(private dbFunctionService: DbFunctionService, private modalService: NgbModal, private elementRef: ElementRef) { }

  ngOnInit(): void {

    // Initialize Firebase
    const firebaseApp = initializeApp(this.firebaseConfig);
    // Initialize Realtime Database and get a reference to the service
    const database = getDatabase(firebaseApp);
    this.auth = getAuth(firebaseApp);

    // Initiate map
    this.map = L.map('map').setView([39.340313, 22.937627], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    // this.SaveFireHydrantsPOIs();

    this.GetFireHydrantsPOI();

    this.GetRealTimeUserLocation();

  }

  ngAfterViewInit(): void {

    // // Get device orientation
    // window.addEventListener("deviceorientation", handleOrientation, true);
    // function handleOrientation(event: any) {
    //   var absolute = event.absolute;
    //   var alpha = event.alpha;
    //   var beta = event.beta;
    //   var gamma = event.gamma;
    //   // Do stuff with the new orientation data
    //   console.log(absolute, ' ', alpha, ' ', beta, ' ', gamma)
    // }

  }

  AddFireHydrantMarkersOnMap(map: L.Map) {

    // Add fire hydrant POI on map
    for (const marker of this.fireHydrantMarkers) {

      let popupInfo = '';

      if (this.isUserLogedIn) {
        popupInfo = '<b>' + marker.Address + '</b><br>' + marker.StateDescription + '  ' +
        `<div class="d-grid">
          <button type="button" class="btn btn-secondary btn-sm edit"> 
            Edit
          </buton></div>
      `;
      } else {
        popupInfo = '<b>' + marker.Address + '</b><br>' + marker.StateDescription + '  ' +
        `<div class="d-grid">
      `;
      }
      
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
      const userLocation = this.map.locate({ setView: true, maxZoom: 18, enableHighAccuracy: true });
    } else {
      this.map.stopLocate();

      const userLocation = this.map.locate({ setView: false, maxZoom: 16, watch: true, enableHighAccuracy: true });

      if (this.navigationPolyline) {
        this.navigationPolyline.removeFrom(this.map);
      }

    }

    // Use map event 'locationfound' to perform tasks once the browser locates the user.
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

      this.outerCircle = L.circleMarker(latlng,
        {
          radius: 14, //radius: accuracy
          color: '#a9c4f5',
          fillColor: '#ffffff',
          fillOpacity: 0.9,
        });
      this.circle = L.circleMarker(latlng,
        {
          radius: 9, //radius: accuracy
          color: '#2940a6',
          fillColor: '#2940a6',
          fillOpacity: 1
        });

      var featureGroup = L.featureGroup([this.outerCircle, this.circle]).addTo(this.map);

      // Find nearest fire hydrant
      this.FindNearestPoint(latlng);

      if (this.isNavigationOn) {
        // Fetch navigation route
        this.GetNavigationWaypoints(latlng.lat, latlng.lng);
      } else {
        this.navigationPolyline.removeFrom(this.map);
      }

    });
  }


  StartStopNavigation() {

    this.map.removeEventListener('locationfound');

    if (!this.isNavigationOn) {
      this.isNavigationOn = true;
      this.GetRealTimeUserLocation();
    } else {
      this.isNavigationOn = false;
      this.map.stopLocate();
      this.navigationPolyline.removeFrom(this.map);
    }
  }


  FindNearestPoint(latlng: L.LatLng) {

    this.minDistance = 10;

    for (const marker of this.fireHydrantMarkers) {

      this.distance = Math.abs(marker.Lat - latlng.lat) + Math.abs(marker.Lng - latlng.lng);

      if (this.distance < this.minDistance) {
        this.minDistance = this.distance;
        this.closestPoint = marker;
      }
    }

    this.nearestMarker = this.closestPoint;
    //console.log('nearestMarker: ' + this.nearestMarker.Address)

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
        },
        err => {
          //console.log(err);
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
        },
        err => {
          //console.log(err);
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


  AddNewFireHydrantPOI() {
    this.isAddNewLocationActive = !this.isAddNewLocationActive;

    if (this.isAddNewLocationActive) {
      this.PlaceNewPOIOnMap();
    }
  }

  async PlaceNewPOIOnMap() {

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

      }
    });
  }

  FillDetailsBeforeNewPost() {

    if (this.isAddNewLocationActive) {
      this.modalService.open(this.detailsToPost, { centered: true, size: 'sm', windowClass: 'zindex' });
    }
  }

  PostFireHydrantPOI() {

    L.marker([this.eventL.latlng.lat, this.eventL.latlng.lng], { icon: this.fireHydrantIcon }).addTo(this.map);

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
          }
        },
        err => {
          console.log(err);
        }
      );
  }

  GetNavigationWaypoints(currentUserLat: number, currentUserLng: number) {

    this.getPOI = this.dbFunctionService.getNavigationWaypoints(currentUserLat, currentUserLng, this.nearestMarker.Lat, this.nearestMarker.Lng) //user location, nearest fire hydrant
      .pipe(map((response: any) => {

        this.navigationWayPoints = [];

        const userLocationArray = [currentUserLat, currentUserLng];
        this.navigationWayPoints.push(userLocationArray);

        const navigationPOI = response.features[0].geometry.coordinates[0];

        let array = [];

        for (const poi of navigationPOI) {
          array = [poi[1], poi[0]];
          this.navigationWayPoints.push(array);
        }

        const nearestMarkerArray = [this.nearestMarker.Lat, this.nearestMarker.Lng];
        this.navigationWayPoints.push(nearestMarkerArray);

        if (this.navigationPolyline) {
          this.navigationPolyline.removeFrom(this.map);
        }

        this.navigationPolyline = new L.Polyline(this.navigationWayPoints, {
          color: 'blue',
          weight: 7,
          opacity: 0.6,
          smoothFactor: 1
        }).addTo(this.map).bringToBack();

      }))
      .subscribe(
        (res: any) => {
          if ((res != null) || (res != undefined)) {
            //console.log(res)
          }
        },
        err => {
          //console.log(err);
        }
      );
  }


  UserLogin() {

    this.modalService.open(this.userLogin, { centered: true, size: 'sm', windowClass: 'zindex' });

  }

  AuthenticateUser() {
    
    signInWithEmailAndPassword(this.auth, this.userEmail.trim(), this.userPassword.trim())
      .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        
        this.isUserLogedIn = true;
        this.isCredentialsWrong = false;
        this.loggedInUserId = user.uid;

        //this.accessToken = user.accessToken;

        this.modalService.dismissAll();

        this.GetFireHydrantsPOI();

      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;

        console.log(error.code, error.code)

        this.isUserLogedIn = false;
        this.isCredentialsWrong = true;
      });

  }

  dismissUserLoginModal() {
    this.map.off('click');
    this.map.closePopup();
    this.modalService.dismissAll();
  }

  dismissDetailsModal() {
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
