import type { Entity } from "./base";

export type User = Entity<{
  username: string,
  firstName: string,
  lastName: string,
  email: string,
  dob: string,
}>;