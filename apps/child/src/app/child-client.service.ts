import { Injectable } from '@angular/core';
import { RxPmClient, RxPmClientRegister, RxPmRequester, RxPmSubscriber } from '@iframe-rx/rx-pm';
import { Observable } from 'rxjs';

@Injectable()
@RxPmClient({channel: '123'})
export class ChildClientService implements RxPmClientRegister {
    @RxPmSubscriber()
    public call$!: Observable<any>;

    @RxPmRequester()
    public makeCall$!: (payload: string) => Observable<void>;

    private rxPmInit!: (currentWindow: Window, target: Window) => void;

    init() {
        this.call$.subscribe(value => console.log('asdfasdfasdf2334123',value));

        this.rxPmInit(window, window.parent);

        this.makeCall$('123').subscribe(callInfo => console.log('asdfasdf', callInfo));
    }



    registerInit(fn: (currentWindow: Window, target: Window) => void) {
        this.rxPmInit = fn;
    }

    registerDestroy() {}
}
