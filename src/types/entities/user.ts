import type { Entity } from "./base";

export type User = Entity<{
  id: string,
  username: string,
  password: string,
  firstName: string,
  lastName: string,
  email: string,
  dob: string,
}>;