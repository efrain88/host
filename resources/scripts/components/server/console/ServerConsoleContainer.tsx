import React, { memo, useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Console from '@/components/server/console/Console';
import StatGraphs from '@/components/server/console/StatGraphs';
import PowerButtons from '@/components/server/console/PowerButtons';
import ServerDetailsBlock from '@/components/server/console/ServerDetailsBlock';
import { Alert } from '@/components/elements/alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullhorn } from '@fortawesome/free-solid-svg-icons';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import UptimeDuration from '@/components/server/UptimeDuration';
import { capitalize } from '@/lib/strings';

const ServerConsoleContainer = () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);

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
        <ServerContentBlock title={'Consola'}>
            {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                <Alert type={'warning'} className={'mb-4'}>
                    {isNodeUnderMaintenance
                        ? 'El nodo de este servidor está en mantenimiento y las acciones no están disponibles.'
                        : isInstalling
                        ? 'Este servidor se está instalando y la mayoría de acciones no están disponibles.'
                        : 'Este servidor está siendo transferido a otro nodo y las acciones no están disponibles.'}
                </Alert>
            )}

            {/* Server Header Strip */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                <div className="flex items-center space-x-3 mb-4 md:mb-0">
                    <h1 className="text-xl font-bold text-white tracking-tight">{name}</h1>
                    <div className="flex items-center text-xs font-medium bg-white/5 px-2 py-1 rounded-md">
                        <span className={`w-2 h-2 rounded-full mr-2 ${status === 'running' ? 'bg-green-500' : status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                        <span className="text-neutral-300 mr-2">{status === 'running' ? 'En línea' : status === 'offline' ? 'Apagado' : capitalize(status || 'Cargando')}</span>
                        <span className="text-neutral-500 mr-2">•</span>
                        <span className="text-neutral-400">Uptime: {uptime > 0 ? <UptimeDuration uptime={uptime / 1000} /> : '0s'}</span>
                    </div>
                </div>

                <div className="flex items-center">
                    <PowerButtons className="flex space-x-2" />
                </div>
            </div>

            {/* Banner Image */}
            <div className="relative w-full h-32 md:h-48 rounded-xl overflow-hidden mb-6 shadow-lg border border-white/5">
                <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: 'url(/assets/server_banner.png)' }}
                ></div>
                <div className="absolute inset-0 bg-black/40 bg-gradient-to-r from-[#0a0a0a] to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <h2 className="text-4xl md:text-5xl font-black italic text-white/10 tracking-tighter text-center select-none uppercase">
                        LUMENCRAFT MINECRAFT PANEL
                    </h2>
                </div>
            </div>

            {/* Terminal Console */}
            <div className={'mb-6'}>
                <Spinner.Suspense>
                    <Console />
                </Spinner.Suspense>
            </div>

            {/* Stats Grid */}
            <ServerDetailsBlock className="mb-6" />

            {/* Area Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Spinner.Suspense>
                    <StatGraphs />
                </Spinner.Suspense>
            </div>
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
