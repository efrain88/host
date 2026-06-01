<?php

namespace Pterodactyl\Models;

use Illuminate\Support\Collection;

class Permission extends Model
{
    /**
     * The resource name for this model when it is transformed into an
     * API representation using fractal.
     */
    public const RESOURCE_NAME = 'subuser_permission';

    /**
     * Constants defining different permissions available.
     */
    public const ACTION_WEBSOCKET_CONNECT = 'websocket.connect';
    public const ACTION_CONTROL_CONSOLE = 'control.console';
    public const ACTION_CONTROL_START = 'control.start';
    public const ACTION_CONTROL_STOP = 'control.stop';
    public const ACTION_CONTROL_RESTART = 'control.restart';

    public const ACTION_DATABASE_READ = 'database.read';
    public const ACTION_DATABASE_CREATE = 'database.create';
    public const ACTION_DATABASE_UPDATE = 'database.update';
    public const ACTION_DATABASE_DELETE = 'database.delete';
    public const ACTION_DATABASE_VIEW_PASSWORD = 'database.view_password';

    public const ACTION_SCHEDULE_READ = 'schedule.read';
    public const ACTION_SCHEDULE_CREATE = 'schedule.create';
    public const ACTION_SCHEDULE_UPDATE = 'schedule.update';
    public const ACTION_SCHEDULE_DELETE = 'schedule.delete';

    public const ACTION_USER_READ = 'user.read';
    public const ACTION_USER_CREATE = 'user.create';
    public const ACTION_USER_UPDATE = 'user.update';
    public const ACTION_USER_DELETE = 'user.delete';

    public const ACTION_BACKUP_READ = 'backup.read';
    public const ACTION_BACKUP_CREATE = 'backup.create';
    public const ACTION_BACKUP_DELETE = 'backup.delete';
    public const ACTION_BACKUP_DOWNLOAD = 'backup.download';
    public const ACTION_BACKUP_RESTORE = 'backup.restore';

    public const ACTION_ALLOCATION_READ = 'allocation.read';
    public const ACTION_ALLOCATION_CREATE = 'allocation.create';
    public const ACTION_ALLOCATION_UPDATE = 'allocation.update';
    public const ACTION_ALLOCATION_DELETE = 'allocation.delete';

    public const ACTION_FILE_READ = 'file.read';
    public const ACTION_FILE_READ_CONTENT = 'file.read-content';
    public const ACTION_FILE_CREATE = 'file.create';
    public const ACTION_FILE_UPDATE = 'file.update';
    public const ACTION_FILE_DELETE = 'file.delete';
    public const ACTION_FILE_ARCHIVE = 'file.archive';
    public const ACTION_FILE_SFTP = 'file.sftp';

    public const ACTION_STARTUP_READ = 'startup.read';
    public const ACTION_STARTUP_UPDATE = 'startup.update';
    public const ACTION_STARTUP_DOCKER_IMAGE = 'startup.docker-image';

    public const ACTION_SETTINGS_RENAME = 'settings.rename';
    public const ACTION_SETTINGS_REINSTALL = 'settings.reinstall';

    public const ACTION_ACTIVITY_READ = 'activity.read';

    /**
     * Should timestamps be used on this model.
     */
    public $timestamps = false;

    /**
     * The table associated with the model.
     */
    protected $table = 'permissions';

    /**
     * Fields that are not mass assignable.
     */
    protected $guarded = ['id', 'created_at', 'updated_at'];

    /**
     * Cast values to correct type.
     */
    protected $casts = [
        'subuser_id' => 'integer',
    ];

    public static array $validationRules = [
        'subuser_id' => 'required|numeric|min:1',
        'permission' => 'required|string',
    ];

