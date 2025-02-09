import type { MouseEventHandler } from 'react';
import { useRef, useCallback, useEffect, useState, useId } from 'react';

import classNames from 'classnames';

import { supportsPassiveEvents } from 'detect-passive-events';
import Overlay from 'react-overlays/Overlay';

import { fetchRelationships } from 'mastodon/actions/accounts';
import { CircularProgress } from 'mastodon/components/circular_progress';
import type { IconProp } from 'mastodon/components/icon';
import type { Status } from 'mastodon/models/status';
import { useAppDispatch } from 'mastodon/store';

import { openDropdownMenu } from '../actions/dropdown_menu';
import { openModal } from '../actions/modal';
import { isUserTouching } from '../is_mobile';

import { IconButton } from './icon_button';
import { useAppHistory } from './router';

const listenerOptions = supportsPassiveEvents
  ? { passive: true, capture: true }
  : true;

interface MenuItem {
  text: string;
  href?: string;
  target?: string;
  action?: () => void;
  to?: string;
  method: string;
  dangerous: boolean;
}

const DropdownMenu: React.FC<{
  items: MenuItem[];
  loading: boolean;
  scrollable: boolean;
  onClose: () => void;
  onItemClick: MouseEventHandler;
}> = ({ items, loading, scrollable, onClose, onItemClick }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const focusedItemRef = useRef<HTMLAnchorElement>(null);

  const handleDocumentClick = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (
        nodeRef.current &&
        e.target instanceof Node &&
        !nodeRef.current.contains(e.target)
      ) {
        onClose();
        e.stopPropagation();
        e.preventDefault();
      }
    },
    [nodeRef, onClose],
  );

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick, { capture: true });
    document.addEventListener('touchend', handleDocumentClick, listenerOptions);

    return () => {
      document.removeEventListener('click', handleDocumentClick, {
        capture: true,
      });
      document.removeEventListener(
        'touchend',
        handleDocumentClick,
        listenerOptions,
      );
    };
  }, [handleDocumentClick, focusedItemRef]);

  const handleClick = useCallback<MouseEventHandler>(
    (e) => {
      onItemClick(e);
    },
    [onItemClick],
  );

  const renderItem = useCallback(
    (option: MenuItem | null, i: number) => {
      if (option === null) {
        return (
          <div key={`sep-${i}`} className='simple-dropdown-menu__separator' />
        );
      }

      const { text, href = '#', target = '_blank', method, dangerous } = option;

      return (
        <div
          className={classNames('simple-dropdown-menu__item', {
            'simple-dropdown-menu__item--dangerous': dangerous,
          })}
          key={`${text}-${i}`}
        >
          <a
            href={href}
            target={target}
            data-method={method}
            rel='noopener'
            role='button'
            tabIndex={0}
            ref={i === 0 ? focusedItemRef : null}
            onClick={handleClick}
            data-index={i}
          >
            {text}
          </a>
        </div>
      );
    },
    [handleClick],
  );

  return (
    <div
      className={classNames('simple-dropdown-menu__container', {
        'simple-dropdown-menu__container--loading': loading,
      })}
      ref={nodeRef}
    >
      {loading && <CircularProgress size={30} strokeWidth={3.5} />}

      {!loading && (
        <div
          className={classNames('simple-dropdown-menu__container__list', {
            'simple-dropdown-menu__container__list--scrollable': scrollable,
          })}
        >
          {items.map((option, i) => renderItem(option, i))}
        </div>
      )}
    </div>
  );
};

const Dropdown: React.FC<{
  icon: string;
  iconComponent: IconProp;
  loading: boolean;
  items: MenuItem[];
  title: string;
  disabled: boolean;
  scrollable: boolean;
  status?: Status;
  onClose: (id: string) => void;
  openDropdownId?: string;
  onItemClick: (item: MenuItem, index: number) => void;
  scrollKey: string;
}> = ({
  icon,
  iconComponent,
  items,
  title = 'Menu',
  loading,
  disabled,
  scrollable,
  status,
  onClose,
  openDropdownId,
  onItemClick,
  scrollKey,
}) => {
  const localId = useId();
  const [activeElement, setActiveElement] = useState<Element | null>(null); // TODO: use ref instead

  const dispatch = useAppDispatch();
  const history = useAppHistory();

  const onOpen = useCallback(
    (id: string, onItemClick: MouseEventHandler, keyboard: boolean) => {
      if (status) {
        dispatch(fetchRelationships([status.getIn(['account', 'id'])]));
      }

      dispatch(
        isUserTouching()
          ? openModal({
              modalType: 'ACTIONS',
              modalProps: {
                status,
                actions: items,
                onClick: onItemClick,
              },
            })
          : openDropdownMenu({ id, keyboard, scrollKey }),
      );
    },
    [dispatch, scrollKey, items, status],
  );

  const handleClose = useCallback(() => {
    if (activeElement instanceof HTMLElement) {
      activeElement.focus({ preventScroll: true });
      setActiveElement(null);
    }
    onClose(localId);
  }, [activeElement, onClose, localId]);

  const handleItemClick = useCallback<MouseEventHandler>(
    (e) => {
      const i = Number(e.currentTarget.getAttribute('data-index'));
      const item = items[i];

      if (!item) return;

      handleClose();

      if (typeof onItemClick === 'function') {
        e.preventDefault();
        onItemClick(item, i);
      } else if (typeof item.action === 'function') {
        e.preventDefault();
        item.action();
      } else if (item.to) {
        e.preventDefault();
        history.push(item.to);
      }
    },
    [items, handleClose, onItemClick, history],
  );

  const handleClick = useCallback<MouseEventHandler<HTMLElement>>(
    ({ type }) => {
      if (localId === openDropdownId) {
        handleClose();
      } else {
        onOpen(localId, handleItemClick, type !== 'click');
      }
    },
    [handleClose, handleItemClick, localId, onOpen, openDropdownId],
  );

  const handleMouseDown = useCallback(() => {
    setActiveElement(document.activeElement);
  }, [setActiveElement]);

  const iconButtonRef = useRef<IconButton>(null);
  const buttonRef = useRef<HTMLElement>(null);

  const findTarget = useCallback(() => {
    return iconButtonRef.current?.buttonRef.current ?? buttonRef.current;
  }, []);

  const open = localId === openDropdownId;

  return (
    <>
      <IconButton
        icon={!open ? icon : 'close'}
        iconComponent={iconComponent}
        title={title}
        active={open}
        disabled={disabled}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        ref={iconButtonRef}
      />

      <Overlay
        show={open}
        offset={[5, 5]}
        placement={'bottom'}
        flip
        target={findTarget}
        popperConfig={{ strategy: 'fixed' }}
      >
        {({ props, arrowProps, placement }) => (
          <div {...props}>
            <div
              className={`simple-dropdown-animation simple-dropdown-menu ${placement}`}
            >
              <div
                className={`simple-dropdown-menu__arrow ${placement}`}
                {...arrowProps}
              />
              <DropdownMenu
                items={items}
                loading={loading}
                scrollable={scrollable}
                onClose={handleClose}
                onItemClick={handleItemClick}
              />
            </div>
          </div>
        )}
      </Overlay>
    </>
  );
};

// eslint-disable-next-line import/no-default-export
export default Dropdown;
