import type { Status, StatusVisibility } from 'mastodon/models/status';
import { createApiRequestThunk } from 'mastodon/store/typed_functions';

import { importFetchedStatus } from './importer';

export const reblog = createApiRequestThunk('status/reblog', {
  method: 'post',
  url: ({ statusId }: { statusId: string; visibility: StatusVisibility }) =>
    `v1/statuses/${statusId}/reblog`,
  params: ({ visibility }) => ({ visibility }),
  onData: (data: { reblog: Status }, { dispatch }) => {
    // The reblog API method returns a new status wrapped around the original. In this case we are only
    // interested in how the original is modified, hence passing it skipping the wrapper
    dispatch(importFetchedStatus(data.reblog));
  },
  skipLoading: true,
});

export const unreblog = createApiRequestThunk('status/unreblog', {
  method: 'post',
  url: ({ statusId }: { statusId: string; statusVisibility: string }) =>
    `v1/statuses/${statusId}/unreblog`,

  onData: (data: Status, { dispatch }) => {
    dispatch(importFetchedStatus(data));
  },
  skipLoading: true,
});