    /**
     * All the permissions available on the system. You should use self::permissions()
     * to retrieve them, and not directly access this array as it is subject to change.
     *
     * @see \Pterodactyl\Models\Permission::permissions()
     */
    protected static array $permissions = [
        'websocket' => [
            'description' => 'Permite al usuario conectarse al websocket del servidor, dándole acceso a la consola y a las estadísticas en tiempo real.',
            'keys' => [
                'connect' => 'Permite a un usuario conectarse al websocket para ver la consola.',
            ],
        ],

        'control' => [
            'description' => 'Permisos que controlan la capacidad del usuario para cambiar el estado de energía del servidor o enviar comandos.',
            'keys' => [
                'console' => 'Permite a un usuario enviar comandos al servidor a través de la consola.',
                'start' => 'Permite iniciar el servidor si está detenido.',
                'stop' => 'Permite detener el servidor si está en ejecución.',
                'restart' => 'Permite reiniciar el servidor. Esto permite encenderlo si está apagado, pero no detenerlo por completo.',
            ],
        ],

        'user' => [
            'description' => 'Permisos para administrar a otros subusuarios en el servidor. Nunca podrán editar su propia cuenta o asignar permisos que ellos mismos no posean.',
            'keys' => [
                'create' => 'Permite crear nuevos subusuarios.',
                'read' => 'Permite ver los subusuarios y sus permisos.',
                'update' => 'Permite modificar otros subusuarios.',
                'delete' => 'Permite eliminar subusuarios del servidor.',
            ],
        ],

        'file' => [
            'description' => 'Permisos que controlan la capacidad del usuario para modificar los archivos de este servidor.',
            'keys' => [
                'create' => 'Permite crear archivos y carpetas adicionales vía el Panel o carga directa.',
                'read' => 'Permite ver el contenido de un directorio, pero no el contenido ni descargar los archivos.',
                'read-content' => 'Permite ver el contenido de un archivo. También permite descargar archivos.',
                'update' => 'Permite actualizar el contenido de un archivo o directorio existente.',
                'delete' => 'Permite eliminar archivos o directorios.',
                'archive' => 'Permite comprimir el contenido de un directorio y descomprimir archivos en el sistema.',
                'sftp' => 'Permite conectarse por SFTP y gestionar los archivos usando otros permisos asignados.',
            ],
        ],

        'backup' => [
            'description' => 'Permisos que controlan la creación y gestión de respaldos del servidor.',
            'keys' => [
                'create' => 'Permite crear nuevos respaldos para este servidor.',
                'read' => 'Permite ver todos los respaldos existentes.',
                'delete' => 'Permite eliminar respaldos del sistema.',
                'download' => 'Permite descargar respaldos. Peligro: esto otorga acceso a todos los archivos del servidor dentro del respaldo.',
                'restore' => 'Permite restaurar un respaldo. Peligro: esto permite que el usuario elimine todos los archivos actuales del servidor durante el proceso.',
            ],
        ],

        // Controls permissions for editing or viewing a server's allocations.
        'allocation' => [
            'description' => 'Permisos que controlan la capacidad para modificar las asignaciones de puertos.',
            'keys' => [
                'read' => 'Permite ver todas las asignaciones actuales. Los usuarios siempre pueden ver la principal.',
                'create' => 'Permite asignar puertos adicionales al servidor.',
                'update' => 'Permite cambiar el puerto principal y añadir notas a cada asignación.',
                'delete' => 'Permite eliminar un puerto del servidor.',
            ],
        ],

        // Controls permissions for editing or viewing a server's startup parameters.
        'startup' => [
            'description' => 'Permisos para ver y modificar los parámetros de inicio del servidor.',
            'keys' => [
                'read' => 'Permite ver las variables de inicio del servidor.',
                'update' => 'Permite modificar las variables de inicio del servidor.',
                'docker-image' => 'Permite modificar la imagen Docker usada por el servidor.',
            ],
        ],

        'database' => [
            'description' => 'Permisos para la gestión de bases de datos.',
            'keys' => [
                'create' => 'Permite crear una nueva base de datos para este servidor.',
                'read' => 'Permite ver las bases de datos asociadas a este servidor.',
                'update' => 'Permite rotar la contraseña de una base de datos. Sin el permiso de ver contraseña, no podrán verla después de rotarla.',
                'delete' => 'Permite eliminar una base de datos.',
                'view_password' => 'Permite ver la contraseña asociada a una base de datos.',
            ],
        ],

        'schedule' => [
            'description' => 'Permisos para la gestión de tareas programadas del servidor.',
            'keys' => [
                'create' => 'Permite crear nuevas tareas programadas.', // task.create-schedule
                'read' => 'Permite ver tareas programadas y los trabajos asociados a ellas.', // task.view-schedule, task.list-schedules
                'update' => 'Permite actualizar tareas programadas y sus trabajos.', // task.edit-schedule, task.queue-schedule, task.toggle-schedule
                'delete' => 'Permite eliminar tareas programadas del servidor.', // task.delete-schedule
            ],
        ],

        'settings' => [
            'description' => 'Permisos para acceder a los ajustes del servidor.',
            'keys' => [
                'rename' => 'Permite renombrar el servidor y cambiar su descripción.',
                'reinstall' => 'Permite forzar una reinstalación del servidor.',
            ],
        ],

        'activity' => [
            'description' => 'Permisos para acceder a los registros de actividad del servidor.',
            'keys' => [
                'read' => 'Permite ver los registros de actividad del servidor.',
            ],
        ],
    ];

    /**
     * Returns all the permissions available on the system for a user to
     * have when controlling a server.
     */
    public static function permissions(): Collection
    {
        return Collection::make(self::$permissions);
    }
}
