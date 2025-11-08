export interface Action {
  id: string;
  name: string;
  onClick: (index: number, handleClose: () => void) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  outsideMenu?: boolean;
}
