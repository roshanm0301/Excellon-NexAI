import { ContextMenu } from 'devextreme-react';
import { Position } from 'devextreme-react/autocomplete';
import { useState } from 'react';
import { DXButton } from '../../components/atoms';

const SelectVersionComponent = (props: any) => {
  const { callback, selectedVersion,versionList } = props
  const [showContextMenu, setShowContextMenu] = useState(false);

  const toggleContextMenu = () => {
    if (showContextMenu === true) {
      setShowContextMenu(false);
    }
    setShowContextMenu(!showContextMenu);
  };

  const contextMenuItemClickHandler = (item: any) => {
    callback(item?.itemData?.Name)
    setShowContextMenu(false);
  };


  return (
    <div>
      <div id="version-click" >
        <DXButton
          width={100}
          text={selectedVersion !== '' ? selectedVersion : ''}
          type="default"
          stylingMode="text"
          hint={'Version'}
          onClick={toggleContextMenu}
        />
      </div>
      <ContextMenu
        items={versionList ??[]}
        displayExpr={'Name'}
        target={"#version-click"}
        showEvent="dxclick"
        onItemClick={contextMenuItemClickHandler}
        width={100}
        cssClass='user-menu'
      >
        <Position my={'top center'} at={'bottom center'} />
      </ContextMenu>
    </div >
  )
}

export default SelectVersionComponent