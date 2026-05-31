import * as React from 'react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faLayerGroup, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw, { theme } from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Avatar from '@/components/Avatar';

const GlobalLink = styled(NavLink)`
    ${tw`flex items-center py-2.5 px-4 text-neutral-400 no-underline transition-all duration-200 rounded-xl font-medium text-sm`};
    &:hover { ${tw`text-neutral-100 bg-white/5`}; }
    &.active { ${tw`text-primary-400 bg-primary-500/10`}; }
    svg { ${tw`mr-3 text-lg opacity-80`}; }
`;
const GlobalA = styled.a`
    ${tw`flex items-center py-2.5 px-4 text-neutral-400 no-underline transition-all duration-200 rounded-xl font-medium text-sm`};
    &:hover { ${tw`text-neutral-100 bg-white/5`}; }
    svg { ${tw`mr-3 text-lg opacity-80`}; }
`;

export default ({ children }: { children?: React.ReactNode }) => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    return (
        <div className={'w-[270px] flex-shrink-0 h-screen bg-[#050505]/70 backdrop-blur-xl border-r border-white/5 flex flex-col z-50'}>
            <SpinnerOverlay visible={isLoggingOut} />
            
            <div className={'h-20 flex items-center justify-between px-6 border-b border-white/5'}>
                <Link
                    to={'/'}
                    className={'text-2xl font-header font-bold no-underline text-white tracking-wide flex items-center'}
                >
                    <span className="text-primary-400 mr-2">N</span>
                    {name}
                </Link>
            </div>

            <div className={'flex flex-col px-4 mt-6 gap-y-1'}>
                <div className={'text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 px-4'}>
                    Navegación
                </div>
                <GlobalLink to={'/'} exact>
                    <FontAwesomeIcon icon={faLayerGroup} />
                    Servidores
                </GlobalLink>
                <GlobalLink to={'/account'}>
                    <span className={'flex items-center w-5 h-5 mr-3 opacity-80'}><Avatar.User /></span>
                    Cuenta
                </GlobalLink>
                {rootAdmin && (
                    <GlobalA href={'/admin'} rel={'noreferrer'}>
                        <FontAwesomeIcon icon={faCogs} />
                        Administración
                    </GlobalA>
                )}
            </div>

            <div className={'flex-1 overflow-y-auto mt-2'}>
                 {children}
            </div>

            <div className={'mt-auto p-4 border-t border-white/5'}>
                <div className={'flex items-center justify-between px-4 py-2'}>
                    <div className={'flex items-center'}>
                        <div className={'flex flex-col'}>
                             <span className={'text-sm font-medium text-neutral-200'}>Conectado</span>
                             <button onClick={onTriggerLogout} className={'text-xs text-neutral-500 hover:text-red-400 text-left transition-colors'}>Cerrar Sesión</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
