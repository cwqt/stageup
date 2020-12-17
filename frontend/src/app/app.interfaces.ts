import { FormControl } from "@angular/forms"

export interface ICacheable<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  form_errors?: { [index: string]: string };
}