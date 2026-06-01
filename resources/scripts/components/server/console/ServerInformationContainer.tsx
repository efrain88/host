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
            <div className="relative w-full h-32 md:h-48 rounded-2xl overflow-hidden mb-6 shadow-2xl border border-white/5 bg-[#050505]">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-70" 
                    style={{ backgroundImage: 'url(/assets/server_banner.png)' }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-black/90"></div>
                
                {/* Left Side Info (Centered Middle) */}
                <div className="absolute top-1/2 -translate-y-1/2 left-8 flex flex-col z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-md">{name}</h2>
                    <div className="flex items-center text-xs font-medium">
                        <span className={`w-2 h-2 rounded-full mr-2 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${status === 'running' ? 'bg-green-500 shadow-green-500/50' : status === 'offline' ? 'bg-red-500 shadow-red-500/50' : 'bg-yellow-500 shadow-yellow-500/50'}`}></span>
                        <span className="text-neutral-300 mr-2 drop-shadow-sm">{status === 'running' ? 'En línea' : status === 'offline' ? 'Apagado' : capitalize(status || 'Cargando')}</span>
                        <span className="text-neutral-500 mr-2 drop-shadow-sm">•</span>
                        <span className="text-neutral-300 drop-shadow-sm">Activo: {uptime > 0 ? <UptimeDuration uptime={uptime / 1000} /> : '0s'}</span>
                    </div>
                </div>

                {/* Right Side Watermark */}
                <div className="absolute top-1/2 -translate-y-1/2 right-8 pointer-events-none flex flex-col items-end opacity-[0.25]">
                    <span className="text-2xl md:text-3xl font-bold text-white tracking-widest uppercase leading-none drop-shadow-lg">LUMENCRAFT</span>
                    <span className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mt-1 drop-shadow-lg">MINECRAFT PANEL</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#050505] border border-white/5 rounded-2xl p-6 shadow-xl hover:border-white/10 transition-colors">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-5 flex items-center">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{ background: 'rgba(245,158,11,0.1)' }}>
                            <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-500 text-sm" />
                        </div>
                        Información del Servidor
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-xl border border-white/[0.02]">
                            <span className="text-xs font-medium text-neutral-500">Nodo</span>
                            <span className="text-[13px] font-black text-yellow-500">{node}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-xl border border-white/[0.02]">
                            <span className="text-xs font-medium text-neutral-500">UUID del servidor</span>
                            <span className="text-[13px] font-black text-yellow-500 truncate max-w-[200px]">{uuid}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#050505] border border-white/5 rounded-2xl p-6 shadow-xl hover:border-white/10 transition-colors">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-5 flex items-center">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{ background: 'rgba(245,158,11,0.1)' }}>
                            <FontAwesomeIcon icon={faBolt} className="text-yellow-500 text-sm" />
                        </div>
                        Acciones Rápidas
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link to={`/server/${id}/console`} className="flex flex-row items-center p-4 bg-white/[0.02] hover:bg-yellow-500/10 border border-white/[0.02] hover:border-yellow-500/30 rounded-xl transition-all group">
                            <FontAwesomeIcon icon={faTerminal} className="text-yellow-500 group-hover:text-yellow-400 mr-3 text-lg transition-colors" />
                            <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors">Consola</span>
                        </Link>
                        <Link to={`/server/${id}/files`} className="flex flex-row items-center p-4 bg-white/[0.02] hover:bg-yellow-500/10 border border-white/[0.02] hover:border-yellow-500/30 rounded-xl transition-all group">
                            <FontAwesomeIcon icon={faFolder} className="text-yellow-500 group-hover:text-yellow-400 mr-3 text-lg transition-colors" />
                            <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors">Archivos</span>
                        </Link>
                        <Link to={`/server/${id}/backups`} className="flex flex-row items-center p-4 bg-white/[0.02] hover:bg-yellow-500/10 border border-white/[0.02] hover:border-yellow-500/30 rounded-xl transition-all group">
                            <FontAwesomeIcon icon={faBoxOpen} className="text-yellow-500 group-hover:text-yellow-400 mr-3 text-lg transition-colors" />
                            <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors">Backups</span>
                        </Link>
                        <Link to={`/server/${id}/settings`} className="flex flex-row items-center p-4 bg-white/[0.02] hover:bg-yellow-500/10 border border-white/[0.02] hover:border-yellow-500/30 rounded-xl transition-all group">
                            <FontAwesomeIcon icon={faCog} className="text-yellow-500 group-hover:text-yellow-400 mr-3 text-lg transition-colors" />
                            <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors">Ajustes</span>
                        </Link>
                    </div>
                </div>
            </div>
        </ServerContentBlock>
    );
};

export default memo(ServerInformationContainer, isEqual);
