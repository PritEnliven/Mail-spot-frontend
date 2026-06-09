import { Tooltip } from 'react-tooltip';
import 'react-toastify/dist/ReactToastify.css';

const GlobalUIRoot = () => {
  
  return (
    <>
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
