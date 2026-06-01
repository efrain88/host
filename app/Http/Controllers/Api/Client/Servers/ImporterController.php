<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use phpseclib3\Net\SFTP;
use Pterodactyl\Jobs\Server\ImportServerFilesJob;

class ImporterController extends ClientApiController
{
    /**
     * Test the SFTP connection to the remote server.
     */
    public function testConnection(ClientApiRequest $request, Server $server): JsonResponse
    {
        $request->validate([
            'host' => 'required|string',
            'port' => 'required|numeric',
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        try {
            // Limpiar el host en caso de que el usuario pegue sftp:// o :puerto
            $host = $request->input('host');
            $host = preg_replace('#^sftp://#i', '', $host);
            if (strpos($host, ':') !== false) {
                $parts = explode(':', $host);
                $host = $parts[0];
            }

            $sftp = new SFTP($host, $request->input('port'));
            if (!$sftp->login($request->input('username'), $request->input('password'))) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autenticación fallida. Verifica tu usuario y contraseña.',
                ], 400);
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Conexión exitosa con el servidor remoto.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'No se pudo conectar al servidor remoto. Verifica la IP y el Puerto.',
            ], 400);
        }
    }

    /**
     * Run the import process by dispatching a background job.
     */
    public function runImport(ClientApiRequest $request, Server $server): JsonResponse
    {
        $request->validate([
            'host' => 'required|string',
            'port' => 'required|numeric',
            'username' => 'required|string',
            'password' => 'required|string',
            'source' => 'required|string',
            'destination' => 'required|string',
        ]);

        try {
            // Limpiar el host
            $host = $request->input('host');
            $host = preg_replace('#^sftp://#i', '', $host);
            if (strpos($host, ':') !== false) {
                $parts = explode(':', $host);
                $host = $parts[0];
            }

            $sftp = new SFTP($host, $request->input('port'));
            if (!$sftp->login($request->input('username'), $request->input('password'))) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autenticación fallida. Verifica tus credenciales.',
                ], 400);
            }

            // Validar si el directorio origen existe
            if (!$sftp->is_dir($request->input('source'))) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'El directorio de origen no existe en el servidor remoto.',
                ], 404);
            }

            // Despachar el Job a la cola en segundo plano
            dispatch(new ImportServerFilesJob(
                $server,
                $request->only(['host', 'port', 'username', 'password']),
                $request->input('source'),
                $request->input('destination'),
                app()
            ));

            return new JsonResponse([
                'success' => true,
                'message' => 'Importación iniciada. Los archivos se están transfiriendo en segundo plano. Esto puede tomar varios minutos.',
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Error al iniciar la importación: ' . $e->getMessage(),
            ], 500);
        }
    }
}
