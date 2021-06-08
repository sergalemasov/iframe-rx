import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ChildClientService } from './child-client.service';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [ChildClientService],
  bootstrap: [AppComponent],
})
export class AppModule {}
