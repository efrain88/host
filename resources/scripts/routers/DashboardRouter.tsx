import React from 'react';
import { NavLink, Route, Switch } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faShieldAlt, faKey, faTerminal, faHistory } from '@fortawesome/free-solid-svg-icons';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import SubNavigation from '@/components/elements/SubNavigation';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';

export default () => {
    const location = useLocation();

    return (
        <div className="flex w-full h-screen overflow-hidden">
            <NavigationBar>
                {location.pathname.startsWith('/account') && (
                    <SubNavigation>
                        <div>
                            {routes.account
                                .filter((route) => !!route.name)
                                .map(({ path, name, exact = false }) => {
                                    let icon = faUser;
                                    if (path === '/security') icon = faShieldAlt;
                                    if (path === '/api') icon = faKey;
                                    if (path === '/ssh') icon = faTerminal;
                                    if (path === '/activity') icon = faHistory;
                                    
                                    return (
                                        <NavLink key={path} to={`/account/${path}`.replace('//', '/')} exact={exact}>
                                            <FontAwesomeIcon icon={icon} />
                                            {name}
                                        </NavLink>
                                    );
                                })}
                        </div>
                    </SubNavigation>
                )}
            </NavigationBar>
            <div className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden relative">
                <TransitionRouter>
                    <React.Suspense fallback={<Spinner centered />}>
                        <Switch location={location}>
                            <Route path={'/'} exact>
                                <DashboardContainer />
                            </Route>
                            {routes.account.map(({ path, component: Component }) => (
                                <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                    <Component />
                                </Route>
                            ))}
                            <Route path={'*'}>
                                <NotFound />
                            </Route>
                        </Switch>
                    </React.Suspense>
                </TransitionRouter>
            </div>
        </div>
    );
};
