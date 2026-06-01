import React, { useState } from 'react';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ServerContext } from '@/state/server';
import deleteServerAllocation from '@/api/server/network/deleteServerAllocation';
import getServerAllocations from '@/api/swr/getServerAllocations';
import { useFlashKey } from '@/plugins/useFlash';
import { Dialog } from '@/components/elements/dialog';

interface Props {
    allocation: number;
}

const DeleteAllocationButton = ({ allocation }: Props) => {
    const [confirm, setConfirm] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    const { mutate } = getServerAllocations();
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');

    const deleteAllocation = () => {
        clearFlashes();

        mutate((data) => data?.filter((a) => a.id !== allocation), false);
        setServerFromState((s) => ({ ...s, allocations: s.allocations.filter((a) => a.id !== allocation) }));

        deleteServerAllocation(uuid, allocation).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    return (
        <>
            <Dialog.Confirm
                open={confirm}
                onClose={() => setConfirm(false)}
                title={'Eliminar Asignación'}
                confirm={'Eliminar'}
                onConfirmed={deleteAllocation}
            >
                Esta asignación será removida inmediatamente de tu servidor.
            </Dialog.Confirm>
            <button
                type="button"
                onClick={() => setConfirm(true)}
                className="w-[34px] h-[34px] flex items-center justify-center rounded-lg transition-all text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
            >
                <FontAwesomeIcon icon={faTrashAlt} />
            </button>
        </>
    );
};

export default DeleteAllocationButton;
