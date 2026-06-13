import React, { lazy } from 'react';
import ServerConsole from '@/components/server/console/ServerConsoleContainer';
import DatabasesContainer from '@/components/server/databases/DatabasesContainer';
import ScheduleContainer from '@/components/server/schedules/ScheduleContainer';
import UsersContainer from '@/components/server/users/UsersContainer';
import BackupContainer from '@/components/server/backups/BackupContainer';
import NetworkContainer from '@/components/server/network/NetworkContainer';
import StartupContainer from '@/components/server/startup/StartupContainer';
import FileManagerContainer from '@/components/server/files/FileManagerContainer';
import SettingsContainer from '@/components/server/settings/SettingsContainer';
import AccountOverviewContainer from '@/components/dashboard/AccountOverviewContainer';
import AccountApiContainer from '@/components/dashboard/AccountApiContainer';
import AccountSSHContainer from '@/components/dashboard/ssh/AccountSSHContainer';
import ActivityLogContainer from '@/components/dashboard/activity/ActivityLogContainer';
import ServerActivityLogContainer from '@/components/server/ServerActivityLogContainer';
import ServerInformation from '@/components/server/console/ServerInformationContainer';

// Each of the router files is already code split out appropriately — so
// all of the items above will only be loaded in when that router is loaded.
//
// These specific lazy loaded routes are to avoid loading in heavy screens
// for the server dashboard when they're only needed for specific instances.
const FileEditContainer = lazy(() => import('@/components/server/files/FileEditContainer'));
const ScheduleEditContainer = lazy(() => import('@/components/server/schedules/ScheduleEditContainer'));
const ImporterContainer = lazy(() => import('@/components/server/importer/ImporterContainer'));

interface RouteDefinition {
    path: string;
    // If undefined is passed this route is still rendered into the router itself
    // but no navigation link is displayed in the sub-navigation menu.
    name: string | undefined;
    component: React.ComponentType;
    exact?: boolean;
}

interface ServerRouteDefinition extends RouteDefinition {
    permission: string | string[] | null;
}

interface Routes {
    // All of the routes available under "/account"
    account: RouteDefinition[];
    // All of the routes available under "/server/:id"
    server: ServerRouteDefinition[];
}

export default {
    account: [
        {
            path: '/',
            name: 'Perfil',
            component: AccountOverviewContainer,
            exact: true,
        },
        {
            path: '/security',
            name: 'Seguridad',
            component: lazy(() => import('@/components/dashboard/SecurityContainer')),
        },
        {
            path: '/api',
            name: 'Credenciales de la API',
            component: AccountApiContainer,
        },
        {
            path: '/ssh',
            name: 'Claves SSH',
            component: AccountSSHContainer,
        },
        {
            path: '/activity',
            name: 'Actividad',
            component: ActivityLogContainer,
        },
    ],
    server: [
        {
            path: '/',
            permission: null,
            name: 'Información',
            component: ServerInformation,
            exact: true,
        },
        {
            path: '/console',
            permission: null,
            name: 'Consola',
            component: ServerConsole,
            exact: true,
        },
        {
            path: '/files',
            permission: 'file.*',
            name: 'Archivos',
            component: FileManagerContainer,
        },
        {
            path: '/files/:action(edit|new)',
            permission: 'file.*',
            name: undefined,
            component: FileEditContainer,
        },
        {
            path: '/databases',
            permission: 'database.*',
            name: 'Base de datos',
            component: DatabasesContainer,
        },
        {
            path: '/schedules',
            permission: 'schedule.*',
            name: 'Automático',
            component: ScheduleContainer,
        },
        {
            path: '/schedules/:id',
            permission: 'schedule.*',
            name: undefined,
            component: ScheduleEditContainer,
        },
        {
            path: '/users',
            permission: 'user.*',
            name: 'Usuarios',
            component: UsersContainer,
        },
        {
            path: '/backups',
            permission: 'backup.*',
            name: 'Backups',
            component: BackupContainer,
        },
        {
            path: '/network',
            permission: 'allocation.*',
            name: 'Red',
            component: NetworkContainer,
        },
        {
            path: '/startup',
            permission: 'startup.*',
            name: 'Inicio',
            component: StartupContainer,
        },
        {
            path: '/settings',
            permission: ['settings.*', 'file.sftp'],
            name: 'Configuración',
            component: SettingsContainer,
        },
        {
            path: '/importer',
            permission: ['settings.*'],
            name: 'Importador',
            component: ImporterContainer,
        },
        {
            path: '/split',
            permission: ['settings.*'],
            name: 'Divisores',
            component: lazy(() => import('@/components/server/splitter/SplitterContainer')),
        },
        {
            path: '/activity',
            permission: 'activity.*',
            name: 'Actividad',
            component: ServerActivityLogContainer,
        },
    ],
} as Routes;
