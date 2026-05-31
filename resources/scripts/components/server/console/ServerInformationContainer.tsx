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
import { faBullhorn, faTerminal, faFolder, faBoxOpen, faCog } from '@fortawesome/free-solid-svg-icons';
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
            {/* Promotional Banner */}
            <div className="bg-primary-900/40 border border-primary-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center mr-4">
                        <FontAwesomeIcon icon={faBullhorn} className="text-primary-400 text-lg" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Descuento del 15%</h3>
                        <p className="text-neutral-400 text-xs mt-0.5">Puedes obtener un 15% de descuento en tu factura de pago. Únicamente si se paga por tateo. Código: MC-15</p>
                    </div>
                </div>
                <a href="#" className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg transition-colors">
                    Click aquí
                </a>
            </div>

            {/* Server Header Block */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6 mb-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between shadow-lg">
                <div className="absolute -top-12 -right-4 opacity-[0.03] pointer-events-none text-[120px] font-black italic select-none leading-none tracking-tighter w-full text-right">
                    NEOVEX MINECRAFT PANEL
                </div>
                
                <div className="z-10 flex flex-col mb-4 md:mb-0">
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{name}</h1>
                    <div className="flex items-center text-xs font-medium">
                        <span className={`w-2 h-2 rounded-full mr-2 ${status === 'running' ? 'bg-green-500' : status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                        <span className="text-neutral-300 mr-3">{status === 'running' ? 'En línea' : status === 'offline' ? 'Apagado' : capitalize(status || 'Cargando')}</span>
                        <span className="text-neutral-600 mr-3">•</span>
                        <span className="text-neutral-400">Uptime: {uptime > 0 ? <UptimeDuration uptime={uptime / 1000} /> : '0s'}</span>
                    </div>
                </div>

                <div className="z-10">
                    <PowerButtons className="flex space-x-2" />
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
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Información del servidor</h3>
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
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Acciones rápidas</h3>
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
