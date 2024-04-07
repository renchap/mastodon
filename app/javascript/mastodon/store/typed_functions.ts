import { createAsyncThunk } from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useDispatch, useSelector } from 'react-redux';

import type { BaseThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';

import api from 'mastodon/api';

import type { AppDispatch, RootState } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export interface AsyncThunkRejectValue {
  skipAlert?: boolean;
  skipNotFound?: boolean;
  error?: unknown;
}

interface AppMeta {
  skipLoading?: boolean;
}

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
  rejectValue: AsyncThunkRejectValue;
  fulfilledMeta: AppMeta;
  rejectedMeta: AppMeta;
}>();

type AppThunkApi = Pick<
  BaseThunkAPI<
    RootState,
    unknown,
    AppDispatch,
    AsyncThunkRejectValue,
    AppMeta,
    AppMeta
  >,
  'getState' | 'dispatch'
>;

interface AppThunkOptions {
  skipLoading?: boolean;
}

interface ApiRequestOptions<Arg, ApiResponse, Returned>
  extends AppThunkOptions {
  method?: 'post' | 'get';
  url: string | ((arg: Arg) => string);
  params?: (arg: Arg) => Record<string, unknown>;
  onData?:
    | ((data: ApiResponse, api: AppThunkApi) => Returned)
    | ((data: ApiResponse, api: AppThunkApi) => Promise<Returned>);
  onError?: (arg: Arg) => void;
}

const defaultOptions = {
  method: 'get',
};

export function createThunk<Arg = void, Returned = void>(
  name: string,
  creator: (arg: Arg, api: AppThunkApi) => Returned | Promise<Returned>,
  options: AppThunkOptions = {},
) {
  return createAppAsyncThunk(
    name,
    async (
      arg: Arg,
      { getState, dispatch, fulfillWithValue, rejectWithValue },
    ) => {
      try {
        const result = await creator(arg, { dispatch, getState });

        return fulfillWithValue(result, {
          skipLoading: options.skipLoading,
        });
      } catch (error) {
        return rejectWithValue({ error }, { skipLoading: true });
      }
    },
    {
      getPendingMeta() {
        if (options.skipLoading) return { skipLoading: true };
        return {};
      },
    },
  );
}

export function createApiRequestThunk<
  Arg = void,
  ApiResponse = void,
  Returned = void,
>(name: string, options: ApiRequestOptions<Arg, ApiResponse, Returned>) {
  return createThunk<Arg, Returned>(
    name,
    async (arg, { getState, dispatch }) => {
      const method = options.method ?? defaultOptions.method;

      const url =
        typeof options.url === 'string' ? options.url : options.url(arg);

      const { data } = await api(getState).request<ApiResponse>({
        method,
        url: `/api/${url}`,
        params: options.params?.(arg),
      });

      return options.onData?.(data, { dispatch, getState }) as Returned;
    },
    { skipLoading: true },
  );
}
