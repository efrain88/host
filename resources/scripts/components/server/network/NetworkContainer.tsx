import React, { useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import { useFlashKey } from '@/plugins/useFlash';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import AllocationRow from '@/components/server/network/AllocationRow';
import createServerAllocation from '@/api/server/network/createServerAllocation';
import Can from '@/components/elements/Can';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import getServerAllocations from '@/api/swr/getServerAllocations';
import isEqual from 'react-fast-compare';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNetworkWired, faPlus } from '@fortawesome/free-solid-svg-icons';

const NetworkContainer = () => {
    const [loading, setLoading] = useState(false);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const allocationLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.allocations);
    const allocations = ServerContext.useStoreState((state) => state.server.data!.allocations, isEqual);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const { data, error, mutate } = getServerAllocations();

    useEffect(() => {
        mutate(allocations);
    }, []);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    useDeepCompareEffect(() => {
        if (!data) return;

        setServerFromState((state) => ({ ...state, allocations: data }));
    }, [data]);

    const onCreateAllocation = () => {
        clearFlashes();

        setLoading(true);
        createServerAllocation(uuid)
            .then((allocation) => {
                setServerFromState((s) => ({ ...s, allocations: s.allocations.concat(allocation) }));
                return mutate(data?.concat(allocation), false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    };

    return (
        <ServerContentBlock showFlashKey={'server:network'} title={'Red'}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
                            <FontAwesomeIcon icon={faNetworkWired} className="text-white text-lg" />
                        </div>
                        Red
                    </h1>
                    <p className="text-neutral-400 mt-1 text-sm">
                        Administra las direcciones IP y puertos disponibles para este servidor.
                    </p>
                </div>
            </div>

            <div className="relative rounded-2xl p-4 shadow-2xl" style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.05)' }}>
                {!data ? (
                    <Spinner size={'large'} centered />
                ) : (
                    <>
                        <div className="flex flex-col gap-y-3">
                            {data.map((allocation) => (
                                <AllocationRow key={`${allocation.ip}:${allocation.port}`} allocation={allocation} />
                            ))}
                        </div>

                        {allocationLimit > 0 && (
                            <Can action={'allocation.create'}>
                                <SpinnerOverlay visible={loading} />
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="mb-4 sm:mb-0">
                                        <p className="text-sm text-neutral-400 font-medium">
                                            <span className="text-emerald-400">{data.length}</span> de <span className="text-emerald-400">{allocationLimit}</span> asignaciones permitidas.
                                        </p>
                                    </div>
                                    {allocationLimit > data.length && (
                                        <button
                                            onClick={onCreateAllocation}
                                            className="flex items-center justify-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-all w-full sm:w-auto"
                                            style={{
                                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                                color: 'white',
                                                border: '1px solid rgba(16,185,129,0.4)',
                                                boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faPlus} />
                                            Crear Asignación
                                        </button>
                                    )}
                                </div>
                            </Can>
                        )}
                    </>
                )}
            </div>
        </ServerContentBlock>
    );
};

export default NetworkContainer;
