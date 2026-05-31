import React from 'react';
import { Link } from 'react-router-dom';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Translate from '@/components/elements/Translate';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ActivityLog } from '@definitions/user';
import ActivityLogMetaButton from '@/components/elements/activity/ActivityLogMetaButton';
import { FolderOpenIcon, TerminalIcon } from '@heroicons/react/solid';
import classNames from 'classnames';
import style from './style.module.css';
import Avatar from '@/components/Avatar';
import useLocationHash from '@/plugins/useLocationHash';
import { getObjectKeys, isObject } from '@/lib/objects';

interface Props {
    activity: ActivityLog;
    children?: React.ReactNode;
}

function wrapProperties(value: unknown): any {
    if (value === null || typeof value === 'string' || typeof value === 'number') {
        return `<strong>${String(value)}</strong>`;
    }

    if (isObject(value)) {
        return getObjectKeys(value).reduce((obj, key) => {
            if (key === 'count' || (typeof key === 'string' && key.endsWith('_count'))) {
                return { ...obj, [key]: value[key] };
            }
            return { ...obj, [key]: wrapProperties(value[key]) };
        }, {} as Record<string, unknown>);
    }

    if (Array.isArray(value)) {
        return value.map(wrapProperties);
    }

    return value;
}

export default ({ activity, children }: Props) => {
    const { pathTo } = useLocationHash();
    const actor = activity.relationships.actor;
    const properties = wrapProperties(activity.properties);

    return (
        <div className={'flex flex-col sm:flex-row gap-x-8 relative group'}>
            {/* Fecha a la izquierda */}
            <div className={'hidden sm:block w-[100px] text-right pt-4 shrink-0 relative'}>
                <span className="text-xs font-semibold text-neutral-400">
                    {format(activity.timestamp, 'MMM d, yyyy')}
                </span>
                {/* Punto Morado del Timeline */}
                <div className="absolute top-[1.3rem] -right-[34px] w-3 h-3 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(var(--color-primary-500),0.8)] z-10 border-2 border-black"></div>
            </div>

            {/* Tarjeta de contenido */}
            <div className="flex-1 bg-[#0a0a0c] border border-white/5 rounded-xl shadow-lg p-5 hover:bg-white/5 transition-colors relative z-20">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-x-3">
                        <span className="text-sm font-bold text-white">Cuenta</span>
                        <span className="px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-400 text-[11px] font-mono font-semibold border border-primary-500/20 shadow-sm shadow-primary-500/10">
                            {activity.event}
                        </span>
                    </div>
                    {/* Botones/Iconos adicionales */}
                    <div className={'text-neutral-500 group-hover:text-neutral-300 transition-colors flex items-center gap-x-2'}>
                        {activity.isApi && (
                            <Tooltip placement={'top'} content={'Using API Key'}>
                                <TerminalIcon className="w-4 h-4" />
                            </Tooltip>
                        )}
                        {activity.event.startsWith('server:sftp.') && (
                            <Tooltip placement={'top'} content={'Using SFTP'}>
                                <FolderOpenIcon className="w-4 h-4" />
                            </Tooltip>
                        )}
                        {children}
                        {activity.hasAdditionalMetadata && <ActivityLogMetaButton meta={activity.properties} />}
                    </div>
                </div>

                <div className="text-sm text-neutral-200 mb-3 font-medium">
                    <Translate ns={'activity'} values={properties} i18nKey={activity.event.replace(':', '.')} />
                </div>

                <div className="flex items-center text-xs text-neutral-500 font-semibold tracking-wide">
                    <span>{format(activity.timestamp, 'h:mm a')}</span>
                    {activity.ip && (
                        <>
                            <span className="mx-2 text-neutral-600">•</span>
                            <span>{activity.ip}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
