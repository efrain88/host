import React, { useState } from 'react';
import { Subuser } from '@/state/server/subusers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faUnlockAlt, faUserLock } from '@fortawesome/free-solid-svg-icons';
import RemoveSubuserButton from '@/components/server/users/RemoveSubuserButton';
import EditSubuserModal from '@/components/server/users/EditSubuserModal';
import Can from '@/components/elements/Can';
import { useStoreState } from 'easy-peasy';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

const RowBox = styled.div`
    ${tw`flex items-center bg-[#050505] border-t border-white/5 p-4 transition-colors hover:bg-white/[0.02]`};
    
    &:first-of-type {
        ${tw`border-t-0`}
    }
`;

interface Props {
    subuser: Subuser;
}

export default ({ subuser }: Props) => {
    const uuid = useStoreState((state) => state.user!.data!.uuid);
    const [visible, setVisible] = useState(false);

    return (
        <RowBox>
            <EditSubuserModal subuser={subuser} visible={visible} onModalDismissed={() => setVisible(false)} />
            
            <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 overflow-hidden shrink-0 hidden md:block">
                <img className="w-full h-full object-cover" src={`${subuser.image}?s=400`} alt="Avatar" />
            </div>
            
            <div className="ml-4 flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-neutral-200 truncate">{subuser.email}</p>
            </div>
            
            <div className="ml-4">
                <p className="font-medium text-center">
                    <FontAwesomeIcon
                        icon={subuser.twoFactorEnabled ? faUserLock : faUnlockAlt}
                        fixedWidth
                        className={!subuser.twoFactorEnabled ? 'text-red-400' : 'text-green-400'}
                    />
                </p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider hidden md:block mt-1">2FA Activo</p>
            </div>
            
            <div className="ml-6 hidden md:block">
                <p className="font-bold text-center text-purple-400">
                    {subuser.permissions.filter((permission) => permission !== 'websocket.connect').length}
                </p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Permisos</p>
            </div>
            
            {subuser.uuid !== uuid && (
                <div className="ml-6 flex items-center gap-x-2">
                    <Can action={'user.update'}>
                        <button
                            type={'button'}
                            aria-label={'Editar usuario'}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-purple-500/20 hover:border-purple-500/30 border border-transparent transition-all"
                            onClick={() => setVisible(true)}
                        >
                            <FontAwesomeIcon icon={faPencilAlt} />
                        </button>
                    </Can>
                    <Can action={'user.delete'}>
                        <RemoveSubuserButton subuser={subuser} />
                    </Can>
                </div>
            )}
        </RowBox>
    );
};
