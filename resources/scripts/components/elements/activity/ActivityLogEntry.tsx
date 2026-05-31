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

const EventDictionary: Record<string, string> = {
    'auth:success': 'Sesión iniciada con éxito',
    'auth:fail': 'Inicio de sesión fallido',
    'auth:recovery-token': 'Sesión iniciada con token de recuperación',
    'user:account:language-changed': 'Idioma de la cuenta cambiado',
    'user:account:password-changed': 'Contraseña de la cuenta cambiada',
    'user:account:email-changed': 'Correo de la cuenta cambiado',
    'user:account:api-key-created': 'Clave de API creada',
    'user:account:api-key-deleted': 'Clave de API eliminada',
    'user:account:ssh-key-created': 'Clave SSH añadida',
    'user:account:ssh-key-deleted': 'Clave SSH eliminada',
    'user:account:two-factor-enabled': 'Autenticación en dos pasos activada',
    'user:account:two-factor-disabled': 'Autenticación en dos pasos desactivada',
    'server:subuser:create': 'Subusuario añadido al servidor',
    'server:subuser:update': 'Permisos de subusuario actualizados',
    'server:subuser:delete': 'Subusuario eliminado del servidor',
    'server:database:create': 'Base de datos creada',
    'server:database:delete': 'Base de datos eliminada',
    'server:schedule:create': 'Tarea programada creada',
    'server:schedule:update': 'Tarea programada actualizada',
    'server:schedule:delete': 'Tarea programada eliminada',
    'server:file:read': 'Archivo leído',
    'server:file:write': 'Archivo modificado',
    'server:file:delete': 'Archivo eliminado',
    'server:console:command': 'Comando de consola ejecutado',
    'server:power:start': 'Servidor iniciado',
    'server:power:stop': 'Servidor detenido',
    'server:power:restart': 'Servidor reiniciado',
    'server:power:kill': 'Servidor forzado a detenerse',
};

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
                        <span className="text-sm font-bold text-white">{actor?.username || 'Sistema'}</span>
                        <span className="px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-400 text-[11px] font-mono font-semibold border border-primary-500/20 shadow-sm shadow-primary-500/10">
                            {activity.event}
                        </span>
                    </div>
                    {/* Botones/Iconos adicionales */}
                    <div className={'text-neutral-500 group-hover:text-neutral-300 transition-colors flex items-center gap-x-2'}>
                        {activity.isApi && (
                            <Tooltip placement={'top'} content={'Usando API'}>
                                <TerminalIcon className="w-4 h-4" />
                            </Tooltip>
                        )}
                        {activity.event.startsWith('server:sftp.') && (
                            <Tooltip placement={'top'} content={'Usando SFTP'}>
                                <FolderOpenIcon className="w-4 h-4" />
                            </Tooltip>
                        )}
                        {children}
                        {activity.hasAdditionalMetadata && <ActivityLogMetaButton meta={activity.properties} />}
                    </div>
                </div>

                <div className="text-sm text-neutral-200 mb-3 font-medium">
                    {EventDictionary[activity.event] || (
                        <Translate ns={'activity'} values={properties} i18nKey={activity.event.replace(':', '.')} />
                    )}
                </div>

                <div className="flex items-center text-xs text-neutral-500 font-semibold tracking-wide">
                    <span>{format(activity.timestamp, 'h:mm a')}</span>
                    {activity.ip && (
                        <>
                            <span className="mx-2 text-neutral-600">•</span>
                            <span className="blur-sm hover:blur-none transition-all duration-300 cursor-help" title="Haz hover para revelar IP">
                                {activity.ip}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
