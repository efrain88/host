import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import reinstallServer from '@/api/server/reinstallServer';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components/macro';

const ContentBox = styled.div`
    ${tw`bg-[#0a0a0c] border border-white/5 rounded-2xl shadow-2xl mb-6 relative overflow-hidden`};
`;

const BoxHeader = styled.div`
    ${tw`flex items-center gap-x-3 p-6 pb-4 border-b border-white/5 bg-[#050505]`};
    h2 {
        ${tw`text-lg font-bold text-white tracking-wide`};
    }
    svg {
        ${tw`text-red-400 text-xl`};
    }
`;

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [modalVisible, setModalVisible] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const reinstall = () => {
        clearFlashes('settings');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: 'Tu servidor ha comenzado el proceso de reinstalación.',
                });
            })
            .catch((error) => {
                console.error(error);

                addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => setModalVisible(false));
    };

    useEffect(() => {
        clearFlashes();
    }, []);

    return (
        <ContentBox>
            <BoxHeader>
                <FontAwesomeIcon icon={faSync} />
                <h2>Reinstalar servidor</h2>
            </BoxHeader>
            <Dialog.Confirm
                open={modalVisible}
                title={'Confirmar reinstalación'}
                confirm={'Sí, reinstalar servidor'}
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
            >
                Su servidor se detendrá y algunos archivos pueden ser eliminados o modificados durante este proceso. ¿Está seguro de que desea continuar?
            </Dialog.Confirm>
            
            <div className="p-6 pt-4">
                <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
                    Se volverá a ejecutar el script de instalación que configuró el servidor inicialmente. Puede ocurrir lo siguiente:
                </p>
                <ul className="text-sm text-neutral-500 list-inside space-y-2 mb-6">
                    <li>- El servidor se detendrá durante el proceso</li>
                    <li>- Los archivos de configuración pueden sobrescribirse</li>
                    <li>- Algunos datos del juego pueden perderse o restablecerse</li>
                    <li>- Esta acción no se puede deshacer</li>
                </ul>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                    <p className="text-sm text-neutral-500">Comenzará de inmediato</p>
                    <Button.Danger variant={Button.Variants.Secondary} onClick={() => setModalVisible(true)} className="bg-red-600 hover:bg-red-500 text-white border-0 shadow-[0_0_15px_rgba(220,38,38,0.4)] px-6 py-2.5 rounded-xl font-bold transition-all">
                        <FontAwesomeIcon icon={faSync} className="mr-2" /> Reinstalar servidor
                    </Button.Danger>
                </div>
            </div>
        </ContentBox>
    );
};
