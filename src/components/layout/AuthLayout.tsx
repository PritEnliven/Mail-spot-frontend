import AppLoader from "@components/layout/AppLoader";
import { pageStyles, usePageStylesheet } from "@hooks/usePageStyleSheet";
import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";

const REGISTER_LIKE_PATHS = new Set(["/register", "/forgot"]);

/**
 * Shared shell for login / register / forgot.
 * Keeps the animated left panel mounted so it does not blink on navigation.
 */
const AuthLayout = () => {
  const cssLoaded = usePageStylesheet([pageStyles.headerCss, pageStyles.signInCss]);
  const { pathname } = useLocation();
  const isRegisterLike = REGISTER_LIKE_PATHS.has(pathname);

  if (!cssLoaded) {
    return <AppLoader />;
  }

  return (
    <div className={`login-main${isRegisterLike ? " register" : ""}`}>
      <div className="row m-0">
        <div className="col-md-6 p-0 d-md-block d-none">
          <div className="login-main-gradiant">
            <div className="login-left" />
            <div className="login-right" />
            <div className="login-main-content-section">
              <span className="login-title">
                Your inbox, supercharged. Your team, unstoppable.
              </span>
            </div>
          </div>
        </div>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
};

export default AuthLayout;
