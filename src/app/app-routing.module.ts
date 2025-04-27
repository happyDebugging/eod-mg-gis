import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { GisMapComponent } from './gis-map/gis-map.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: GisMapComponent },

  { path: 'reset-password/session/:session-id', pathMatch: 'full', component: ResetPasswordComponent},

  //{ path: '', pathMatch: 'full', redirectTo: '' }, 
  { path: '**', pathMatch: 'full', redirectTo: ''},  // Wildcard route for a 404 page
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
