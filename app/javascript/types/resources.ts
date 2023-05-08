import type { Record } from 'immutable';

interface AccountValues {
  id: number;
  avatar: string;
  avatar_static: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // FIXME
}

export type Account = Record<AccountValues>;
