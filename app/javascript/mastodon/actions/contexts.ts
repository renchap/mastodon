import { AxiosError } from 'axios';

import api from 'mastodon/api';
import type { ApiStatusContextJSON } from 'mastodon/api_types/statuses';
import { createAppAsyncThunk } from 'mastodon/store';

import { importFetchedStatuses } from './importer';
import { deleteFromTimelines } from './timelines';

export const fetchContext = createAppAsyncThunk(
  'context/fetch',
  async (args: { id: string }, { dispatch, getState, rejectWithValue }) => {
    const { id } = args;

    try {
      const response = await api(getState).get<ApiStatusContextJSON>(
        `/api/v1/statuses/${id}/context`,
      );

      const { ancestors, descendants } = response.data;

      dispatch(importFetchedStatuses(ancestors.concat(descendants)));

      return {
        id,
        ancestors,
        descendants,
        statuses: ancestors.concat(descendants),
      };
    } catch (error) {
      if (
        error instanceof AxiosError &&
        error.response &&
        error.response.status === 404
      ) {
        dispatch(deleteFromTimelines(id));
      }

      return rejectWithValue({ skipAlert: true, error });
    }
  },
);
