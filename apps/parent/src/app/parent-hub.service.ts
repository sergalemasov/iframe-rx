import { Injectable } from '@angular/core';
import { RxPmHub, RxPmHubRegister, RxPmPublisher, RxPmHandler } from '@iframe-rx/rx-pm';
import { BehaviorSubject, of, timer } from 'rxjs';
import { AnotherService } from './another.service';

@Injectable()
@RxPmHub({channel: '123'})
export class ParentHubService implements RxPmHubRegister {
    constructor(anotherService: AnotherService) {
        anotherService.callMe();

        timer(1000, 1000)
            .subscribe(timerValue => this.call$.next({call: timerValue }))
    }

    registerClient!: (iframe: Window) => void;

    registerOnClient(fn: (iframe: Window) => void) {
        this.registerClient = fn;
    }

    registerDestroy() {

    }

    public registerIframe(iframe: Window) {
        this.registerClient(iframe);
    }

    @RxPmPublisher()
    public call$ = new BehaviorSubject({ call: 123 });

    @RxPmHandler()
    public makeCall$(callInfo: string) {
        return of({'message from parent': "call handled"});
    }
}
