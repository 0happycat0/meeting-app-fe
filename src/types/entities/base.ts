export type BaseEntity = {
  id: string,
};

export type Entity<T> = T & BaseEntity;