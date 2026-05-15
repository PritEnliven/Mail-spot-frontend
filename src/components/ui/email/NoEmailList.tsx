import noMailFoundImage from "@images/no-new-mail.png";

const NoMailFound = () => {
    return (
        <div className="no-new-mail">
            <div className="d-block text-center">
                <img src={noMailFoundImage} className="mb-2 d-none" alt="" />
                <h2 className="new-h2 mb-2">No Mails Found</h2>
                <p className="fs-12 d-none">No Mails in this box</p>
            </div>
        </div>
    );
};

export default NoMailFound;
