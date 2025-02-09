import { connect } from 'react-redux';

import { closeDropdownMenu } from '../actions/dropdown_menu';
import { closeModal } from '../actions/modal';
import SimpleDropdownMenu from '../components/simple_dropdown_menu';

/**
 * @param {import('mastodon/store').RootState} state
 */
const mapStateToProps = state => ({
  openDropdownId: state.dropdownMenu.openId,
  openedViaKeyboard: state.dropdownMenu.keyboard,
});

const mapDispatchToProps = (dispatch) => ({
  onClose(id) {
    dispatch(closeModal({
      modalType: 'ACTIONS',
      ignoreFocus: false,
    }));
    dispatch(closeDropdownMenu({ id }));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SimpleDropdownMenu);
