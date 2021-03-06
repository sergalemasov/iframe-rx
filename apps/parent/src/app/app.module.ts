import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AnotherService } from './another.service';

import { AppComponent } from './app.component';
import { ParentHubService } from './parent-hub.service';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [ParentHubService, AnotherService],
  bootstrap: [AppComponent],
})
export class AppModule {}
