import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GisMapComponent } from './gis-map/gis-map.component';
import { HttpClientModule } from '@angular/common/http';
import { DbFunctionService } from './shared/services/db-functions.service';

@NgModule({
  declarations: [
    AppComponent,
    GisMapComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    HttpClientModule
  ],
  providers: [
    DbFunctionService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
