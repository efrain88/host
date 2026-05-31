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

            {/* Terminal Console */}
            <div className={'mb-6'}>
                <Spinner.Suspense>
                    <Console />
                </Spinner.Suspense>
            </div>

            {/* Stats Grid */}
            <ServerDetailsBlock className="mb-6" />
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
