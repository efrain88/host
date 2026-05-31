import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthernet, faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import Spinner from '@/components/elements/Spinner';
import styled from 'styled-components/macro';
import isEqual from 'react-fast-compare';
import classNames from 'classnames';

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const StatusIndicatorBox = styled(Link)<{ $status: ServerPowerState | undefined }>`
    ${tw`flex flex-col lg:flex-row items-center gap-y-4 gap-x-6 relative bg-[#0a0a0c] border border-white/5 rounded-2xl shadow-2xl p-4 hover:bg-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden no-underline`};

    & .status-bar {
        ${tw`w-1.5 absolute right-0 top-0 bottom-0 z-20 transition-all duration-300`};
        
        ${({ $status }) =>
            !$status || $status === 'offline'
                ? tw`bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]`
                : $status === 'running'
                ? tw`bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]`
                : tw`bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)]`};
    }

    &:hover .status-bar {
        ${tw`w-2 brightness-125`};
    }
`;

type Timer = ReturnType<typeof setInterval>;

export default ({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        // Don't waste a HTTP request if there is nothing important to show to the user because
        // the server is suspended.
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Ilimitado';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Ilimitado';
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : 'Ilimitado';

    return (
        <StatusIndicatorBox to={`/server/${server.id}`} className={className} $status={stats?.status}>
            {/* Lado Izquierdo: Icono y Nombre */}
            <div className="flex items-center gap-x-4 w-full lg:w-1/3 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                    <FontAwesomeIcon icon={faServer} className="text-xl text-neutral-400" />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <p className="text-lg font-bold text-white truncate">{server.name}</p>
                    {!!server.description && (
                        <p className="text-xs text-neutral-400 truncate mt-0.5">{server.description}</p>
                    )}
                </div>
            </div>

            {/* Centro: IP Address */}
            <div className="w-full lg:w-auto lg:flex-1 flex items-center lg:justify-center">
                <div className="flex items-center gap-x-2 bg-[#050505] px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">
                    <FontAwesomeIcon icon={faEthernet} className="text-xs text-neutral-500" />
                    <p className="text-xs font-mono font-medium text-neutral-300 truncate">
                        {server.allocations
                            .filter((alloc) => alloc.isDefault)
                            .map((allocation) => (
                                <React.Fragment key={allocation.ip + allocation.port.toString()}>
                                    {allocation.alias || ip(allocation.ip)}:{allocation.port}
                                </React.Fragment>
                            ))}
                    </p>
                </div>
            </div>

            {/* Derecha: Recursos */}
            <div className="w-full lg:w-5/12 flex items-center justify-start lg:justify-end gap-x-6 lg:pr-6">
                {!stats || isSuspended ? (
                    isSuspended ? (
                        <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-1 rounded-md font-medium">
                            {server.status === 'suspended' ? 'Suspendido' : 'Error de Conexión'}
                        </span>
                    ) : server.isTransferring || server.status ? (
                        <span className="bg-neutral-500/10 border border-neutral-500/20 text-neutral-400 text-xs px-3 py-1 rounded-md font-medium">
                            {server.isTransferring
                                ? 'Transfiriendo'
                                : server.status === 'installing'
                                ? 'Instalando'
                                : server.status === 'restoring_backup'
                                ? 'Restaurando Backup'
                                : 'No Disponible'}
                        </span>
                    ) : (
                        <Spinner size="small" />
                    )
                ) : (
                    <React.Fragment>
                        {/* CPU */}
                        <div className="flex items-center gap-x-2">
                            <FontAwesomeIcon icon={faMicrochip} className={alarms.cpu ? 'text-red-400' : 'text-neutral-500'} />
                            <div className="flex flex-col">
                                <span className={classNames("text-xs font-bold", alarms.cpu ? "text-red-400" : "text-white")}>
                                    {stats.cpuUsagePercent.toFixed(2)} %
                                </span>
                                <span className="text-[10px] text-neutral-500 font-medium tracking-wide">de {cpuLimit}</span>
                            </div>
                        </div>

                        {/* RAM */}
                        <div className="flex items-center gap-x-2">
                            <FontAwesomeIcon icon={faMemory} className={alarms.memory ? 'text-red-400' : 'text-neutral-500'} />
                            <div className="flex flex-col">
                                <span className={classNames("text-xs font-bold", alarms.memory ? "text-red-400" : "text-white")}>
                                    {bytesToString(stats.memoryUsageInBytes)}
                                </span>
                                <span className="text-[10px] text-neutral-500 font-medium tracking-wide">de {memoryLimit}</span>
                            </div>
                        </div>

                        {/* DISK */}
                        <div className="flex items-center gap-x-2">
                            <FontAwesomeIcon icon={faHdd} className={alarms.disk ? 'text-red-400' : 'text-neutral-500'} />
                            <div className="flex flex-col">
                                <span className={classNames("text-xs font-bold", alarms.disk ? "text-red-400" : "text-white")}>
                                    {bytesToString(stats.diskUsageInBytes)}
                                </span>
                                <span className="text-[10px] text-neutral-500 font-medium tracking-wide">de {diskLimit}</span>
                            </div>
                        </div>
                    </React.Fragment>
                )}
            </div>
            
            {/* Barra de estado en el borde derecho */}
            <div className="status-bar" />
        </StatusIndicatorBox>
    );
};
