import React, { useEffect, useState } from 'react';
import { useActivityLogs } from '@/api/server/activity';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useFlashKey } from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { ActivityLogFilters } from '@/api/account/activity';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { styles as btnStyles } from '@/components/elements/button/index';
import { XCircleIcon, SearchIcon } from '@heroicons/react/solid';
import useLocationHash from '@/plugins/useLocationHash';
import Input from '@/components/elements/Input';

export default () => {
    const { hash } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('server:activity');
    const [filters, setFilters] = useState<ActivityLogFilters>({ page: 1, sorts: { timestamp: -1 } });

    const { data, isValidating, error } = useActivityLogs(filters, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });
    
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = data?.items.filter(activity => {
        if (!searchQuery) return true;
        const term = searchQuery.toLowerCase();
        const actorName = activity.relationships?.actor?.username?.toLowerCase() || 'sistema';
        const actorEmail = activity.relationships?.actor?.email?.toLowerCase() || '';
        return actorName.includes(term) || actorEmail.includes(term) || activity.event.toLowerCase().includes(term);
    });

    useEffect(() => {
        setFilters((value) => ({ ...value, filters: { ip: hash.ip, event: hash.event } }));
    }, [hash]);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    return (
        <ServerContentBlock title={'Actividad'}>
            <FlashMessageRender byKey={'server:activity'} />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Registro de Actividad</h1>
                    <p className="text-sm text-neutral-400">Revisa todas las acciones y eventos recientes que han ocurrido en tu servidor.</p>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                        <Input
                            placeholder="Buscar usuario o evento..."
                            className="pl-10 bg-[#0a0a0c] border-white/5 focus:border-primary-500/50 rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {(filters.filters?.event || filters.filters?.ip) && (
                        <Link
                            to={'#'}
                            className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center shrink-0 border border-red-500/20"
                            onClick={() => setFilters((value) => ({ ...value, filters: {} }))}
                        >
                            Limpiar Filtros <XCircleIcon className={'w-4 h-4 ml-2'} />
                        </Link>
                    )}
                </div>
            </div>

            {!data && isValidating ? (
                <Spinner centered />
            ) : !filteredItems?.length ? (
                <div className="flex flex-col items-center justify-center p-12 bg-[#050505] rounded-2xl border border-white/5">
                    <SearchIcon className="w-12 h-12 text-neutral-600 mb-4" />
                    <p className={'text-sm text-center text-neutral-400'}>
                        {searchQuery ? 'No se encontraron resultados para tu búsqueda.' : 'No hay registros de actividad disponibles para este servidor.'}
                    </p>
                </div>
            ) : (
                <div className={'relative bg-[#050505] p-6 rounded-2xl border border-white/5 shadow-xl'}>
                    {/* Línea vertical del timeline */}
                    <div className="hidden sm:block absolute top-10 bottom-10 left-[118px] w-px bg-white/5"></div>
                    
                    <div className="flex flex-col gap-y-4">
                        {filteredItems.map((activity) => (
                            <ActivityLogEntry key={activity.id} activity={activity}>
                                <span />
                            </ActivityLogEntry>
                        ))}
                    </div>
                </div>
            )}
            {data && (
                <PaginationFooter
                    pagination={data.pagination}
                    onPageSelect={(page) => setFilters((value) => ({ ...value, page }))}
                />
            )}
        </ServerContentBlock>
    );
};
