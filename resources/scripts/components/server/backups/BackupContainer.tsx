import React, { useContext, useEffect, useState } from 'react';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import useFlash from '@/plugins/useFlash';
import Can from '@/components/elements/Can';
import CreateBackupButton from '@/components/server/backups/CreateBackupButton';
import FlashMessageRender from '@/components/FlashMessageRender';
import BackupRow from '@/components/server/backups/BackupRow';
import getServerBackups, { Context as ServerBackupContext } from '@/api/swr/getServerBackups';
import { ServerContext } from '@/state/server';
import Pagination from '@/components/elements/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArchive } from '@fortawesome/free-solid-svg-icons';

const BackupContainer = () => {
    const { page, setPage } = useContext(ServerBackupContext);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data: backups, error, isValidating } = getServerBackups();

    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);

    useEffect(() => {
        if (!error) {
            clearFlashes('backups');
            return;
        }

        clearAndAddHttpError({ error, key: 'backups' });
    }, [error]);

    return (
        <div className="flex flex-col w-full">
            {/* Header / Título */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }}>
                            <FontAwesomeIcon icon={faFileArchive} className="text-white text-lg" />
                        </div>
                        Copias de Seguridad
                    </h1>
                    <p className="text-neutral-400 mt-1 text-sm">
                        Crea y administra backups completos o parciales de los archivos de tu servidor.
                    </p>
                </div>
            </div>

            <FlashMessageRender byKey={'backups'} className="mb-4" />

            {/* Contenedor principal */}
            <div className="relative rounded-2xl p-4 shadow-2xl" style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.05)' }}>
                <SpinnerOverlay visible={(!backups || (error && isValidating)) && true} />
                
                {backups && (
                    <Pagination data={backups} onPageSelect={setPage}>
                        {({ items }) =>
                            !items.length ? (
                                !backupLimit ? null : (
                                    <div className="py-16 flex flex-col items-center justify-center text-center">
                                        <FontAwesomeIcon icon={faFileArchive} className="text-5xl text-neutral-800 mb-4" />
                                        <p className="text-sm text-neutral-500 font-medium">
                                            {page > 1
                                                ? "Parece que no hay más backups en esta página."
                                                : 'No hay ninguna copia de seguridad guardada para este servidor.'}
                                        </p>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col gap-y-3">
                                    {items.map((backup) => (
                                        <BackupRow key={backup.uuid} backup={backup} />
                                    ))}
                                </div>
                            )
                        }
                    </Pagination>
                )}

                {backupLimit === 0 && (
                    <p className="text-center text-sm text-neutral-500 mt-4">
                        No se pueden crear copias de seguridad porque el límite del servidor es 0.
                    </p>
                )}

                {/* Footer de acción */}
                <Can action={'backup.create'}>
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="mb-4 sm:mb-0">
                            {backupLimit > 0 && backups && backups.backupCount > 0 && (
                                <p className="text-sm text-neutral-400 font-medium">
                                    <span className="text-fuchsia-400">{backups.backupCount}</span> de <span className="text-fuchsia-400">{backupLimit}</span> backups utilizados.
                                </p>
                            )}
                        </div>
                        {backupLimit > 0 && backups && backupLimit > backups.backupCount && (
                            <CreateBackupButton />
                        )}
                    </div>
                </Can>
            </div>
        </div>
    );
};

export default () => {
    const [page, setPage] = useState<number>(1);
    return (
        <ServerBackupContext.Provider value={{ page, setPage }}>
            <BackupContainer />
        </ServerBackupContext.Provider>
    );
};
