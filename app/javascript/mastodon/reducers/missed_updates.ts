import { Record } from 'immutable';
import { createReducer } from '@reduxjs/toolkit';
import { NOTIFICATIONS_UPDATE } from '../actions/notifications';
import { focusApp, unfocusApp } from '../actions/app';

type MissedUpdatesState = {
  focused: boolean;
  unread: number;
};
const initialState = Record<MissedUpdatesState>({
  focused: true,
  unread: 0,
})();

export const missedUpdatesReducer = createReducer(initialState, (builder) =>
  builder
    .addCase(focusApp, (state) => {
      return state.set('focused', true).set('unread', 0);
    })
    .addCase(unfocusApp, (state) => {
      state.set('focused', false);
    })
    .addCase(NOTIFICATIONS_UPDATE, (state) => {
      return state.get('focused')
        ? state
        : state.update('unread', (x) => x + 1);
    }),
);
