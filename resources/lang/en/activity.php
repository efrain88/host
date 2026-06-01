<?php

/**
 * Contains all of the translation strings for different activity log
 * events. These should be keyed by the value in front of the colon (:)
 * in the event name. If there is no colon present, they should live at
 * the top level.
 */
return [
    'auth' => [
        'fail' => 'Inicio de sesión fallido',
        'success' => 'Inicio de sesión exitoso',
        'password-reset' => 'Contraseña restablecida',
        'reset-password' => 'Restablecimiento de contraseña solicitado',
        'checkpoint' => 'Autenticación de dos factores solicitada',
        'recovery-token' => 'Token de recuperación de dos factores utilizado',
        'token' => 'Desafío de dos factores resuelto',
        'ip-blocked' => 'Petición bloqueada desde dirección IP no listada para :identifier',
        'sftp' => [
            'fail' => 'Inicio de sesión SFTP fallido',
        ],
    ],
    'user' => [
        'account' => [
            'email-changed' => 'Correo cambiado de :old a :new',
            'password-changed' => 'Contraseña cambiada',
        ],
        'api-key' => [
            'create' => 'Nueva clave API creada: :identifier',
            'delete' => 'Clave API eliminada: :identifier',
        ],
        'ssh-key' => [
            'create' => 'Clave SSH :fingerprint añadida a la cuenta',
            'delete' => 'Clave SSH :fingerprint eliminada de la cuenta',
        ],
        'two-factor' => [
            'create' => 'Autenticación de dos factores habilitada',
            'delete' => 'Autenticación de dos factores deshabilitada',
        ],
    ],
    'server' => [
        'reinstall' => 'Servidor reinstalado',
        'console' => [
            'command' => 'Comando ":command" ejecutado en el servidor',
        ],
        'power' => [
            'start' => 'Servidor iniciado',
            'stop' => 'Servidor detenido',
            'restart' => 'Servidor reiniciado',
            'kill' => 'Proceso del servidor forzado a detenerse',
        ],
        'backup' => [
            'download' => 'Copia de seguridad :name descargada',
            'delete' => 'Copia de seguridad :name eliminada',
            'restore' => 'Copia de seguridad :name restaurada (archivos eliminados: :truncate)',
            'restore-complete' => 'Restauración de la copia de seguridad :name completada',
            'restore-failed' => 'Error al completar la restauración de la copia :name',
            'start' => 'Nueva copia de seguridad :name iniciada',
            'complete' => 'Copia de seguridad :name marcada como completada',
            'fail' => 'Copia de seguridad :name marcada como fallida',
            'lock' => 'Copia de seguridad :name bloqueada',
            'unlock' => 'Copia de seguridad :name desbloqueada',
        ],
        'database' => [
            'create' => 'Nueva base de datos :name creada',
            'rotate-password' => 'Contraseña rotada para la base de datos :name',
            'delete' => 'Base de datos :name eliminada',
        ],
        'file' => [
            'compress_one' => 'Archivo :directory:file comprimido',
            'compress_other' => ':count archivos comprimidos en :directory',
            'read' => 'Vio el contenido de :file',
            'copy' => 'Creó una copia de :file',
            'create-directory' => 'Directorio :directory:name creado',
            'decompress' => ':files descomprimidos en :directory',
            'delete_one' => 'Archivo :directory:files.0 eliminado',
            'delete_other' => ':count archivos eliminados en :directory',
            'download' => 'Archivo :file descargado',
            'pull' => 'Archivo remoto descargado desde :url a :directory',
            'rename_one' => 'Renombrado :directory:files.0.from a :directory:files.0.to',
            'rename_other' => ':count archivos renombrados en :directory',
            'write' => 'Nuevo contenido escrito en :file',
            'upload' => 'Comenzó una subida de archivo',
            'uploaded' => 'Archivo :directory:file subido',
        ],
        'sftp' => [
            'denied' => 'Acceso SFTP bloqueado por permisos',
            'create_one' => 'Archivo :files.0 creado',
            'create_other' => ':count nuevos archivos creados',
            'write_one' => 'Modificó el contenido de :files.0',
            'write_other' => 'Modificó el contenido de :count archivos',
            'delete_one' => 'Archivo :files.0 eliminado',
            'delete_other' => ':count archivos eliminados',
            'create-directory_one' => 'Directorio :files.0 creado',
            'create-directory_other' => ':count directorios creados',
            'rename_one' => 'Renombrado :files.0.from a :files.0.to',
            'rename_other' => ':count archivos renombrados o movidos',
        ],
        'allocation' => [
            'create' => 'Puerto :allocation asignado al servidor',
            'notes' => 'Notas actualizadas para :allocation de ":old" a ":new"',
            'primary' => 'Asignó :allocation como puerto principal del servidor',
            'delete' => 'Asignación :allocation eliminada',
        ],
        'schedule' => [
            'create' => 'Tarea programada :name creada',
            'update' => 'Tarea programada :name actualizada',
            'execute' => 'Tarea programada :name ejecutada manualmente',
            'delete' => 'Tarea programada :name eliminada',
        ],
        'task' => [
            'create' => 'Nueva acción ":action" creada para la tarea :name',
            'update' => 'Acción ":action" actualizada para la tarea :name',
            'delete' => 'Acción eliminada para la tarea :name',
        ],
        'settings' => [
            'rename' => 'Renombró el servidor de :old a :new',
            'description' => 'Cambió la descripción del servidor de :old a :new',
        ],
        'startup' => [
            'edit' => 'Cambió la variable :variable de ":old" a ":new"',
            'image' => 'Actualizó la Imagen Docker del servidor de :old a :new',
        ],
        'subuser' => [
            'create' => 'Añadió a :email como subusuario',
            'update' => 'Actualizó los permisos del subusuario :email',
            'delete' => 'Eliminó a :email como subusuario',
        ],
    ],
];
