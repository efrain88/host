import React, { useEffect, useState } from 'react';
import getServerDatabases from '@/api/server/databases/getServerDatabases';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import DatabaseRow from '@/components/server/databases/DatabaseRow';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import CreateDatabaseButton from '@/components/server/databases/CreateDatabaseButton';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import { useDeepMemoize } from '@/plugins/useDeepMemoize';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import ServerContentBlock from '@/components/elements/ServerContentBlock';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const databaseLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.databases);

    const { addError, clearFlashes } = useFlash();
    const [loading, setLoading] = useState(true);

    const databases = useDeepMemoize(ServerContext.useStoreState((state) => state.databases.data));
    const setDatabases = ServerContext.useStoreActions((state) => state.databases.setDatabases);

    useEffect(() => {
        setLoading(!databases.length);
        clearFlashes('databases');

        getServerDatabases(uuid)
            .then((databases) => setDatabases(databases))
            .catch((error) => {
                console.error(error);
                addError({ key: 'databases', message: httpErrorToHuman(error) });
            })
            .then(() => setLoading(false));
    }, []);

    return (
        <ServerContentBlock title="Bases de Datos">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }}>
                            <FontAwesomeIcon icon={faDatabase} className="text-white text-lg" />
                        </div>
                        Bases de Datos
                    </h1>
                    <p className="text-neutral-400 mt-1 text-sm">
                        Administra las bases de datos de tu servidor.
                    </p>
                </div>
            </div>

            <FlashMessageRender byKey={'databases'} className="mb-4" />

            {/* Contenedor principal */}
            <div className="relative rounded-2xl p-4 shadow-2xl" style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.05)' }}>
                <SpinnerOverlay visible={!databases.length && loading} />
                
                <div className="flex flex-col gap-y-3">
                    {databases.length > 0 ? (
                        databases.map((database) => (
                            <DatabaseRow key={database.id} database={database} />
                        ))
                    ) : (
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                            <FontAwesomeIcon icon={faDatabase} className="text-5xl text-neutral-800 mb-4" />
                            <p className="text-sm text-neutral-500 font-medium">
                                {databaseLimit > 0
                                    ? 'Parece que no tienes ninguna base de datos creada.'
                                    : 'No se pueden crear bases de datos para este servidor.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer de acción */}
                <Can action={'database.create'}>
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="mb-4 sm:mb-0">
                            {databaseLimit > 0 && databases.length > 0 && (
                                <p className="text-sm text-neutral-400 font-medium">
                                    <span className="text-violet-400">{databases.length}</span> de <span className="text-violet-400">{databaseLimit}</span> bases de datos utilizadas.
                                </p>
                            )}
                        </div>
                        {databaseLimit > 0 && databaseLimit !== databases.length && (
                            <CreateDatabaseButton />
                        )}
                    </div>
                </Can>
            </div>
        </ServerContentBlock>
    );
};
