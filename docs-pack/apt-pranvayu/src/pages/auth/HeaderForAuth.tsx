import Toolbar, { Item } from 'devextreme-react/toolbar';
import Logo from "../../assets/excellon-logo.svg";
import { Link } from 'react-router-dom';

const HeaderComponent = () => {
    function screen(width: any) {
        return width < 700 ? "sm" : "lg";
    }

    return (
        <header className={'header-component'}>
            <Toolbar className={'header-toolbar'}>
                <Item
                    location={'before'}
                    widget={'dxButton'}
                    cssClass={'menu-button'}
                >
                    <Link to={"/"}>
                    <img
                        alt={""}
                        src={Logo}
                    />    
                    </Link> 
                    </Item>
                <Item
                    location={'after'}
                    cssClass={'header-title'}
                    text={"Admin Configurator"}
                />
            </Toolbar>
        </header>
    )
}

export default HeaderComponent