import type { Reducer } from '@reduxjs/toolkit';
import {
  Map as ImmutableMap,
  List as ImmutableList,
  Record as ImmutableRecord,
} from 'immutable';

import { fetchContext } from 'mastodon/actions/contexts';
import type { ApiRelationshipJSON } from 'mastodon/api_types/relationships';
import type { ApiStatusJSON } from 'mastodon/api_types/statuses';
import type { Status } from 'mastodon/models/status';

import { blockAccountSuccess, muteAccountSuccess } from '../actions/accounts';
import { TIMELINE_DELETE, TIMELINE_UPDATE } from '../actions/timelines';
import { compareId } from '../compare_id';

const ContextsState = ImmutableRecord({
  inReplyTos: ImmutableMap<string, string>(),
  replies: ImmutableMap<string, ImmutableList<string>>(),
});

const initialState = ContextsState();

type ContextsState = typeof initialState;

const normalizeContext = (
  immutableState: ContextsState,
  id: string,
  ancestors: ApiStatusJSON[],
  descendants: ApiStatusJSON[],
) =>
  immutableState.withMutations((state) => {
    state.update('inReplyTos', (immutableAncestors) =>
      immutableAncestors.withMutations((inReplyTos) => {
        state.update('replies', (immutableDescendants) =>
          immutableDescendants.withMutations((replies) => {
            function addReply({
              id,
              in_reply_to_id,
            }: Pick<ApiStatusJSON, 'id' | 'in_reply_to_id'>) {
              if (in_reply_to_id && !inReplyTos.has(id)) {
                replies.update(in_reply_to_id, ImmutableList(), (siblings) => {
                  const index = siblings.findLastIndex(
                    (sibling) => compareId(sibling, id) < 0,
                  );
                  return siblings.insert(index + 1, id);
                });

                inReplyTos.set(id, in_reply_to_id);
              }
            }

            // We know in_reply_to_id of statuses but `id` itself.
            // So we assume that the status of the id replies to last ancestors.

            ancestors.forEach(addReply);

            if (ancestors[0]) {
              addReply({
                id,
                in_reply_to_id: ancestors[ancestors.length - 1].id,
              });
            }

            descendants.forEach(addReply);
          }),
        );
      }),
    );
  });

const deleteFromContexts = (immutableState: ContextsState, ids: string[]) =>
  immutableState.withMutations((state) => {
    state.update('inReplyTos', (immutableAncestors) =>
      immutableAncestors.withMutations((inReplyTos) => {
        state.update('replies', (immutableDescendants) =>
          immutableDescendants.withMutations((replies) => {
            ids.forEach((id) => {
              const inReplyToIdOfId = inReplyTos.get(id);

              if (!inReplyToIdOfId) return;

              const repliesOfId = replies.get(id);
              const siblings = replies.get(inReplyToIdOfId);

              if (siblings) {
                replies.set(
                  inReplyToIdOfId,
                  siblings.filterNot((sibling) => sibling === id),
                );
              }

              if (repliesOfId) {
                repliesOfId.forEach((reply) => inReplyTos.delete(reply));
              }

              inReplyTos.delete(id);
              replies.delete(id);
            });
          }),
        );
      }),
    );
  });

const filterContexts = (
  state: ContextsState,
  relationship: ApiRelationshipJSON,
  statuses: ImmutableList<Status>,
) => {
  const ownedStatusIds = statuses
    .filter((status) => status.get('account') === relationship.id)
    .map((status) => status.get('id') as string)
    .toJS();

  return deleteFromContexts(state, ownedStatusIds);
};

const updateContext = (state: ContextsState, status: ApiStatusJSON) => {
  const { in_reply_to_id, id } = status;

  if (in_reply_to_id) {
    return state.withMutations((mutable) => {
      const replies = mutable.replies.get(
        in_reply_to_id,
        ImmutableList<string>(),
      );

      mutable.setIn(['inReplyTos', id], in_reply_to_id);

      if (!replies.includes(id)) {
        mutable.setIn(['replies', in_reply_to_id], replies.push(id));
      }
    });
  }

  return state;
};

export const contextsReducer: Reducer<ContextsState> = (
  state = initialState,
  action,
) => {
  if (blockAccountSuccess.match(action) || muteAccountSuccess.match(action))
    return filterContexts(
      state,
      action.payload.relationship,
      action.payload.statuses,
    );
  else if (fetchContext.fulfilled.match(action))
    return normalizeContext(
      state,
      action.payload.id,
      action.payload.ancestors,
      action.payload.descendants,
    );
  else if (action.type === TIMELINE_DELETE)
    return deleteFromContexts(state, [action.id as string]);
  else if (action.type === TIMELINE_UPDATE)
    return updateContext(state, action.status as ApiStatusJSON);
  else return state;
};
