import { Component } from '@angular/core';
import { ChildClientService } from './child-client.service';

@Component({
  selector: 'iframe-rx-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent {
  title = 'child';

  constructor(private childClientService: ChildClientService) {
    this.childClientService.init();
  }
}
