import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArchive, faLock } from '@fortawesome/free-solid-svg-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Spinner from '@/components/elements/Spinner';
import { bytesToString } from '@/lib/formatters';
import Can from '@/components/elements/Can';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import BackupContextMenu from '@/components/server/backups/BackupContextMenu';
import getServerBackups from '@/api/swr/getServerBackups';
import { ServerBackup } from '@/api/server/types';
import { SocketEvent } from '@/components/server/events';

interface Props {
    backup: ServerBackup;
    className?: string;
}

export default ({ backup, className }: Props) => {
    const { mutate } = getServerBackups();

    useWebsocketEvent(`${SocketEvent.BACKUP_COMPLETED}:${backup.uuid}` as SocketEvent, (data) => {
        try {
            const parsed = JSON.parse(data);

            mutate(
                (data) => ({
                    ...data,
                    items: data.items.map((b) =>
                        b.uuid !== backup.uuid
                            ? b
                            : {
                                  ...b,
                                  isSuccessful: parsed.is_successful || true,
                                  checksum: (parsed.checksum_type || '') + ':' + (parsed.checksum || ''),
                                  bytes: parsed.file_size || 0,
                                  completedAt: new Date(),
                              }
                    ),
                }),
                false
            );
        } catch (e) {
            console.warn(e);
        }
    });

    return (
        <div
            className={`flex flex-col md:flex-row items-center p-4 rounded-xl transition-all duration-300 group ${className || ''}`}
            style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(217,70,239,0.05)';
                e.currentTarget.style.borderColor = 'rgba(217,70,239,0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
            }}
        >
            {/* Icono + Información Principal */}
            <div className="flex items-center w-full md:flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mr-4"
                     style={{ 
                         background: backup.isLocked ? 'rgba(234,179,8,0.1)' : 'rgba(217,70,239,0.1)', 
                         border: backup.isLocked ? '1px solid rgba(234,179,8,0.2)' : '1px solid rgba(217,70,239,0.2)' 
                     }}>
                    {backup.completedAt !== null ? (
                        backup.isLocked ? (
                            <FontAwesomeIcon icon={faLock} className="text-yellow-500" />
                        ) : (
                            <FontAwesomeIcon icon={faArchive} className="text-fuchsia-400" />
                        )
                    ) : (
                        <Spinner size={'small'} />
                    )}
                </div>
                
                <div className="flex flex-col truncate flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {backup.completedAt !== null && !backup.isSuccessful && (
                            <span className="bg-red-500/20 py-0.5 px-2.5 rounded-full text-red-400 text-[10px] uppercase font-bold border border-red-500/30">
                                Fallido
                            </span>
                        )}
                        <p className="text-base font-bold text-neutral-200 truncate group-hover:text-fuchsia-300 transition-colors">
                            {backup.name}
                        </p>
                        {backup.completedAt !== null && backup.isSuccessful && (
                            <span className="ml-2 text-fuchsia-400/80 text-xs font-mono font-bold bg-fuchsia-500/10 px-2 py-0.5 rounded-lg border border-fuchsia-500/20">
                                {bytesToString(backup.bytes)}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-neutral-500 font-mono truncate">{backup.checksum || 'Calculando checksum...'}</p>
                </div>
            </div>

            {/* Fecha de Creación */}
            <div className="flex-1 md:flex-none md:w-48 mt-4 md:mt-0 md:ml-8 md:text-center flex items-center md:flex-col justify-between w-full">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold md:mb-1 block md:hidden">Creado</p>
                <div>
                    <p title={format(backup.createdAt, 'dd/MM/yyyy HH:mm:ss')} className="text-sm text-neutral-300">
                        {formatDistanceToNow(backup.createdAt, { includeSeconds: true, addSuffix: true, locale: es })}
                    </p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mt-0.5 hidden md:block">Creado</p>
                </div>
                
                {/* Menú de Acciones (Móvil y Escritorio) */}
                <Can action={['backup.download', 'backup.restore', 'backup.delete']} matchAny>
                    <div className="md:ml-6 shrink-0">
                        {!backup.completedAt ? (
                            <div className="w-8 h-8 opacity-0" />
                        ) : (
                            <BackupContextMenu backup={backup} />
                        )}
                    </div>
                </Can>
            </div>
        </div>
    );
};
