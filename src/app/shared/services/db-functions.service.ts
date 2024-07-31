import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FireHydrantPoi } from '../models/fire-hydrant.model';
import { environment } from '../../../environments/environment';

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

    getNavigationWaypoints(Lat1: number, Lng1: number, Lat2: number, Lng2: number) {
        let options: any = {
            headers: {"Access-Control-Allow-Origin": "*"},  
            observe: 'response'
        }
        return this.http.get(environment.navigationURL + Lat1 + '%2C' + Lng1 + '%7C' + Lat2 + '%2C' + Lng2 + environment.navigationMode + environment.navigationAPIKey);
    }


}



