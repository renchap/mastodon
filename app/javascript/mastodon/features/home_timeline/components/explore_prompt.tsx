import { useEffect, useCallback, useRef, useState } from 'react';

import { FormattedMessage, useIntl, defineMessages } from 'react-intl';

import { Link } from 'react-router-dom';

import type {
  Record as ImmutableRecord,
  List as ImmutableList,
} from 'immutable';

import ChevronLeftIcon from '@/material-icons/400-24px/chevron_left.svg?react';
import ChevronRightIcon from '@/material-icons/400-24px/chevron_right.svg?react';
import { followAccount, unfollowAccount } from 'mastodon/actions/accounts';
import { fetchSuggestions } from 'mastodon/actions/suggestions';
import { Avatar } from 'mastodon/components/avatar';
import { Button } from 'mastodon/components/button';
import { DisplayName } from 'mastodon/components/display_name';
import { Icon } from 'mastodon/components/icon';
import { VerifiedBadge } from 'mastodon/components/verified_badge';
import { useAppSelector, useAppDispatch } from 'mastodon/store';

const messages = defineMessages({
  follow: { id: 'account.follow', defaultMessage: 'Follow' },
  unfollow: { id: 'account.unfollow', defaultMessage: 'Unfollow' },
  previous: { id: 'lightbox.previous', defaultMessage: 'Previous' },
  next: { id: 'lightbox.next', defaultMessage: 'Next' },
});

const Card: React.FC<{ id: string }> = ({ id }) => {
  const intl = useIntl();
  const account = useAppSelector((state) => state.accounts.get(id));

  const relationship = useAppSelector((state) => state.relationships.get(id));

  const dispatch = useAppDispatch();
  const following =
    relationship?.get('following') || relationship?.get('requested');

  const handleFollow = useCallback(() => {
    if (!account) return;

    if (following) {
      dispatch(unfollowAccount(account.get('id')));
    } else {
      dispatch(followAccount(account.get('id')));
    }
  }, [account, following, dispatch]);

  if (!account) return null;

  const firstVerifiedField = account.fields.find(
    (item) => !!item.get('verified_at'),
  );

  return (
    <div className='inline-follow-suggestions__body__scrollable__card'>
      <div className='inline-follow-suggestions__body__scrollable__card__avatar'>
        <Link to={`/@${account.get('acct')}`}>
          <Avatar account={account} size={72} />
        </Link>
      </div>

      <div className='inline-follow-suggestions__body__scrollable__card__text-stack'>
        <Link to={`/@${account.get('acct')}`}>
          <DisplayName account={account} />
        </Link>
        {firstVerifiedField && (
          <VerifiedBadge link={firstVerifiedField.get('value')} />
        )}
      </div>

      <Button
        text={intl.formatMessage(
          following ? messages.unfollow : messages.follow,
        )}
        onClick={handleFollow}
      />
    </div>
  );
};

export const ExplorePrompt: React.FC = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const suggestions = useAppSelector(
    (state) =>
      state.suggestions.get('items') as ImmutableList<
        ImmutableRecord<{ account: string }>
      >,
  );
  const bodyRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    dispatch(fetchSuggestions());
  }, [dispatch]);

  useEffect(() => {
    if (bodyRef.current) {
      setCanScrollLeft(bodyRef.current.scrollLeft > 0);
      setCanScrollRight(
        bodyRef.current.scrollLeft + bodyRef.current.clientWidth <
          bodyRef.current.scrollWidth,
      );
    }
  }, [setCanScrollRight, canScrollLeft, bodyRef, suggestions]);

  const handleLeftNav = useCallback(() => {
    if (bodyRef.current) bodyRef.current.scrollLeft -= 200;
  }, []);

  const handleRightNav = useCallback(() => {
    if (bodyRef.current) bodyRef.current.scrollLeft += 200;
  }, [bodyRef]);

  const handleScroll = useCallback(() => {
    if (bodyRef.current) {
      setCanScrollLeft(bodyRef.current.scrollLeft > 0);
      setCanScrollRight(
        bodyRef.current.scrollLeft + bodyRef.current.clientWidth <
          bodyRef.current.scrollWidth,
      );
    }
  }, [setCanScrollRight]);

  if (suggestions.isEmpty()) {
    return null;
  }

  return (
    <div className='inline-follow-suggestions'>
      <div className='inline-follow-suggestions__header'>
        <h3>
          <FormattedMessage
            id='follow_suggestions.who_to_follow'
            defaultMessage='Who to follow'
          />
        </h3>

        <div className='inline-follow-suggestions__header__actions'>
          <button className='link-button'>
            <FormattedMessage
              id='follow_suggestions.dismiss'
              defaultMessage="Don't show again"
            />
          </button>
          <Link to='/explore/suggestions' className='link-button'>
            <FormattedMessage
              id='follow_suggestions.view_all'
              defaultMessage='View all'
            />
          </Link>
        </div>
      </div>

      <div className='inline-follow-suggestions__body'>
        <div
          className='inline-follow-suggestions__body__scrollable'
          ref={bodyRef}
          onScroll={handleScroll}
        >
          {suggestions.map((suggestion) => (
            <Card
              key={suggestion.get('account')}
              id={suggestion.get('account')}
            />
          ))}
        </div>

        {canScrollLeft && (
          <button
            className='inline-follow-suggestions__body__scroll-button left'
            onClick={handleLeftNav}
            aria-label={intl.formatMessage(messages.previous)}
          >
            <div className='inline-follow-suggestions__body__scroll-button__icon'>
              <Icon icon={ChevronLeftIcon} id='follow-arrow-left' />
            </div>
          </button>
        )}

        {canScrollRight && (
          <button
            className='inline-follow-suggestions__body__scroll-button right'
            onClick={handleRightNav}
            aria-label={intl.formatMessage(messages.next)}
          >
            <div className='inline-follow-suggestions__body__scroll-button__icon'>
              <Icon icon={ChevronRightIcon} id='follow-arrow-right' />
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
