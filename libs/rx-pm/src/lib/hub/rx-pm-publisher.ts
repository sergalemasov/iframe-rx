import 'reflect-metadata';

export const rxPmPublishersMetaKey = Symbol();

export function RxPmPublisher() {
    return function(target: any, propertyKey: string) {
        let publishers = Reflect.getMetadata(rxPmPublishersMetaKey, target);

        if (!publishers) {
            Reflect.defineMetadata(rxPmPublishersMetaKey, publishers = [], target);
        }

        publishers.push({
            name: propertyKey
        });
    }
}
