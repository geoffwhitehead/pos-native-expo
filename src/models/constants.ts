export const ASSOCIATION_TYPES = {
  BELONGS_TO: 'belongs_to' as const,
  HAS_MANY: 'has_many' as const,
  HAS_ONE: 'has_one' as const,
} as const;


export enum PrintStatus {
  errored = 'errored',
  succeeded = 'succeeded',
  pending = 'pending',
  processing = 'processing',
  cancelled = 'cancelled',
}

export enum PrintType {
  std = 'std',
  void = 'void',
}