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

// Determines if the current value is in an alarm threshold
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const StatusIndicatorBox = styled(Link)<{ $status: ServerPowerState | undefined }>`
    ${tw`flex flex-col lg:flex-row items-center gap-y-4 gap-x-6 relative border border-white/5 p-5 transition-all duration-300 overflow-hidden no-underline`};
    background-color: rgba(18, 18, 18, 0.7); /* Lighter gray/black */
    backdrop-filter: blur(12px);
    border-radius: 1.5rem;
    box-shadow: 0 8px 30px rgba(0,0,0,0.5);

    &:hover {
        background-color: rgba(24, 24, 27, 0.9); /* Lighter on hover */
        border-color: rgba(245, 158, 11, 0.3);
        transform: translateY(-2px);
    }

    & .status-bar {
        ${tw`absolute right-0 top-0 bottom-0 z-20 transition-all duration-300`};
        width: 0.375rem; /* w-1.5 */
        
        ${({ $status }) =>
            !$status || $status === 'offline'
                ? 'background-color: rgba(239, 68, 68, 0.8); box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);'
                : $status === 'running'
                ? 'background-color: rgba(34, 197, 94, 0.8); box-shadow: 0 0 15px rgba(34, 197, 94, 0.5);'
                : 'background-color: rgba(245, 158, 11, 0.8); box-shadow: 0 0 15px rgba(245, 158, 11, 0.5);'};
    }

    &:hover .status-bar {
        width: 0.5rem; /* w-2 */
        filter: brightness(1.5);
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

    // Calculate progress for bars
    const memoryProgress = server.limits.memory > 0 && stats ? Math.min((stats.memoryUsageInBytes / mbToBytes(server.limits.memory)) * 100, 100) : 0;
    const diskProgress = server.limits.disk > 0 && stats ? Math.min((stats.diskUsageInBytes / mbToBytes(server.limits.disk)) * 100, 100) : 0;
    const cpuProgress = server.limits.cpu > 0 && stats ? Math.min((stats.cpuUsagePercent / server.limits.cpu) * 100, 100) : (stats ? Math.min(stats.cpuUsagePercent, 100) : 0);

    const isOnline = stats?.status === 'running';
    const isStarting = stats?.status === 'starting';
    const isOffline = !stats || isSuspended || stats?.status === 'offline';
    
    const iconContainerClass = classNames(
        "w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner transition-colors duration-500",
        {
            "bg-white/5 border-white/10": isOffline,
            "bg-green-500/10 border-green-500/30 shadow-[inset_0_0_15px_rgba(34,197,94,0.1)]": isOnline,
            "bg-amber-500/10 border-amber-500/30 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]": isStarting && !isOnline && !isOffline
        }
    );

    const iconColorClass = classNames(
        "text-2xl transition-colors duration-500",
        {
            "text-neutral-500": isOffline,
            "text-green-400": isOnline,
            "text-amber-400": isStarting && !isOnline && !isOffline
        }
    );

    return (
        <StatusIndicatorBox to={`/server/${server.id}`} className={className} $status={stats?.status}>
            {/* Lado Izquierdo: Icono y Nombre */}
            <div className="flex items-center gap-x-5 w-full lg:w-1/3 shrink-0">
                <div className={iconContainerClass}>
                    <FontAwesomeIcon icon={faServer} className={iconColorClass} />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <p className="text-xl font-black text-white truncate tracking-wide">{server.name}</p>
                    {!!server.description && (
                        <p className="text-xs text-neutral-400 truncate mt-0.5 font-medium">{server.description}</p>
                    )}
                </div>
            </div>

            {/* Centro: IP Address */}
            <div className="w-full lg:w-auto lg:flex-1 flex items-center lg:justify-center">
                <div className="flex items-center gap-x-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5 shadow-inner hover:border-white/10 transition-colors">
                    <FontAwesomeIcon icon={faEthernet} className="text-xs text-amber-500/70" />
                    <p className="text-xs font-mono font-bold text-neutral-200 truncate tracking-wider">
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
            <div className="w-full lg:w-5/12 flex items-center justify-start lg:justify-end gap-x-8 lg:pr-6">
                {!stats || isSuspended ? (
                    isSuspended ? (
                        <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-1 rounded-md font-bold uppercase tracking-wide">
                            {server.status === 'suspended' ? 'Suspendido' : 'Error de Conexión'}
                        </span>
                    ) : server.isTransferring || server.status ? (
                        <span className="bg-neutral-500/10 border border-neutral-500/20 text-neutral-400 text-xs px-3 py-1 rounded-md font-bold uppercase tracking-wide">
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
                        <div className="flex items-center gap-x-3 w-28">
                            <FontAwesomeIcon icon={faMicrochip} className={alarms.cpu ? 'text-red-400' : 'text-neutral-400'} />
                            <div className="flex flex-col w-full">
                                <div className="flex items-baseline justify-between mb-1">
                                    <span className={classNames("text-xs font-bold", alarms.cpu ? "text-red-400" : "text-neutral-200")}>
                                        {stats.cpuUsagePercent.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden">
                                    <div 
                                        className={classNames("h-full rounded-full transition-all duration-500", alarms.cpu ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" : "bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]")} 
                                        style={{ width: `${cpuProgress}%` }} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RAM */}
                        <div className="flex items-center gap-x-3 w-28">
                            <FontAwesomeIcon icon={faMemory} className={alarms.memory ? 'text-red-400' : 'text-neutral-400'} />
                            <div className="flex flex-col w-full">
                                <div className="flex items-baseline justify-between mb-1">
                                    <span className={classNames("text-xs font-bold", alarms.memory ? "text-red-400" : "text-neutral-200")}>
                                        {bytesToString(stats.memoryUsageInBytes)}
                                    </span>
                                </div>
                                <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden">
                                    <div 
                                        className={classNames("h-full rounded-full transition-all duration-500", alarms.memory ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" : "bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]")} 
                                        style={{ width: `${memoryProgress}%` }} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* DISK */}
                        <div className="flex items-center gap-x-3 w-28 hidden sm:flex">
                            <FontAwesomeIcon icon={faHdd} className={alarms.disk ? 'text-red-400' : 'text-neutral-400'} />
                            <div className="flex flex-col w-full">
                                <div className="flex items-baseline justify-between mb-1">
                                    <span className={classNames("text-xs font-bold", alarms.disk ? "text-red-400" : "text-neutral-200")}>
                                        {bytesToString(stats.diskUsageInBytes)}
                                    </span>
                                </div>
                                <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden">
                                    <div 
                                        className={classNames("h-full rounded-full transition-all duration-500", alarms.disk ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" : "bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]")} 
                                        style={{ width: `${diskProgress}%` }} 
                                    />
                                </div>
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
