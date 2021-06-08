import 'reflect-metadata';

export const rxPmRequestersMetaKey = Symbol();

export function RxPmRequester<T>() {
    return function(target: any, propertyKey: string) {
        let requesters = Reflect.getMetadata(rxPmRequestersMetaKey, target);

        if (!requesters) {
            Reflect.defineMetadata(rxPmRequestersMetaKey, requesters = [], target);
        }

        requesters.push({
            name: propertyKey
        });
    }
}
