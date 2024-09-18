import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener, } from '@angular/core';
import { Route } from '@angular/router';
import { map, Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as L from 'leaflet';
import * as LMR from 'leaflet-marker-rotation';

import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, signOut, updatePassword } from "firebase/auth";

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
  orientationMarker!: LMR.RotatedMarker;
  orientationPolygon!: L.Polygon<any>;
  setView = true;
  isNavigationOn = false;
  isNavigationToSelectedMarker = false;
  isUserLoggedIn = false;
  distance = 0;
  minDistance = 10;
  closestPoint: FireHydrantPoi = { Id: '', Lat: 0, Lng: 0, Address: 'a', State: 'b', StateDescription: '', HoseDiameter: '', Responsible: '', Type: '' };
  nearestMarker!: FireHydrantPoi;
  selectedMarkerLat = 0;
  selectedMarkerLng = 0;
  fireHydrantId = '';
  fireHydrantAddress = '';
  fireHydrantState = '';
  fireHydrantStateDescription = '';
  hoseDiameter = '';
  fireHydrantType = '';
  fireHydrantLat = 0;
  fireHydrantLng = 0;
  isAddNewLocationActive = false;
  isMoveMarkerActive = false;
  markerToMove!: L.Marker<any>;
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
  newUserPassword = '';
  newUserPasswordConfirmation = '';
  isPassword6Characters = true;
  isChangePasswordSuccessfull = false;
  errorMessageToShow = '';

  // test orientation
  absolute = false;
  alpha = 0;
  beta = 0;
  gamma = 0;

  @ViewChild('userLogin') userLogin: any;
  @ViewChild('userSignOut') userSignOut: any;
  @ViewChild('manageUserAccount') manageUserAccount: any;
  @ViewChild('updatePassword') updatePassword: any;
  @ViewChild('details') details: any;
  @ViewChild('detailsToPost') detailsToPost: any;
  @ViewChild('changePasswordSuccessfullAlert') changePasswordSuccessfullAlert: any;

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

  fireHydrantMarkers = [{ Id: '', Lat: 0, Lng: 0, Address: '', State: '', StateDescription: '', HoseDiameter: '', Responsible: '', Type: '' }];
  fireHydrantLayer: L.Marker<any>[] = [];
  fireHydrantLayerGroup: L.LayerGroup<any> = L.layerGroup([]);

  fireHydrantIcon = L.icon({
    iconUrl: 'fire-hydrant-marker-icon.png',
    iconSize: [45, 45],
    iconAnchor: [22.5, 32]
  });

  waterTankIcon = L.icon({
    iconUrl: 'water-tank-marker-icon.png',
    iconSize: [45, 45],
    iconAnchor: [22.5, 32]
  });

  userLocationIcon = L.icon({
    iconUrl: 'user-location-marker-icon.png',
    iconSize: [45, 45]
  });

  orientationIcon = L.icon({
    iconUrl: 'orientation-marker.png',
    iconSize: [60, 60],
    iconAnchor:   [30.5, 43]
  });

  constructor(private dbFunctionService: DbFunctionService, private modalService: NgbModal, private elementRef: ElementRef) { }

  ngOnInit(): void {

    this.isUserLoggedIn = JSON.parse(JSON.stringify(localStorage.getItem("isUserLoggedIn")));
    this.loggedInUserId = JSON.parse(JSON.stringify(localStorage.getItem("loggedInUserId")));

    // Initialize Firebase
    const firebaseApp = initializeApp(this.firebaseConfig);
    // Initialize Realtime Database and get a reference to the service
    const database = getDatabase(firebaseApp);
    this.auth = getAuth(firebaseApp);

    // Initiate map
    this.map = L.map('map', { attributionControl: false }).setView([39.340313, 22.937627], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.map);

    // this.SaveFireHydrantsPOIs();

  }

  ngAfterViewInit(): void {

    // Get device orientation
    window.addEventListener("deviceorientation", (event: any) => {
      this.absolute = event.absolute;
      this.alpha = event.alpha; // x
      this.beta = event.beta; // y
      this.gamma = event.gamma; // z

      console.log(this.absolute, ' ', this.alpha, ' ', this.beta, ' ', this.gamma)
    }, true);

    this.GetFireHydrantsPOI();

    this.GetRealTimeUserLocation();
  }

  AddFireHydrantMarkersOnMap() {

    if (this.fireHydrantLayer.length > 0) {
      this.map.removeLayer(this.fireHydrantLayerGroup);
      this.fireHydrantLayer = [];
    }

    let markerIcon = this.fireHydrantIcon;

    // Add fire hydrant POI on map
    for (const marker of this.fireHydrantMarkers) {

      if (marker.Type == 'fire_hydrant') {
        markerIcon = this.fireHydrantIcon;
      } else if (marker.Type == 'water_tank') {
        markerIcon = this.waterTankIcon;
      }

      let popupInfo = L.popup({}).setContent('');

      if (this.isUserLoggedIn) {
        popupInfo = L.popup({ minWidth: 150, maxWidth: 150, offset: [0, -8] })
          .setContent(
            '<b>' + marker.Address + '</b><br>' + marker.StateDescription + '  ' +
            `
            <div class="d-grid">
              
                <button type="button" class="btn btn-secondary btn-sm mb-1 edit"> 
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                    <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                  </svg>
                  Επεξεργασία
                </buton>
                
                <button type="button" class="btn btn-primary btn-sm mb-1 navigateToHere"> 
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sign-turn-left" viewBox="0 0 16 16">
                  <path d="M11 8.5A2.5 2.5 0 0 0 8.5 6H7V4.534a.25.25 0 0 0-.41-.192L4.23 6.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 7 8.466V7h1.5A1.5 1.5 0 0 1 10 8.5V11h1z"/>
                  <path fill-rule="evenodd" d="M6.95.435c.58-.58 1.52-.58 2.1 0l6.515 6.516c.58.58.58 1.519 0 2.098L9.05 15.565c-.58.58-1.519.58-2.098 0L.435 9.05a1.48 1.48 0 0 1 0-2.098zm1.4.7a.495.495 0 0 0-.7 0L1.134 7.65a.495.495 0 0 0 0 .7l6.516 6.516a.495.495 0 0 0 .7 0l6.516-6.516a.495.495 0 0 0 0-.7L8.35 1.134Z"/>
                  </svg>
                  Πλοήγηση
                </buton>
              
                <button type="button" class="btn btn-info btn-sm moveMarker"> 
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrows-move" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10M.146 8.354a.5.5 0 0 1 0-.708l2-2a.5.5 0 1 1 .708.708L1.707 7.5H5.5a.5.5 0 0 1 0 1H1.707l1.147 1.146a.5.5 0 0 1-.708.708zM10 8a.5.5 0 0 1 .5-.5h3.793l-1.147-1.146a.5.5 0 0 1 .708-.708l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L14.293 8.5H10.5A.5.5 0 0 1 10 8"/>
                  </svg>
                  Μετατόπιση
                </buton>
              
            </div>
      `
          );


        this.fireHydrantLayer.push(
          L.marker([marker.Lat, marker.Lng], { icon: markerIcon })
            .bindPopup(popupInfo)
            .on("popupopen", e => {
              this.elementRef.nativeElement
                .querySelector(".edit")
                .addEventListener("click", (e: any) => {
                  this.FillDetailsForUpdate(marker);
                }),
                this.elementRef.nativeElement
                  .querySelector(".navigateToHere")
                  .addEventListener("click", (e: any) => {
                    console.log('.navigateToHere')
                    this.NavigateToSelectedMarker(marker);
                  }),
                this.elementRef.nativeElement
                  .querySelector(".moveMarker")
                  .addEventListener("click", (e: any) => {
                    console.log('.moveMarker')
                    this.MoveMarker(marker);
                  })
            })
        )

      } else {
        popupInfo = L.popup({ minWidth: 150, maxWidth: 150, offset: [0, -8] })
          .setContent(
            '<b>' + marker.Address + '</b><br>' + marker.StateDescription + '  ' +
            `<div class="d-grid">
            <button type="button" class="btn btn-primary btn-sm navigateToHere"> 
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sign-turn-left" viewBox="0 0 16 16">
              <path d="M11 8.5A2.5 2.5 0 0 0 8.5 6H7V4.534a.25.25 0 0 0-.41-.192L4.23 6.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 7 8.466V7h1.5A1.5 1.5 0 0 1 10 8.5V11h1z"/>
              <path fill-rule="evenodd" d="M6.95.435c.58-.58 1.52-.58 2.1 0l6.515 6.516c.58.58.58 1.519 0 2.098L9.05 15.565c-.58.58-1.519.58-2.098 0L.435 9.05a1.48 1.48 0 0 1 0-2.098zm1.4.7a.495.495 0 0 0-.7 0L1.134 7.65a.495.495 0 0 0 0 .7l6.516 6.516a.495.495 0 0 0 .7 0l6.516-6.516a.495.495 0 0 0 0-.7L8.35 1.134Z"/>
              </svg>
              Πλοήγηση
            </buton>
          </div>
      `);

        this.fireHydrantLayer.push(
          L.marker([marker.Lat, marker.Lng], { icon: markerIcon })
            .bindPopup(popupInfo)
            .on("popupopen", e => {
              this.elementRef.nativeElement
                .querySelector(".navigateToHere")
                .addEventListener("click", (e: any) => {
                  console.log('.navigateToHere')
                  this.NavigateToSelectedMarker(marker);
                })
            })
        )
      }

      this.fireHydrantLayerGroup = L.layerGroup(this.fireHydrantLayer).addTo(this.map);
    }

  }

  GetUserLocation() {
    if (this.userLocationLat != 0 && this.userLocationLng != 0 && (this.isNavigationOn || this.isNavigationToSelectedMarker)) {
      this.map.flyTo([this.userLocationLat, this.userLocationLng], 18);
    }
    if (!this.isNavigationOn && !this.isNavigationToSelectedMarker) {
      this.GetRealTimeUserLocation();
    }
  }

  GetRealTimeUserLocation() {

    // Locate user
    if (!this.isNavigationOn && !this.isNavigationToSelectedMarker) {
      const userLocation = this.map.locate({ setView: true, maxZoom: 18, enableHighAccuracy: true });
    } else {
      this.map.stopLocate();
      console.log('else')
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
        this.map.removeLayer(this.orientationMarker);
      }

      this.orientationMarker = new LMR.RotatedMarker([latlng.lat, latlng.lng], { 
        icon: this.orientationIcon,
        rotationAngle: this.alpha + 90,
        //rotationOrigin: 'center'
      }).addTo(this.map);
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

      // let a = this.alpha;
      // let a1 = this.alpha - 10;
      // let a2 = this.alpha + 10;
      // let x1 = (this.map.getZoom() / 8) * Math.cos(a1) / 10000;
      // let y1 = (this.map.getZoom() / 8) * Math.sin(a1) / 10000;
      // let x2 = (this.map.getZoom() / 8) * Math.cos(a2) / 10000;
      // let y2 = (this.map.getZoom() / 8) * Math.sin(a2) / 10000;

      // console.log(this.map.getZoom())

      // this.orientationPolygon = L.polygon([
      //   [latlng.lat, latlng.lng],
      //   [latlng.lat + y1, latlng.lng + x1],
      //   [latlng.lat + y2, latlng.lng + x2]
      //   //[latlng.lat + 0.0001, latlng.lng - 0.0001],
      //   //[latlng.lat + 0.0001, latlng.lng + 0.0001]
      // ],
      //   { color: 'red',
      //     smoothFactor: 5
      //   });

      var featureGroup = L.featureGroup([this.outerCircle, this.circle]).addTo(this.map);

      if (!this.isNavigationToSelectedMarker) {
        // Find nearest fire hydrant
        this.FindNearestPoint(latlng);
      }

      if (this.isNavigationOn) {
        console.log('isNavigationOn')
        // Fetch navigation route
        this.GetNavigationWaypoints(latlng.lat, latlng.lng, this.nearestMarker.Lat, this.nearestMarker.Lng);
      } else if (this.isNavigationToSelectedMarker) {
        console.log('isNavigationToSelectedMarker')
        // Fetch selected point navigation route
        this.GetNavigationWaypoints(latlng.lat, latlng.lng, this.selectedMarkerLat, this.selectedMarkerLng);
      } else {
        this.navigationPolyline.removeFrom(this.map);
      }

    });
  }


  StartStopNavigation() {

    this.map.removeEventListener('locationfound');
    this.isNavigationToSelectedMarker = false;

    if (!this.isNavigationOn) {
      this.isNavigationOn = true;
      this.GetRealTimeUserLocation();
    } else {
      this.isNavigationOn = false;
      this.map.stopLocate();
      this.navigationPolyline.removeFrom(this.map);
    }
  }

  NavigateToSelectedMarker(marker: FireHydrantPoi) {
    this.map.removeEventListener('locationfound');

    this.isNavigationOn = false;
    this.isNavigationToSelectedMarker = true;

    this.selectedMarkerLat = marker.Lat;
    this.selectedMarkerLng = marker.Lng;

    this.GetRealTimeUserLocation();
  }

  MoveMarker(marker: FireHydrantPoi) {
    this.map.closePopup();

    this.isMoveMarkerActive = true;

    this.markerToMove = this.fireHydrantLayer[this.fireHydrantMarkers.indexOf(marker)];
    //this.markerToMove = moveableMarker;

    this.markerToMove.dragging?.enable();

    this.markerToMove.on('dragend', (e) => {
      //console.log(e.target._latlng.lat);
      //console.log(e.target._latlng.lng);

      marker.Lat = e.target._latlng.lat;
      marker.Lng = e.target._latlng.lng;

      this.markerToMove.dragging?.disable();

    });

    this.markerToMove.on('dragend', (e) => {
      this.isMoveMarkerActive = false;

      this.UpdateLocationOfMovedMarker(marker);
    });
  }

  UpdateLocationOfMovedMarker(movedMarker: FireHydrantPoi) {

    this.updatePOI = this.dbFunctionService.updateFireHydrantsToDb(movedMarker)
      .pipe(map((response: any) => {

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

  CancelMoveMarker() {
    this.isMoveMarkerActive = false;

    this.markerToMove.dragging?.disable();
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
        let markerArray: FireHydrantPoi[] = [];

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
              resObj.Lat = data.Lat; // + 0.000015; // +offset of marker icon centre
              resObj.Lng = data.Lng;
              resObj.Address = data.Address;
              resObj.State = data.State;
              resObj.StateDescription = data.StateDescription;
              resObj.HoseDiameter = data.HoseDiameter;
              resObj.Responsible = data.Responsible;
              resObj.Type = data.Type;

              this.fireHydrantMarkers.push(resObj);
            }
            //console.log(this.fireHydrantMarkers);
            this.AddFireHydrantMarkersOnMap();
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
        //console.log(response)

        // Reverse geocode with nominatim
        // const geocodingResult = response.features[0].properties.geocoding;
        // const addressName = geocodingResult.name;
        // const addressStreet = geocodingResult.street;
        // const addressHousenumber = geocodingResult.housenumber;
        // const addressLocality = geocodingResult.locality;

        // let fullAddress = '';
        // if (addressName != null) {
        //   fullAddress = fullAddress + addressName  + ', ';
        // }
        // if (addressStreet != null) {
        //   fullAddress = fullAddress + addressStreet;
        // }
        // if (addressHousenumber != null) {
        //   fullAddress = fullAddress + ' ' + addressHousenumber;
        // }
        // if (addressLocality != null) {
        //   fullAddress = fullAddress + ', ' + addressLocality;
        // }
        // console.log(fullAddress)

        // Reverse geocode with OpenCage
        //road, house_number, hamlet/town/neighbourhood, city
        let geocodingResult = response.features[0].properties.components;
        let addressRoad = geocodingResult.road;
        let addressHousenumber = geocodingResult.house_number;
        let addressHamlet = geocodingResult.hamlet;
        let addressTown = geocodingResult.town;
        let addressNeighbourhood = geocodingResult.neighbourhood;
        let addressCity = geocodingResult.city;

        let fullAddress = '';

        if (addressRoad != null && addressRoad != 'unnamed road') {
          fullAddress = fullAddress + addressRoad;
        }

        if (addressHousenumber != null) {
          fullAddress = fullAddress + ' ' + addressHousenumber;
        }

        if ((addressRoad != null && addressRoad != 'unnamed road') || addressHousenumber != null) {
          fullAddress = fullAddress + ', ';
        }

        if (addressHamlet != null) {
          fullAddress = fullAddress + addressHamlet;
        } else if (addressTown != null) {
          fullAddress = fullAddress + addressTown;
        } else if (addressNeighbourhood != null) {
          fullAddress = fullAddress + addressNeighbourhood;
        }

        if (addressHamlet != null || addressTown != null || addressNeighbourhood != null) {
          fullAddress = fullAddress + ', ';
        }

        if (addressCity != null) {
          if (addressCity == 'Δήμος Βόλου') addressCity = 'Βόλος'
          fullAddress = fullAddress + addressCity;
        }

        this.fireHydrantAddress = fullAddress;
        //console.log(fullAddress)

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
      fireHydrants.Responsible = m.Responsible;
      fireHydrants.Type = m.Type;

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
    this.fireHydrantType = marker.Type;
    this.fireHydrantState = marker.State;
    if (this.fireHydrantState == 'active') { this.fireHydrantStateDescription = 'Ενεργό'; }
    else if (this.fireHydrantState == 'inactive') { this.fireHydrantStateDescription = 'Μη Ενεργό'; }
    else if (this.fireHydrantState == 'undefined') { this.fireHydrantStateDescription = 'Δεν Ελέγχθηκε'; }
    this.hoseDiameter = marker.HoseDiameter;

    this.modalService.open(this.details, { centered: true, size: 'sm', windowClass: 'zindex' });

  }


  AddNewFireHydrantPOI() {
    this.isAddNewLocationActive = !this.isAddNewLocationActive;

    if (this.isAddNewLocationActive) {
      this.PlaceNewPOIOnMap();
    }
  }

  PlaceNewPOIOnMap() {

    this.map.on('click', (event) => {

      this.modalService.dismissAll();

      this.ResetFireHydrantDetails();

      if (this.isAddNewLocationActive) {
        //console.log(event.latlng)

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

    //L.marker([this.eventL.latlng.lat, this.eventL.latlng.lng]).addTo(this.map);

    this.dismissDetailsModal();

    let fireHydrant = new FireHydrantPoi;
    console.log(this.fireHydrantId)
    fireHydrant.Id = this.fireHydrantId;
    fireHydrant.Lat = this.fireHydrantLat;
    fireHydrant.Lng = this.fireHydrantLng;
    fireHydrant.Address = this.fireHydrantAddress;
    fireHydrant.Type = this.fireHydrantType;
    fireHydrant.State = this.fireHydrantState;
    if (this.fireHydrantState == 'active') { fireHydrant.StateDescription = 'Ενεργή'; }
    else if (this.fireHydrantState == 'inactive') { fireHydrant.StateDescription = 'Μη Ενεργή'; }
    else if (this.fireHydrantState == 'undefined') { fireHydrant.StateDescription = 'Δεν Ελέγχθηκε'; }
    fireHydrant.HoseDiameter = this.hoseDiameter;
    fireHydrant.Responsible = this.loggedInUserId;

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
    updatedMarker.Type = this.fireHydrantType;
    updatedMarker.State = this.fireHydrantState;
    if (this.fireHydrantState == 'active') { updatedMarker.StateDescription = 'Ενεργό'; }
    else if (this.fireHydrantState == 'inactive') { updatedMarker.StateDescription = 'Μη Ενεργό'; }
    else if (this.fireHydrantState == 'undefined') { updatedMarker.StateDescription = 'Δεν Ελέγχθηκε'; }
    updatedMarker.HoseDiameter = this.hoseDiameter;
    updatedMarker.Responsible = this.loggedInUserId;

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

  GetNavigationWaypoints(currentUserLat: number, currentUserLng: number, markerLat: number, markerLng: number) {

    this.getPOI = this.dbFunctionService.getNavigationWaypoints(currentUserLat, currentUserLng, markerLat, markerLng) //user location, nearest fire hydrant
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

        if (this.isNavigationOn) {
          const nearestMarkerArray = [this.nearestMarker.Lat, this.nearestMarker.Lng];
          this.navigationWayPoints.push(nearestMarkerArray);
        } else if (this.isNavigationToSelectedMarker) {
          const selectedMarkerArray = [this.selectedMarkerLat, this.selectedMarkerLng];
          this.navigationWayPoints.push(selectedMarkerArray);
        }

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

    this.errorMessageToShow = '';

    signInWithEmailAndPassword(this.auth, this.userEmail.trim(), this.userPassword.trim())
      .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;

        this.isUserLoggedIn = true;
        localStorage.setItem("isUserLoggedIn", "true");

        this.isCredentialsWrong = false;

        this.userEmail = '';
        this.userPassword = '';

        this.loggedInUserId = user.uid;
        localStorage.setItem("loggedInUserId", user.uid);

        //this.accessToken = user.accessToken;

        this.modalService.dismissAll();

        this.GetFireHydrantsPOI();

      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;

        console.log(error.code)

        if (error.code = 'auth/invalid-credential') {
          this.errorMessageToShow = 'Λάθος email ή κωδικός πρόσβασης.';
        } else if (error.code = 'auth/too-many-requests') {
          this.errorMessageToShow = 'Υπέρβαση προσπαθειών σύνδεσης, προσπαθήστε αργότερα.';
        } else {
          this.errorMessageToShow = '';
        }

        this.isUserLoggedIn = false;
        localStorage.clear();

        this.isCredentialsWrong = true;
      });

  }

  UserSignOutConfirmation() {
    this.modalService.dismissAll();
    this.modalService.open(this.userSignOut, { centered: true, size: 'sm', windowClass: 'zindex' });
  }

  UserSignOut() {
    this.modalService.dismissAll();

    signOut(this.auth).then(() => {
      // Sign-out successful.
      this.isUserLoggedIn = false;
      localStorage.clear();

      this.dismissDetailsModal();

      this.GetFireHydrantsPOI();

    }).catch((error) => {
      // An error happened.
      console.log(error)
    });
  }

  ManageUserAccount() {
    this.modalService.dismissAll();

    this.newUserPassword = '';
    this.newUserPasswordConfirmation = '';

    this.modalService.open(this.manageUserAccount, { centered: true, size: 'sm', windowClass: 'zindex' });
  }

  PrepareToUpdateUserPassword() {
    this.modalService.dismissAll();
    this.modalService.open(this.updatePassword, { centered: true, size: 'sm', windowClass: 'zindex' });
  }

  UpdateUserPassword() {

    const user = this.auth.currentUser;

    updatePassword(user, this.newUserPassword).then(() => {
      // Update successful.
      this.modalService.dismissAll();
      this.isChangePasswordSuccessfull = true;

      this.newUserPassword = '';
      this.newUserPasswordConfirmation = '';
      this.isPassword6Characters = true;

      setTimeout(() => {
        this.isChangePasswordSuccessfull = false;
      }, 2000);

    }).catch((error) => {
      console.log(error)

      this.isPassword6Characters = false;
    });
  }

  dismissUserLoginModal() {
    this.map.off('click');
    this.map.closePopup();
    this.modalService.dismissAll();

    this.userEmail = '';
    this.userPassword = '';
    this.isCredentialsWrong = false;
  }

  dismissDetailsModal() {
    this.map.off('click');
    this.map.closePopup();
    this.isAddNewLocationActive = false; //!this.isAddNewLocationActive;
    this.modalService.dismissAll();
  }

  ResetFireHydrantDetails() {
    this.fireHydrantId = '';
    this.fireHydrantLat = 0;
    this.fireHydrantLng = 0;
    this.fireHydrantAddress = '';
    this.fireHydrantType = '';
    this.fireHydrantState = '';
    this.fireHydrantStateDescription = '';
    this.hoseDiameter = '';
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
