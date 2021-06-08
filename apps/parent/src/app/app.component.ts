import { AfterViewInit, Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { ParentHubService } from './parent-hub.service';

@Component({
  selector: 'iframe-rx-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent implements AfterViewInit{
  @ViewChild('iframeContainerRef') public iframeContainerRef!: ElementRef;

  constructor(private renderer: Renderer2, private parentHubService: ParentHubService) {}

  public ngAfterViewInit() {
    const iframe = this.renderer.createElement('iframe');

    this.parentHubService.registerIframe(iframe);

    iframe.src = 'http://localhost:4201';

    this.renderer.appendChild(this.iframeContainerRef.nativeElement, iframe);
  }
}
