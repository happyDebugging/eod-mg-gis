import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FireHydrantPoi } from '../models/fire-hydrant.model';
import { environment } from '../../../environments/environment';

@Injectable()
export class DbFunctionService {
    //postItDetails: PostItDetails;

    constructor(private http: HttpClient) { }

    getFireHydrantsFromDb() {
        let options: any = {
            headers: {"Access-Control-Allow-Origin": "*"},  
            observe: 'response'
        }
        return this.http.get<FireHydrantPoi>(environment.databaseURL + environment.fireHydrantTable);
    }

    postFireHydrantsToDb(fireHydrantMarkers: FireHydrantPoi) {
        let options: any = {
            //params: {},
            headers: {"Access-Control-Allow-Origin": "*"}, 
            observe: 'response'
        }
        return this.http.post(environment.databaseURL + environment.fireHydrantTable, fireHydrantMarkers, options);
    }

    // updateFireHydrantsToDb(fireHydrantMarkers: FireHydrantPoi) {
    //     let options: any = {
    //         //params: {}, 
    //         observe: 'response'
    //     }
    //     return this.http.post(environment.databaseURL, fireHydrantMarkers, options);
    // }


}
