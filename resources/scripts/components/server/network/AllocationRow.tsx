import React, { memo, useCallback, useState } from 'react';
import isEqual from 'react-fast-compare';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNetworkWired, faStar } from '@fortawesome/free-solid-svg-icons';
import InputSpinner from '@/components/elements/InputSpinner';
import { Textarea } from '@/components/elements/Input';
import Can from '@/components/elements/Can';
import { Allocation } from '@/api/server/getServer';
import { debounce } from 'debounce';
import setServerAllocationNotes from '@/api/server/network/setServerAllocationNotes';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import CopyOnClick from '@/components/elements/CopyOnClick';
import DeleteAllocationButton from '@/components/server/network/DeleteAllocationButton';
import setPrimaryServerAllocation from '@/api/server/network/setPrimaryServerAllocation';
import getServerAllocations from '@/api/swr/getServerAllocations';
import { ip } from '@/lib/formatters';

interface Props {
    allocation: Allocation;
}

const AllocationRow = ({ allocation }: Props) => {
    const [loading, setLoading] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = getServerAllocations();

    const onNotesChanged = useCallback((id: number, notes: string) => {
        mutate((data) => data?.map((a) => (a.id === id ? { ...a, notes } : a)), false);
    }, []);

    const setAllocationNotes = debounce((notes: string) => {
        setLoading(true);
        clearFlashes();

        setServerAllocationNotes(uuid, allocation.id, notes)
            .then(() => onNotesChanged(allocation.id, notes))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    }, 750);

    const setPrimaryAllocation = () => {
        clearFlashes();
        mutate((data) => data?.map((a) => ({ ...a, isDefault: a.id === allocation.id })), false);

        setPrimaryServerAllocation(uuid, allocation.id).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    return (
        <div
            className={`relative flex flex-col md:flex-row items-center bg-[#0a0a0d] border ${allocation.isDefault ? 'border-emerald-500/50' : 'border-white/5'} p-4 rounded-xl transition-all hover:bg-white/5 gap-4`}
            style={allocation.isDefault ? { boxShadow: '0 0 15px rgba(16,185,129,0.1)' } : undefined}
        >
            <div className="flex items-center w-full md:w-auto">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${allocation.isDefault ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-neutral-400'}`}>
                    <FontAwesomeIcon icon={faNetworkWired} className="text-lg" />
                </div>
                
                <div className="flex-1 md:w-48 mr-4">
                    <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-1">
                        {allocation.alias ? 'Dominio' : 'Dirección IP'}
                    </p>
                    {allocation.alias ? (
                        <CopyOnClick text={allocation.alias}>
                            <p className="font-mono text-sm text-white cursor-pointer hover:text-emerald-400 transition-colors truncate">
                                {allocation.alias}
                            </p>
                        </CopyOnClick>
                    ) : (
                        <CopyOnClick text={ip(allocation.ip)}>
                            <p className="font-mono text-sm text-white cursor-pointer hover:text-emerald-400 transition-colors truncate">
                                {ip(allocation.ip)}
                            </p>
                        </CopyOnClick>
                    )}
                </div>
                
                <div className="w-16 md:w-24">
                    <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-1">Puerto</p>
                    <p className="font-mono text-sm text-white bg-white/10 px-2 py-0.5 rounded border border-white/5 inline-block">
                        {allocation.port}
                    </p>
                </div>
            </div>

            <div className="w-full md:flex-1">
                <InputSpinner visible={loading}>
                    <Textarea
                        className="bg-[#050505] hover:border-emerald-500/50 focus:border-emerald-500 border-white/10 text-sm py-2 px-3 rounded-lg resize-none transition-colors w-full h-[42px] min-h-[42px]"
                        placeholder="Añadir notas opcionales..."
                        defaultValue={allocation.notes || undefined}
                        onChange={(e) => setAllocationNotes(e.currentTarget.value)}
                    />
                </InputSpinner>
            </div>

            <div className="flex justify-end space-x-3 w-full md:w-auto shrink-0">
                {allocation.isDefault ? (
                    <div className="px-3 py-1.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg flex items-center gap-2">
                        <FontAwesomeIcon icon={faStar} />
                        Principal
                    </div>
                ) : (
                    <>
                        <Can action={'allocation.update'}>
                            <button
                                onClick={setPrimaryAllocation}
                                className="px-3 py-1.5 text-xs font-bold text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-white/10"
                            >
                                Hacer Principal
                            </button>
                        </Can>
                        <Can action={'allocation.delete'}>
                            <DeleteAllocationButton allocation={allocation.id} />
                        </Can>
                    </>
                )}
            </div>
        </div>
    );
};

export default memo(AllocationRow, isEqual);
