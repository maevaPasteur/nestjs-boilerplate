export interface CacheableOptions {
  key?: string;
  ttl?: number;
  tags?: string[];
}

export function Cacheable(options: CacheableOptions = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const methodName = propertyName;

    descriptor.value = async function (...args: any[]) {
      const cacheService = this.cacheService;
      const keyBuilder = this.cacheKeyBuilder;

      if (!cacheService || !keyBuilder) {
        return originalMethod.apply(this, args);
      }

      const cacheKey = options.key || keyBuilder.build(
        target.constructor.name,
        methodName,
        keyBuilder.hash(args),
      );

      return cacheService.remember(
        cacheKey,
        () => originalMethod.apply(this, args),
        {
          ttl: options.ttl,
          tags: options.tags,
        },
      );
    };

    return descriptor;
  };
}

export function CacheEvict(tags: string[]) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      const cacheService = this.cacheService;
      if (cacheService) {
        await cacheService.invalidateTags(tags);
      }

      return result;
    };

    return descriptor;
  };
}