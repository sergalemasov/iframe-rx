import 'reflect-metadata';

export const rxPmSubscribersMetaKey = Symbol();

export enum RxPmSubscriberBehavior {
    DEFAULT = 'default',
    REPLAY = 'replay',
}

export interface RxPmSubscriberMeta {
    behavior: RxPmSubscriberBehavior;
}

export function RxPmSubscriber(metaPatch: Partial<RxPmSubscriberMeta> = {}) {
    const defaultMeta: RxPmSubscriberMeta = {
        behavior: RxPmSubscriberBehavior.DEFAULT
    };

    const meta = {
        ...defaultMeta,
        ...metaPatch
    };

    return function(target: any, propertyKey: string) {
        let subscribers = Reflect.getMetadata(rxPmSubscribersMetaKey, target);

        if (!subscribers) {
            Reflect.defineMetadata(rxPmSubscribersMetaKey, subscribers = [], target);
        }

        subscribers.push({
            name: propertyKey,
            meta
        });
    }
}
