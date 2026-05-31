import React, { useEffect } from 'react';
import ContentBox from '@/components/elements/ContentBox';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import GreyRowBox from '@/components/elements/GreyRowBox';
import { useSSHKeys } from '@/api/account/ssh-keys';
import { useFlashKey } from '@/plugins/useFlash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import CreateSSHKeyForm from '@/components/dashboard/ssh/CreateSSHKeyForm';
import DeleteSSHKeyButton from '@/components/dashboard/ssh/DeleteSSHKeyButton';

export default () => {
    const { clearAndAddHttpError } = useFlashKey('account');
    const { data, isValidating, error } = useSSHKeys({
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    return (
        <PageContentBlock title={'Claves SSH'}>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Claves SSH</h1>
                <p className="text-sm text-neutral-400">Gestiona las claves SSH para el acceso SFTP a tus servidores.</p>
            </div>
            <FlashMessageRender byKey={'account'} />
            
            <div className="flex flex-col md:flex-row gap-6 max-w-6xl">
                {/* Añadir clave SSH */}
                <div className="bg-[#0a0a0c] border border-white/5 rounded-xl shadow-2xl p-6 flex-none w-full md:w-1/2">
                    <h2 className="text-base font-bold text-white mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Añadir clave SSH
                    </h2>
                    <CreateSSHKeyForm />
                </div>

                {/* Claves SSH */}
                <div className="bg-[#0a0a0c] border border-white/5 rounded-xl shadow-2xl p-6 flex-1">
                    <h2 className="text-base font-bold text-white mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Claves SSH
                    </h2>
                    
                    <SpinnerOverlay visible={!data && isValidating} />
                    {!data || !data.length ? (
                        <p className="text-center text-sm text-neutral-400 my-10">
                            {!data ? 'Cargando...' : 'No hay claves SSH para esta cuenta.'}
                        </p>
                    ) : (
                        <div className="flex flex-col gap-y-3">
                            {data.map((key) => (
                                <div key={key.fingerprint} className="bg-[#050505] border border-white/5 rounded-lg p-4 flex items-center transition-colors hover:border-white/10">
                                    <FontAwesomeIcon icon={faKey} className="text-neutral-500 text-lg mr-4" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-semibold text-white break-words">{key.name}</p>
                                        <p className="text-xs mt-1 font-mono text-neutral-400 truncate">SHA256:{key.fingerprint}</p>
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">
                                            Añadida el:&nbsp;
                                            {format(key.createdAt, 'MMM do, yyyy HH:mm')}
                                        </p>
                                    </div>
                                    <div className="ml-4">
                                        <DeleteSSHKeyButton name={key.name} fingerprint={key.fingerprint} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageContentBlock>
    );
};
