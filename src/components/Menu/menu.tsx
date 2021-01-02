import React, { createContext, useState } from "react";
import classNames from "classnames";

type MenuMode = "horizontal" | "vertical";
type SelectCallback = (selectedIndex: string) => void;

export interface MenuProps {
  /** 默认选中的菜单项 */
  defaultIndex?: string;
  /** 横向 || 竖向 */
  mode?: MenuMode;
  className?: string;
  style?: React.CSSProperties;
  /** 选中之后的回调函数 */
  onSelect?: SelectCallback;
  /** 默认展开的菜单项 */
  defaultOpenSubMenus: string[]
}

interface IMenuContext {
  index: string;
  onSelect?: SelectCallback;
  mode?: MenuMode,
  defaultOpenSubMenus: string[]
}

export const MenuContext = createContext<IMenuContext>({ index: '0', defaultOpenSubMenus: [] });


/**
 * ## 引用方法
 * ~~~js
 * import { Button } from 'vikingShip'
 * ~~~
 */
const Menu: React.FC<MenuProps> = (props) => {
  const { defaultIndex, mode, className, style, children, onSelect, defaultOpenSubMenus } = props;
  const classes = classNames("menu", className, {
    "menu-vertical": mode === "vertical",
    "menu-horizontal": mode !== "vertical",
  });
  const [currentActive, setCurrentActive] = useState(defaultIndex);

  const handleClick = (index: string) => {
    setCurrentActive(index);
    if (onSelect) {
      onSelect(index);
    }
  };
  const passedContext: IMenuContext = {
    index: currentActive ? currentActive : '0',
    onSelect: handleClick,
    mode: mode,
    defaultOpenSubMenus
  };

  const renderChild = () => {
    return React.Children.map(children, (child: any, index: number) => {
      // const childElement = child as React.FunctionComponentElement<MenuItemProps>
      const childElement = child
      const { displayName } = childElement.type;
      if (displayName === 'MenuItem' || displayName === 'SubMenu') {
        return React.cloneElement(childElement, {
          index: index.toString()
        })
      } else {
        console.error('Warning: Menu has a child which is not MenuItem')
      }
    })
  }

  return (
    <ul className={classes} style={style} data-testid="test-menu">
      <MenuContext.Provider value={passedContext}>
        {renderChild()}
      </MenuContext.Provider>
    </ul>
  );
};

Menu.defaultProps = {
  defaultIndex: '0',
  mode: "horizontal",
};

export default Menu;
