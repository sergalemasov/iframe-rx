import { fromEvent, merge, Observable, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { toPm$ } from '../rx-pm-adapter/to-post-message';
import { RxPmProxy } from '../rx-pm-proxy/rx-pm-proxy';
import { SystemSignal } from '../system/system-signal';
import { RxPmHandler, rxPmHandlersMetaKey } from './rx-pm-handler';
import { RxPmPublisher, rxPmPublishersMetaKey } from './rx-pm-publisher';

export interface RxPmHubRegister {
    registerDestroy: (fn: () => void) => void;
    registerOnClient: (fn: (clientWindow: Window) => void) => void;
}

export interface RxPmHubMeta {
    channel: string;
}

export function RxPmHub(hubMeta: RxPmHubMeta): Function {
    return function (HubConstructor: any) {
        if (!(HubConstructor.prototype.registerOnClient)) {
            throw new Error(`The class decorated with ${RxPmHub.name} must implement RxPmHubRegister interface!`);
        }

        const handlers: {
            name: string;
        }[] = Reflect.getMetadata(rxPmHandlersMetaKey, HubConstructor.prototype) ?? [];

        const publishers: {
            name: string;
        }[] = Reflect.getMetadata(rxPmPublishersMetaKey, HubConstructor.prototype) ?? [];

        const destroy$ = new Subject<void>();

        class DecoratedHubConstructor extends HubConstructor {
            constructor(...args: any[]) {
                super(...args);

                handlers.forEach(handler => {
                    if (!Function.prototype.isPrototypeOf(this[handler.name])
                    ) {
                        throw new Error(
                            `The property ${handler.name} decorated with ${RxPmHandler.name} ` +
                            `must be a function returning completed observable`
                        );
                    }
                });

                publishers.forEach(publisher => {
                    if (!Observable.prototype.isPrototypeOf(this[publisher.name])) {
                        throw new Error(
                            `The property ${publisher.name} decorated with ${RxPmPublisher.name} must be ` +
                            `an instance of Observable or one of inheriting classes (Subject, ReplaySubject, etc.)`
                        );
                    }
                });

                const destroyFn = () => {
                    destroy$.next();
                    destroy$.complete();
                };

                const onClientFn = (clientWindow: any) => {
                    const proxy = new RxPmProxy({
                        get eventSourceOverrideWindow() {
                            return clientWindow.contentWindow;
                        }
                    });

                    const clientUnsubscriber$ = new Subject<void>();

                    const unsubscribeClient = () => {
                        proxy.removeHandler('__system__');
                        publishers.forEach(({name}) => proxy.removeHandler(name));
                        proxy.stop();

                        clientUnsubscriber$.next();
                        clientUnsubscriber$.complete();
                    };

                    handlers.forEach(handler => {
                        proxy.addHandler(handler.name, {
                            test: (message: any) => message.channel === hubMeta.channel && message.requester === handler.name,
                            handle$: message => this[handler.name].call(this, message),
                        });
                    });

                    proxy.addHandler('__system__', {
                        test: (message: any) => message.channel === hubMeta.channel && message['__system__'] === SystemSignal.CLIENT_INIT,
                        handle$: (message: any) => {
                            const { subscribers } = message;

                            const unregistered: string[] = [];

                            publishers.forEach(publisher => {
                                if (!subscribers.includes(publisher.name)) {
                                    unregistered.push(publisher.name);

                                    return;
                                }

                                toPm$(
                                    hubMeta.channel,
                                    publisher.name,
                                    this[publisher.name],
                                    clientWindow.contentWindow
                                )
                                .pipe(takeUntil(clientUnsubscriber$))
                                .subscribe();
                            });

                            if (unregistered.length) {
                                console.warn(`There are no publishers for ${unregistered.join(', ')} subscribers`);
                            }

                            // FIXME: ивент не работает, надо что-то придумать с CORS-поддержкой
                            merge(fromEvent(clientWindow, 'beforeunload'), destroy$)
                                .pipe(takeUntil(clientUnsubscriber$))
                                .subscribe(() => unsubscribeClient());

                            return of(null);
                        }
                    })

                    proxy.start();
                };

                this.registerDestroy(destroyFn);
                this.registerOnClient(onClientFn);
            }
        }

        return DecoratedHubConstructor;
    }
}
