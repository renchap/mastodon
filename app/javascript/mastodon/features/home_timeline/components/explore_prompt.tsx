import { useEffect, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { FormattedMessage, useIntl, defineMessages } from 'react-intl';

import { fetchSuggestions } from 'mastodon/actions/suggestions';
import { followAccount, unfollowAccount } from 'mastodon/actions/accounts';

import { Link } from 'react-router-dom';

import ChevronLeftIcon from '@/material-icons/400-24px/chevron_left.svg?react';
import ChevronRightIcon from '@/material-icons/400-24px/chevron_right.svg?react';

import { Avatar } from 'mastodon/components/avatar';
import { DisplayName } from 'mastodon/components/display_name';
import { VerifiedBadge } from 'mastodon/components/verified_badge';
import { Button } from 'mastodon/components/button';
import { Icon } from 'mastodon/components/icon';

const messages = defineMessages({
  follow: { id: 'account.follow', defaultMessage: 'Follow' },
  unfollow: { id: 'account.unfollow', defaultMessage: 'Unfollow' },
  previous: { id: 'lightbox.previous', defaultMessage: 'Previous' },
  next: { id: 'lightbox.next', defaultMessage: 'Next' },
});

const Card = ({ id }) => {
  const intl = useIntl();
  const account = useSelector(state => state.getIn(['accounts', id]));
  const relationship = useSelector(state => state.getIn(['relationships', id]));
  const firstVerifiedField = account.get('fields').find(item => !!item.get('verified_at'));
  const dispatch = useDispatch();
  const following = relationship?.get('following') || relationship?.get('requested');

  const handleFollow = useCallback(() => {
    if (following) {
      dispatch(unfollowAccount(account.get('id')));
    } else {
      dispatch(followAccount(account.get('id')));
    }
  }, [account, following, dispatch]);

  return (
    <div className='inline-follow-suggestions__body__scrollable__card'>
      <div className='inline-follow-suggestions__body__scrollable__card__avatar'>
        <Link to={`/@${account.get('acct')}`}><Avatar account={account} size={72} /></Link>
      </div>

      <div className='inline-follow-suggestions__body__scrollable__card__text-stack'>
        <Link to={`/@${account.get('acct')}`}><DisplayName account={account} /></Link>
        {firstVerifiedField && <VerifiedBadge link={firstVerifiedField.get('value')} />}
      </div>

      <Button text={intl.formatMessage(following ? messages.unfollow : messages.follow)} onClick={handleFollow} />
    </div>
  );
};

export const ExplorePrompt = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const suggestions = useSelector(state => state.getIn(['suggestions', 'items']));
  const bodyRef = useRef();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    dispatch(fetchSuggestions());
  }, [dispatch]);

  useEffect(() => {
    if (bodyRef.current) {
      setCanScrollLeft(bodyRef.current.scrollLeft > 0);
      setCanScrollRight((bodyRef.current.scrollLeft + bodyRef.current.clientWidth) < bodyRef.current.scrollWidth);
    }
  }, [setCanScrollRight, canScrollLeft, bodyRef, suggestions]);

  const handleLeftNav = useCallback(() => {
    bodyRef.current.scrollLeft -= 200;
  }, [bodyRef]);

  const handleRightNav = useCallback(() => {
    bodyRef.current.scrollLeft += 200;
  }, [bodyRef]);

  const handleScroll = useCallback(() => {
    if (bodyRef.current) {
      setCanScrollLeft(bodyRef.current.scrollLeft > 0);
      setCanScrollRight((bodyRef.current.scrollLeft + bodyRef.current.clientWidth) < bodyRef.current.scrollWidth);
    }
  }, [setCanScrollRight, canScrollLeft, bodyRef]);

  if (suggestions.isEmpty()) {
    return null;
  }

  return (
    <div className='inline-follow-suggestions'>
      <div className='inline-follow-suggestions__header'>
        <h3><FormattedMessage id='follow_suggestions.who_to_follow' defaultMessage='Who to follow' /></h3>

        <div className='inline-follow-suggestions__header__actions'>
          <button className='link-button'><FormattedMessage id='follow_suggestions.dismiss' defaultMessage="Don't show again" /></button>
          <Link to='/explore/suggestions' className='link-button'><FormattedMessage id='follow_suggestions.view_all' defaultMessage='View all' /></Link>
        </div>
      </div>

      <div className='inline-follow-suggestions__body'>
        <div className='inline-follow-suggestions__body__scrollable' ref={bodyRef} onScroll={handleScroll}>
          {suggestions.map(suggestion => (
            <Card
              key={suggestion.get('account')}
              id={suggestion.get('account')}
            />
          ))}
        </div>

        {canScrollLeft && (
          <button className='inline-follow-suggestions__body__scroll-button left' onClick={handleLeftNav} aria-label={intl.formatMessage(messages.previous)}>
            <div className='inline-follow-suggestions__body__scroll-button__icon'><Icon icon={ChevronLeftIcon} /></div>
          </button>
        )}

        {canScrollRight && (
          <button className='inline-follow-suggestions__body__scroll-button right' onClick={handleRightNav} aria-label={intl.formatMessage(messages.next)}>
            <div className='inline-follow-suggestions__body__scroll-button__icon'><Icon icon={ChevronRightIcon} /></div>
          </button>
        )}
      </div>
    </div>
  );
};
