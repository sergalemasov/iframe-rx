import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RxCallback } from './rx-callback';
import { RxMessageData } from './rx-message-data';

export function toPm$<T>(
    channelName: string,
    publisherName: string,
    publisher$: Observable<T>,
    targetWindow: Window,
    origin?: string
): Observable<void> {
    const unsubscriber$ = new Subject<void>();

    const unsubscribe = () => {
        unsubscriber$.next();
        unsubscriber$.complete();
    };

    const sender = new Sender<T>(targetWindow, origin);

    return new Observable(() => {
        publisher$
            .pipe(takeUntil(unsubscriber$))
            .subscribe({
                next: payload => {
                    const message: RxMessageData<T> = {
                        publisher: publisherName,
                        channel: channelName,
                        callback: RxCallback.NEXT,
                        payload
                    };

                    sender.send(message);
                },
                error: payload => {
                    const message: RxMessageData<T> = {
                        publisher: publisherName,
                        channel: channelName,
                        callback: RxCallback.ERROR,
                        payload
                    };

                    sender.send(message);
                },
                complete: () => {
                    const message: RxMessageData<T> = {
                        publisher: publisherName,
                        channel: channelName,
                        callback: RxCallback.COMPLETE
                    };

                    sender.send(message);
                }
            });

        return unsubscribe;
    });
}

class Sender<T> {
    constructor(private targetWindow: Window, private origin?: string) {}

    public send(payload: RxMessageData<T>) {
        this.targetWindow.postMessage(payload, this.origin || '*');
    }
}
