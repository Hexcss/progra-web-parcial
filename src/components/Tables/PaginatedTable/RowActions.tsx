import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  ClickAwayListener,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface Action {
  id: string;
  name: string;
  onClick: (rowIndex: number, handleClose: () => void) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface RowActionsMenuProps {
  index: number;
  actions: Action[];
}

const RowActionsMenu: React.FC<RowActionsMenuProps> = ({ index, actions }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!actions || actions.length === 0) {
    return null; // no menu if no inside actions
  }

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div style={{ display: 'inline-flex' }}>
        <IconButton size='small' onClick={handleClick}>
          <MoreVertIcon sx={{ fontSize: '20px' }} />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          disableAutoFocusItem
        >
          {actions.map(action => (
            <MenuItem
              key={action.id}
              onClick={() => action.onClick(index, handleClose)}
              disabled={action.disabled}
            >
              <ListItemText>{action.name}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </div>
    </ClickAwayListener>
  );
};

export default RowActionsMenu;
