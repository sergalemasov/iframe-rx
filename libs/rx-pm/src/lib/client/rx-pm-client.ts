import 'reflect-metadata';
import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { fromPostMessage$ } from '../rx-pm-adapter/from-post-message';
import { RxPmProxy } from '../rx-pm-proxy/rx-pm-proxy';
import { SystemSignal } from '../system/system-signal';
import { rxPmRequestersMetaKey } from './rx-pm-requester';
import { RxPmSubscriberBehavior, RxPmSubscriberMeta, rxPmSubscribersMetaKey } from './rx-pm-subscriber';

export interface RxPmClientMeta {
    channel: string;
}

export function RxPmClient(clientMeta: RxPmClientMeta): Function {
    return function (ClientConstructor: any) {
        if (!(ClientConstructor.prototype.registerInit && ClientConstructor.prototype.registerDestroy)) {
            throw new Error(`The class decorated with ${RxPmClient.name} must implement RxPmClientRegister interface!`);
        }

        let proxy: RxPmProxy | null = null;
        const destroy$ = new Subject<void>();

        const requesters: {
            name: string;
        }[] = Reflect.getMetadata(rxPmRequestersMetaKey, ClientConstructor.prototype) ?? [];

        const subscribers: {
            name: string;
            meta: RxPmSubscriberMeta;
        }[] = Reflect.getMetadata(rxPmSubscribersMetaKey, ClientConstructor.prototype) ?? [];

        return class extends ClientConstructor {
            constructor(...args: any[]) {
                super(...args);

                subscribers.forEach(subscriber => this[subscriber.name] =
                    subscriber.meta.behavior === RxPmSubscriberBehavior.REPLAY
                        ? new ReplaySubject(1)
                        : new Subject()
                );

                const initFn = (currentWindow: Window, targetWindow: Window) => {
                    proxy = new RxPmProxy();
                    proxy.start();

                    requesters.forEach(requester => this[requester.name] = function (payload: any) {
                        return proxy?.send$({
                            channel: clientMeta.channel,
                            requester: requester.name,
                            payload
                        }, targetWindow);
                    });

                    subscribers.forEach(subscriber => {
                        fromPostMessage$(clientMeta.channel, subscriber.name, currentWindow)
                            .pipe(takeUntil(destroy$))
                            .subscribe(this[subscriber.name]);
                    });

                    proxy.send$({
                        channel: clientMeta.channel,
                        __system__: SystemSignal.CLIENT_INIT,
                        subscribers: subscribers.map(({name}) => name)
                    }, targetWindow)
                        .pipe(takeUntil(destroy$))
                        .subscribe(
                            // TODO: probably add warning about not implemented subscribers.
                        );
                };

                const destroyFn = () => {
                    proxy?.stop();
                    proxy = null;
                    destroy$.next();
                    destroy$.complete();
                };

                this.registerInit(initFn);
                this.registerDestroy(destroyFn);
            }
        }
    }
}
