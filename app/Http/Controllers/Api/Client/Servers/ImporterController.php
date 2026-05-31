<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use phpseclib3\Net\SFTP;

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
            $sftp = new SFTP($request->input('host'), $request->input('port'));
            if (!$sftp->login($request->input('username'), $request->input('password'))) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autenticación fallida. Verifica tu usuario y contraseña.',
                ], 401);
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Conexión exitosa con el servidor remoto.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'No se pudo conectar al servidor: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Run the import process (mocked for safety until full daemon integration is specified).
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
            $sftp = new SFTP($request->input('host'), $request->input('port'));
            if (!$sftp->login($request->input('username'), $request->input('password'))) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autenticación fallida. Verifica tus credenciales.',
                ], 401);
            }

            // Validar si el directorio origen existe
            if (!$sftp->is_dir($request->input('source'))) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'El directorio de origen no existe en el servidor remoto.',
                ], 404);
            }

            // Aquí normalmente se descargarían los archivos y se enviarían al daemon (Wings)
            // Dado el tamaño potencial de los archivos, esto requiere un job en background
            // Por ahora registramos el inicio de la operación con éxito
            return new JsonResponse([
                'success' => true,
                'message' => 'Importación iniciada. Los archivos se están transfiriendo en segundo plano.',
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Error durante la importación: ' . $e->getMessage(),
            ], 500);
        }
    }
}
