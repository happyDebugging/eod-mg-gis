// import { Injectable } from '@angular/core';
// import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
// import { Observable, throwError } from 'rxjs';
// import { catchError, retry } from 'rxjs/operators';
// import { Visitors } from '../models/visitor-details.model';
// import { environment } from 'src/environments/environment';

// @Injectable({
//   providedIn: 'root'
// })
// export class VisitorsService {

//   constructor(private http: HttpClient) { }

//   getIpAddress() {
//     return this.http.get('http://api.ipify.org/?format=json;');
//   }

//   getGEOLocation(ip: any) {
//     let url = 'http://ipinfo.io/' + ip + '?token=6afdb54c9ec5e3';
//     return this.http.get(url);
//   }

//   saveVisitorDetails(visitorDetails: Visitors) {
//     let options: any = {
//         //params: {}, 
//         observe: 'response'
//     }
//     return this.http.post(environment.postItAdminRepoURL + environment.visitorsTable, visitorDetails, options);
// }

// }