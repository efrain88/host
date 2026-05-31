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
                
                {/* Left Side Info (Centered Higher) */}
                <div className="absolute top-[30%] -translate-y-1/2 left-8 flex flex-col z-10">
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
