import React, { memo, useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import StatGraphs from '@/components/server/console/StatGraphs';
import PowerButtons from '@/components/server/console/PowerButtons';
import ServerDetailsBlock from '@/components/server/console/ServerDetailsBlock';
import { Alert } from '@/components/elements/alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTerminal, faFolder, faBoxOpen, faCog, faInfoCircle, faBolt } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import UptimeDuration from '@/components/server/UptimeDuration';
import { capitalize } from '@/lib/strings';

const ServerInformationContainer = () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const status = ServerContext.useStoreState((state) => state.status.value);
    
    const [uptime, setUptime] = useState(0);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    useEffect(() => {
        if (!connected || !instance) return;
        instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected]);

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        try {
            const stats = JSON.parse(data);
            setUptime(stats.uptime || 0);
        } catch (e) {
            //
        }
    });

    return (
        <ServerContentBlock title={'Información'}>
            {/* Top Bar (Name & Actions) */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                <h1 className="text-lg font-bold text-white tracking-tight mb-4 md:mb-0">{name}</h1>
                <PowerButtons />
            </div>

            {/* Banner Image */}
            <div className="relative w-full h-32 md:h-48 rounded-xl overflow-hidden mb-6 shadow-lg border border-white/5 bg-[#0a0a0a]">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-70" 
                    style={{ backgroundImage: 'url(/assets/server_banner.png)' }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-black/80"></div>
                
                {/* Left Side Info */}
                <div className="absolute bottom-6 left-6 flex flex-col z-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">{name}</h2>
                    <div className="flex items-center text-xs font-medium">
                        <span className={`w-2 h-2 rounded-full mr-2 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${status === 'running' ? 'bg-green-500 shadow-green-500/50' : status === 'offline' ? 'bg-red-500 shadow-red-500/50' : 'bg-yellow-500 shadow-yellow-500/50'}`}></span>
                        <span className="text-neutral-300 mr-2">{status === 'running' ? 'En línea' : status === 'offline' ? 'Apagado' : capitalize(status || 'Cargando')}</span>
                        <span className="text-neutral-600 mr-2">•</span>
                        <span className="text-neutral-400">Uptime: {uptime > 0 ? <UptimeDuration uptime={uptime / 1000} /> : '0s'}</span>
                    </div>
                </div>

                {/* Right Side Watermark */}
                <div className="absolute top-1/2 -translate-y-1/2 right-6 pointer-events-none flex flex-col items-end opacity-[0.15]">
                    <span className="text-2xl md:text-3xl font-bold text-white tracking-widest uppercase leading-none">LUMENCRAFT</span>
                    <span className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mt-1">MINECRAFT PANEL</span>
                </div>
            </div>

            {/* Stats Grid */}
            <ServerDetailsBlock className="mb-6" />

            {/* Area Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Spinner.Suspense>
                    <StatGraphs />
                </Spinner.Suspense>
            </div>

            {/* Bottom Actions & Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center">
                        <FontAwesomeIcon icon={faInfoCircle} className="text-primary-500 mr-2" />
                        Información del servidor
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded-lg border border-white/[0.02]">
                            <span className="text-xs text-neutral-500">Nodo</span>
                            <span className="text-xs font-medium text-neutral-300">{node}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded-lg border border-white/[0.02]">
                            <span className="text-xs text-neutral-500">UUID del servidor</span>
                            <span className="text-xs font-medium text-neutral-300 truncate max-w-[200px]">{uuid}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center">
                        <FontAwesomeIcon icon={faBolt} className="text-primary-500 mr-2" />
                        Acciones rápidas
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Link to={`/server/${id}/console`} className="flex items-center p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.02] hover:border-white/[0.05] rounded-lg transition-all">
                            <FontAwesomeIcon icon={faTerminal} className="text-primary-400 mr-3" />
                            <span className="text-sm font-medium text-neutral-300">Console</span>
                        </Link>
                        <Link to={`/server/${id}/files`} className="flex items-center p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.02] hover:border-white/[0.05] rounded-lg transition-all">
                            <FontAwesomeIcon icon={faFolder} className="text-primary-400 mr-3" />
                            <span className="text-sm font-medium text-neutral-300">Files</span>
                        </Link>
                        <Link to={`/server/${id}/backups`} className="flex items-center p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.02] hover:border-white/[0.05] rounded-lg transition-all">
                            <FontAwesomeIcon icon={faBoxOpen} className="text-primary-400 mr-3" />
                            <span className="text-sm font-medium text-neutral-300">Backups</span>
                        </Link>
                        <Link to={`/server/${id}/settings`} className="flex items-center p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.02] hover:border-white/[0.05] rounded-lg transition-all">
                            <FontAwesomeIcon icon={faCog} className="text-primary-400 mr-3" />
                            <span className="text-sm font-medium text-neutral-300">Settings</span>
                        </Link>
                    </div>
                </div>
            </div>
        </ServerContentBlock>
    );
};

export default memo(ServerInformationContainer, isEqual);
