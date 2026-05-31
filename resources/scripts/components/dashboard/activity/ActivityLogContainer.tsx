import React, { useEffect, useState } from 'react';
import { ActivityLogFilters, useActivityLogs } from '@/api/account/activity';
import { useFlashKey } from '@/plugins/useFlash';
import PageContentBlock from '@/components/elements/PageContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Link } from 'react-router-dom';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { DesktopComputerIcon, XCircleIcon } from '@heroicons/react/solid';
import Spinner from '@/components/elements/Spinner';
import { styles as btnStyles } from '@/components/elements/button/index';
import classNames from 'classnames';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import useLocationHash from '@/plugins/useLocationHash';

export default () => {
    const { hash } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('account');
    const [filters, setFilters] = useState<ActivityLogFilters>({ page: 1, sorts: { timestamp: -1 } });
    const { data, isValidating, error } = useActivityLogs(filters, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        setFilters((value) => ({ ...value, filters: { ip: hash.ip, event: hash.event } }));
    }, [hash]);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    return (
        <PageContentBlock title={'Registro de actividad'}>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Registro de actividad</h1>
                <p className="text-sm text-neutral-400">Consulta la actividad reciente y el historial de inicios de sesión de tu cuenta.</p>
            </div>
            <FlashMessageRender byKey={'account'} />
            
            {(filters.filters?.event || filters.filters?.ip) && (
                <div className={'flex justify-end mb-4'}>
                    <Link
                        to={'#'}
                        className={classNames(btnStyles.button, btnStyles.text, 'w-full sm:w-auto bg-[#0a0a0c] border border-white/5 hover:bg-white/5')}
                        onClick={() => setFilters((value) => ({ ...value, filters: {} }))}
                    >
                        Limpiar Filtros <XCircleIcon className={'w-4 h-4 ml-2'} />
                    </Link>
                </div>
            )}
            
            {!data && isValidating ? (
                <Spinner centered />
            ) : (
                <div className="relative mt-8">
                    {/* Línea vertical central para el timeline */}
                    <div className="absolute left-[130px] top-4 bottom-0 w-px bg-white/10 hidden sm:block z-0"></div>
                    
                    <div className="flex flex-col gap-y-6 relative z-10">
                        {data?.items.map((activity) => (
                            <ActivityLogEntry key={activity.id} activity={activity}>
                                {typeof activity.properties.useragent === 'string' && (
                                    <Tooltip content={activity.properties.useragent} placement={'top'}>
                                        <span className="text-neutral-500 hover:text-white transition-colors cursor-help ml-2">
                                            <DesktopComputerIcon className="w-5 h-5" />
                                        </span>
                                    </Tooltip>
                                )}
                            </ActivityLogEntry>
                        ))}
                    </div>
                </div>
            )}
            
            {data && (
                <div className="mt-6">
                    <PaginationFooter
                        pagination={data.pagination}
                        onPageSelect={(page) => setFilters((value) => ({ ...value, page }))}
                    />
                </div>
            )}
        </PageContentBlock>
    );
};
