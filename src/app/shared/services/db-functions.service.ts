import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FireHydrantPoi } from '../models/fire-hydrant.model';

@Injectable()
export class DbFunctionService {

    constructor(private http: HttpClient) { }

    getFireHydrantsFromDb() {
        let options: any = {
            headers: {"Access-Control-Allow-Origin": "*"},  
            observe: 'response'
        }
        return this.http.get<FireHydrantPoi>(environment.databaseURL + environment.fireHydrantTable + '.json');
    }

    postFireHydrantsToDb(fireHydrantMarkers: FireHydrantPoi) {
        let options: any = {
            headers: {"Access-Control-Allow-Origin": "*"}, 
            observe: 'response'
        }
        return this.http.post(environment.databaseURL + environment.fireHydrantTable + '.json', fireHydrantMarkers, options);
    }

    updateFireHydrantsToDb(fireHydrantMarker: FireHydrantPoi) {
        let options: any = {
            headers: {"Access-Control-Allow-Origin": "*"}, 
            observe: 'response'
        }
        return this.http.put(environment.databaseURL + environment.fireHydrantTable + '/' + fireHydrantMarker.Id + '.json', fireHydrantMarker, options);
    }


    getAddressDetails(Lat: number, Lng: number) {
        let options: any = {
            headers: {"Access-Control-Allow-Origin": "*"},  
            observe: 'response'
        }
        return this.http.get<FireHydrantPoi>(environment.reverseGeocodeURL + environment.reverseGeocodeLat + Lat + environment.reverseGeocodeLng + Lng + environment.reverseGeocodeOptions);
    }

    getNavigationWaypoints(currentUserLat: number, currentUserLng: number, nearestMarkerLat: number, nearestMarkerLng: number) {
        let options: any = {
            headers: {"Access-Control-Allow-Origin": "*"},  
            observe: 'response'
        }
        return this.http.get(environment.navigationURL + currentUserLat + '%2C' + currentUserLng + '%7C' + 
                                                        nearestMarkerLat + '%2C' + nearestMarkerLng + 
                                                         environment.navigationMode + environment.navigationAPIKey);
    }


}



