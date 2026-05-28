import { ToastContainer } from 'react-toastify';
import { Tooltip } from 'react-tooltip';
import 'react-toastify/dist/ReactToastify.css';

const GlobalUIRoot = () => {
  
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        pauseOnHover
        closeOnClick
        draggable
      />

      <Tooltip
        id="my-tooltip"
        place="top"     
        className="tooltip-inner no-tooltip-animation"
        delayShow={0}
        delayHide={50}
        offset={5}
        positionStrategy="fixed"
      />
    </>
  );
};

export default GlobalUIRoot;
