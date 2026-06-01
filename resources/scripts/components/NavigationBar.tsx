import * as React from 'react';
import { useState } from 'react';
import { Link, NavLink, useLocation, useHistory } from 'react-router-dom';
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
    const user = useStoreState((state: ApplicationStore) => state.user.data!);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [avatar, setAvatar] = useState<string | null>(null);
    const location = useLocation();
    const history = useHistory();

    const isServerRoute = location.pathname.startsWith('/server/');

    React.useEffect(() => {
        const savedAvatar = localStorage.getItem('user_avatar');
        if (savedAvatar) setAvatar(savedAvatar);
        
        // Polling to detect changes in localStorage from the same window
        const interval = setInterval(() => {
            const currentAvatar = localStorage.getItem('user_avatar');
            if (currentAvatar !== avatar) {
                setAvatar(currentAvatar);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [avatar]);

    const onTriggerLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
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
                    className={'text-2xl font-header font-black no-underline text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600 tracking-wider flex items-center drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] transition-all hover:scale-105 duration-300'}
                >
                    {name}
                </Link>
            </div>

            {!isServerRoute && (
                <div className={'flex flex-col px-4 mt-6 gap-y-1'}>
                    <div className={'text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 px-4'}>
                        Navegación
                    </div>
                    <GlobalLink to={'/'} exact>
                        <FontAwesomeIcon icon={faLayerGroup} />
                        Servidores
                    </GlobalLink>
                    {rootAdmin && (
                        <GlobalA href={'/admin'} rel={'noreferrer'}>
                            <FontAwesomeIcon icon={faCogs} />
                            Administración
                        </GlobalA>
                    )}
                </div>
            )}

            <div className={'flex-1 overflow-y-auto mt-2'}>
                 {children}
            </div>

            <div 
                className={'mt-auto p-4 border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors'} 
                onClick={() => history.push('/account')}
            >
                <div className={'flex items-center justify-between px-2 py-2'}>
                    <div className={'flex items-center gap-x-3'}>
                        <div className={'w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0 bg-neutral-800'}>
                            {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <Avatar.User />}
                        </div>
                        <div className={'flex flex-col overflow-hidden truncate max-w-[120px]'}>
                             <span className={'text-sm font-bold text-white truncate'}>{user.username}</span>
                             <span className={'text-xs text-neutral-400 truncate'}>{user.email}</span>
                        </div>
                    </div>
                    <button 
                        onClick={onTriggerLogout} 
                        className={'text-neutral-500 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10'} 
                        title="Cerrar Sesión"
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} />
                    </button>
                </div>
            </div>
        </div>
    );
};
