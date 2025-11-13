import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class CacheKeyBuilder {
  private readonly separator = ':';

  /**
   * Build a cache key from parts
   */
  build(...parts: (string | number | object)[]): string {
    return parts
      .map(part => this.normalize(part))
      .filter(Boolean)
      .join(this.separator);
  }

  /**
   * Build a cache key with namespace
   */
  buildWithNamespace(namespace: string, ...parts: any[]): string {
    return this.build(namespace, ...parts);
  }

  /**
   * Hash complex objects for cache keys
   */
  hash(data: any): string {
    const str = typeof data === 'string'
      ? data
      : JSON.stringify(data, Object.keys(data).sort());

    return createHash('sha256')
      .update(str)
      .digest('hex')
      .substring(0, 8);
  }

  /**
   * Build pagination cache key
   */
  buildPaginationKey(
    resource: string,
    page: number,
    limit: number,
    filters?: Record<string, any>,
    sort?: { field: string; order: string },
  ): string {
    const parts = [resource, 'list', page, limit];

    if (filters && Object.keys(filters).length > 0) {
      parts.push('filters', this.hash(filters));
    }

    if (sort) {
      parts.push('sort', sort.field, sort.order);
    }

    return this.build(...parts);
  }

  private normalize(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      return this.hash(value);
    }

    return String(value);
  }
}