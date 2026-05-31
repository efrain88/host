import React, { useEffect, useState } from 'react';
import ContentBox from '@/components/elements/ContentBox';
import CreateApiKeyForm from '@/components/dashboard/forms/CreateApiKeyForm';
import getApiKeys, { ApiKey } from '@/api/account/getApiKeys';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import deleteApiKey from '@/api/account/deleteApiKey';
import FlashMessageRender from '@/components/FlashMessageRender';
import { format } from 'date-fns';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import GreyRowBox from '@/components/elements/GreyRowBox';
import { Dialog } from '@/components/elements/dialog';
import { useFlashKey } from '@/plugins/useFlash';
import Code from '@/components/elements/Code';

export default () => {
    const [deleteIdentifier, setDeleteIdentifier] = useState('');
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const { clearAndAddHttpError } = useFlashKey('account');

    useEffect(() => {
        getApiKeys()
            .then((keys) => setKeys(keys))
            .then(() => setLoading(false))
            .catch((error) => clearAndAddHttpError(error));
    }, []);

    const doDeletion = (identifier: string) => {
        setLoading(true);

        clearAndAddHttpError();
        deleteApiKey(identifier)
            .then(() => setKeys((s) => [...(s || []).filter((key) => key.identifier !== identifier)]))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => {
                setLoading(false);
                setDeleteIdentifier('');
            });
    };

    return (
        <PageContentBlock title={'Credenciales de la API'}>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Credenciales de la API</h1>
                <p className="text-sm text-neutral-400">Crea y gestiona claves de API para el acceso programático a tu cuenta.</p>
            </div>
            <FlashMessageRender byKey={'account'} />
            
            <div className="flex flex-col md:flex-row gap-6 max-w-6xl">
                {/* Crear clave de API */}
                <div className="bg-[#0a0a0c] border border-white/5 rounded-xl shadow-2xl p-6 flex-none w-full md:w-1/2">
                    <h2 className="text-base font-bold text-white mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Crear clave de API
                    </h2>
                    <CreateApiKeyForm onKeyCreated={(key) => setKeys((s) => [...s!, key])} />
                </div>

                {/* Claves de API */}
                <div className="bg-[#0a0a0c] border border-white/5 rounded-xl shadow-2xl p-6 flex-1">
                    <h2 className="text-base font-bold text-white mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Claves de API
                    </h2>
                    
                    <SpinnerOverlay visible={loading} />
                    <Dialog.Confirm
                        title={'Eliminar clave de API'}
                        confirm={'Eliminar Clave'}
                        open={!!deleteIdentifier}
                        onClose={() => setDeleteIdentifier('')}
                        onConfirmed={() => doDeletion(deleteIdentifier)}
                    >
                        Todas las peticiones que utilicen la clave <Code>{deleteIdentifier}</Code> serán invalidadas.
                    </Dialog.Confirm>

                    {keys.length === 0 ? (
                        <p className="text-center text-sm text-neutral-400 my-10">
                            {loading ? 'Cargando...' : 'No hay claves de API para esta cuenta.'}
                        </p>
                    ) : (
                        <div className="flex flex-col gap-y-3">
                            {keys.map((key) => (
                                <div key={key.identifier} className="bg-[#050505] border border-white/5 rounded-lg p-4 flex items-center transition-colors hover:border-white/10">
                                    <FontAwesomeIcon icon={faKey} className="text-neutral-500 text-lg mr-4" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-semibold text-white break-words">{key.description}</p>
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">
                                            Último uso:&nbsp;
                                            {key.lastUsedAt ? format(key.lastUsedAt, 'MMM do, yyyy HH:mm') : 'Nunca'}
                                        </p>
                                    </div>
                                    <div className="hidden md:block mx-4">
                                        <code className="font-mono text-xs py-1 px-2 bg-black/50 text-neutral-300 rounded border border-white/5">{key.identifier}</code>
                                    </div>
                                    <button 
                                        className="p-2 text-neutral-500 hover:text-red-400 transition-colors bg-white/5 hover:bg-red-500/10 rounded-lg"
                                        onClick={() => setDeleteIdentifier(key.identifier)}
                                    >
                                        <FontAwesomeIcon icon={faTrashAlt} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageContentBlock>
    );
};
