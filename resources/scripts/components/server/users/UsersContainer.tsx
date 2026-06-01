import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import AddSubuserButton from '@/components/server/users/AddSubuserButton';
import UserRow from '@/components/server/users/UserRow';
import FlashMessageRender from '@/components/FlashMessageRender';
import getServerSubusers from '@/api/server/users/getServerSubusers';
import { httpErrorToHuman } from '@/api/http';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserShield } from '@fortawesome/free-solid-svg-icons';

const ContentBox = styled.div`
    ${tw`bg-[#0a0a0c] border border-white/5 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col mb-6`};
`;

const BoxHeader = styled.div`
    ${tw`flex items-center justify-between p-6 pb-4 border-b border-white/5 bg-[#050505]`};
    h2 {
        ${tw`flex items-center gap-x-3 text-lg font-bold text-white tracking-wide`};
    }
    svg {
        ${tw`text-purple-400 text-xl`};
    }
`;

export default () => {
    const [loading, setLoading] = useState(true);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const subusers = ServerContext.useStoreState((state) => state.subusers.data);
    const setSubusers = ServerContext.useStoreActions((actions) => actions.subusers.setSubusers);

    const permissions = useStoreState((state: ApplicationStore) => state.permissions.data);
    const getPermissions = useStoreActions((actions: Actions<ApplicationStore>) => actions.permissions.getPermissions);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    useEffect(() => {
        clearFlashes('users');
        getServerSubusers(uuid)
            .then((subusers) => {
                setSubusers(subusers);
                setLoading(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'users', message: httpErrorToHuman(error) });
            });
    }, []);

    useEffect(() => {
        getPermissions().catch((error) => {
            addError({ key: 'users', message: httpErrorToHuman(error) });
            console.error(error);
        });
    }, []);

    if (!subusers.length && (loading || !Object.keys(permissions).length)) {
        return <SpinnerOverlay visible={true} />;
    }

    return (
        <ServerContentBlock title={'Usuarios'}>
            <FlashMessageRender byKey={'users'} css={tw`mb-4`} />
            
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Gestión de Usuarios</h1>
                <p className="text-sm text-neutral-400">Invita a tus amigos o miembros del equipo para que te ayuden a administrar el servidor.</p>
            </div>

            <ContentBox>
                <BoxHeader>
                    <h2>
                        <FontAwesomeIcon icon={faUsers} />
                        Lista de Usuarios
                    </h2>
                    <Can action={'user.create'}>
                        <AddSubuserButton />
                    </Can>
                </BoxHeader>
                <div className="flex flex-col">
                    {!subusers.length ? (
                        <div className="p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                                <FontAwesomeIcon icon={faUserShield} className="text-purple-400 text-3xl" />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">No hay subusuarios</h3>
                            <p className="text-neutral-400 text-sm max-w-sm">Parece que eres el único administrando este servidor. ¡Añade a alguien usando el botón de arriba!</p>
                        </div>
                    ) : (
                        subusers.map((subuser) => <UserRow key={subuser.uuid} subuser={subuser} />)
                    )}
                </div>
            </ContentBox>
        </ServerContentBlock>
    );
};
