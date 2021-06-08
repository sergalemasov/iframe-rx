import { fromEvent, Observable, Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { RxCallback } from './rx-callback';
import { RxMessageData } from './rx-message-data';

export function fromPostMessage$<T>(
    channelName: string,
    publisherName: string,
    sourceWindow: Window
): Observable<T> {
    const unsubscriber$ = new Subject<void>();

    const unsubscribe = () => {
        unsubscriber$.next();
        unsubscriber$.complete();
    };

    return new Observable(observer => {
        fromEvent<MessageEvent>(sourceWindow, 'message')
            .pipe(
                map(({data}) => data as RxMessageData<T>),
                filter(data => data.channel === channelName),
                filter(data => data.publisher === publisherName),
                filter(data => [RxCallback.ERROR, RxCallback.NEXT, RxCallback.COMPLETE].includes(data.callback)),
                takeUntil(unsubscriber$)
            )
            .subscribe(
                data => {
                    switch(data.callback) {
                        case RxCallback.NEXT:
                            observer.next(data.payload)
                            break;
                        case RxCallback.ERROR:
                            observer.error(data.payload)
                            unsubscribe();
                            break;
                        case RxCallback.COMPLETE:
                            observer.complete();
                            unsubscribe();
                            break;
                    }
                },
                error => observer.error(error),
                () => observer.complete()
            );

        return unsubscribe;
    });
}

