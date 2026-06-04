import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { LoadPanel } from 'devextreme-react/load-panel';
import "../loader/loader.css"

export default function Loader() {
//   const position = { of: '#loader' };

    const isLoaderOpen = useSelector((state : RootState) => state.auth.isLoaderOpen);

    return (
       <>
        {isLoaderOpen.isOpen === true &&
        <div id='loader'>
          <LoadPanel
            // shadingColor={"rgba(0,0,0,0.4)"}
            // position={position}
            visible={isLoaderOpen.isOpen}
          />
        </div>
         } 
        </>
    );
}