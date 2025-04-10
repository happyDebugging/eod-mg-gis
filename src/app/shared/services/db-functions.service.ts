import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FireHydrantPoi } from '../models/fire-hydrant.model';
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class DbFunctionService {


    // Initialize Supabase
    private supabase: SupabaseClient

    constructor(private http: HttpClient) {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
     }

    async getFireHydrantsFromDb() {
        let options: any = {
            headers: {"Access-Control-Allow-Origin": "*"},  
            observe: 'response'
        }
        //return this.http.get<FireHydrantPoi>(environment.databaseURL + environment.fireHydrantTable + '.json');

        const data = await this.supabase.from('fireHydrantPOI').select('*'); 

        return data["data"];
    }

    async postFireHydrantsToDb(fireHydrantMarkers: FireHydrantPoi) {
        let options: any = {
            headers: {"Access-Control-Allow-Origin": "*"}, 
            observe: 'response'
        }
        //return this.http.post(environment.databaseURL + environment.fireHydrantTable + '.json', fireHydrantMarkers, options);

        const data = await this.supabase.from('fireHydrantPOI')
            .insert({
                Lat: fireHydrantMarkers.Lat,
                Lng: fireHydrantMarkers.Lng,
                Address: fireHydrantMarkers.Address,
                State: fireHydrantMarkers.State,
                StateDescription: fireHydrantMarkers.StateDescription,
                HoseDiameter: fireHydrantMarkers.HoseDiameter,
                Responsible: fireHydrantMarkers.Responsible,
                Type: fireHydrantMarkers.Type
            }).select();

        return data;
    }

    async updateFireHydrantsToDb(fireHydrantMarker: FireHydrantPoi) {
        let options: any = {
            headers: {"Access-Control-Allow-Origin": "*"}, 
            observe: 'response'
        }
        //return this.http.put(environment.databaseURL + environment.fireHydrantTable + '/' + fireHydrantMarker.Id + '.json', fireHydrantMarker, options);

        const data = await this.supabase.from('fireHydrantPOI').update({
                Lat: fireHydrantMarker.Lat,
                Lng: fireHydrantMarker.Lng,
                Address: fireHydrantMarker.Address,
                State: fireHydrantMarker.State,
                StateDescription: fireHydrantMarker.StateDescription,
                HoseDiameter: fireHydrantMarker.HoseDiameter,
                Responsible: fireHydrantMarker.Responsible,
                Type: fireHydrantMarker.Type
        }).eq('Id', fireHydrantMarker.Id);

        return data;
    }


    getAddressDetails(Lat: number, Lng: number) {
        let options: any = {
            headers: {"Access-Control-Allow-Origin": "*"},  
            observe: 'response'
        }
        //return this.http.get<FireHydrantPoi>(environment.reverseGeocodeURL + environment.reverseGeocodeLat + Lat + environment.reverseGeocodeLng + Lng + environment.reverseGeocodeOptions);
        return this.http.get<FireHydrantPoi>(environment.reverseGeocodeURL + Lat + '%2C' + Lng + environment.apiKey + environment.reverseGeocodeOptions);
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



