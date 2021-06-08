import { from, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { IMessageHandler, IWindowPostMessageProxyOptions, WindowPostMessageProxy } from 'window-post-message-proxy';

export interface RxPmProxyHandler<Response = unknown, Message = unknown> {
    test(message: Message): boolean;
    handle$(message: Message): Observable<Response>;
}

export class RxPmProxy {
    private proxy: WindowPostMessageProxy;
    private handlers = new Map<string, {
        unsubscriber$: Subject<void>;
        messageHandler: IMessageHandler;
    }>();

    constructor(options?: IWindowPostMessageProxyOptions) {
        this.proxy = new WindowPostMessageProxy(options);
    }

    public start(): void {
        this.proxy.start();
    }

    public stop(): void {
        this.proxy.stop();
    }

    public send$<Response = unknown, Message = unknown>(message: Message, target: Window): Observable<Response> {
        return from(this.proxy.postMessage(target, message)) as Observable<Response>;
    }

    public addHandler<Response = unknown, Message = unknown>(
        handlerId: string,
        handler: RxPmProxyHandler<Response, Message>
    ): void {
        if (this.handlers.has(handlerId)) {
            return;
        }

        const unsubscriber$ = new Subject<void>();
        const messageHandler: IMessageHandler = {
            test: (message: Message) => handler.test(message),
            handle: (message: Message) => new Promise((resolve, reject) => {

                handler.handle$(message)
                    .pipe(
                        take(1),
                        takeUntil(unsubscriber$)
                    )
                    .subscribe({
                        next: message => {
                            resolve(message)
                        },
                        error: error => reject(error)
                    });
            })
        }

        this.handlers.set(handlerId, {
            unsubscriber$,
            messageHandler
        });

        this.proxy.addHandler(messageHandler);
    }

    public removeHandler(handlerId: string) {
        const handlerValue = this.handlers.get(handlerId);

        if (!handlerValue) {
            return;
        }

        const { unsubscriber$, messageHandler } = handlerValue;

        unsubscriber$.next();
        unsubscriber$.complete();

        this.proxy.removeHandler(messageHandler);

        this.handlers.delete(handlerId);
    }
}
