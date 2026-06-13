<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\Allocation;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Services\Servers\ServerCreationService;
use Pterodactyl\Services\Servers\ServerDeletionService;
use Illuminate\Support\Facades\DB;

class SplitterController extends ClientApiController
{
    private ServerCreationService $creationService;
    private ServerDeletionService $deletionService;

    public function __construct(
        ServerCreationService $creationService,
        ServerDeletionService $deletionService
    ) {
        parent::__construct();
        $this->creationService = $creationService;
        $this->deletionService = $deletionService;
    }

    /**
     * Lists all subservers created by this server.
     */
    public function index(ClientApiRequest $request, Server $server): JsonResponse
    {
        $children = $server->children()->with('allocation')->get();

        return new JsonResponse([
            'success' => true,
            'allowed_splits' => $server->allowed_splits,
            'current_splits' => $children->count(),
            'children' => $children->map(function ($child) {
                return [
                    'uuid' => $child->uuid,
                    'name' => $child->name,
                    'memory' => $child->memory,
                    'cpu' => $child->cpu,
                    'disk' => $child->disk,
                    'status' => $child->status,
                    'allocation' => $child->allocation ? $child->allocation->ip . ':' . $child->allocation->port : 'N/A',
                ];
            }),
            'parent_resources' => [
                'memory' => $server->memory,
                'cpu' => $server->cpu,
                'disk' => $server->disk,
            ]
        ]);
    }

    /**
     * Creates a new subserver.
     */
    public function store(ClientApiRequest $request, Server $server): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:191',
            'memory' => 'required|integer|min:256',
            'cpu' => 'required|integer|min:10',
            'disk' => 'required|integer|min:256',
        ]);

        if ($server->allowed_splits <= 0 || $server->children()->count() >= $server->allowed_splits) {
            return new JsonResponse(['success' => false, 'message' => 'Has alcanzado el límite de mini-servidores permitidos.'], 400);
        }

        $memory = $request->input('memory');
        $cpu = $request->input('cpu');
        $disk = $request->input('disk');

        // Verify parent has enough resources (leaving at least 512MB RAM and 1GB Disk for parent)
        if ($server->memory - $memory < 512 || $server->cpu - $cpu < 10 || $server->disk - $disk < 1024) {
            return new JsonResponse(['success' => false, 'message' => 'No tienes suficientes recursos en el servidor principal para crear este mini-servidor. Deja un mínimo seguro para el principal.'], 400);
        }

        // Find an available allocation on the same node
        $allocation = Allocation::where('node_id', $server->node_id)
            ->whereNull('server_id')
            ->first();

        if (!$allocation) {
            return new JsonResponse(['success' => false, 'message' => 'No hay puertos disponibles en este nodo para crear el mini-servidor.'], 400);
        }

        try {
            DB::transaction(function () use ($server, $memory, $cpu, $disk, $allocation, $request) {
                // Deduct resources from parent
                $server->memory -= $memory;
                $server->cpu -= $cpu;
                $server->disk -= $disk;
                $server->save();

                // Build subserver data
                $data = [
                    'name' => $request->input('name'),
                    'owner_id' => $server->owner_id,
                    'node_id' => $server->node_id,
                    'allocation_id' => $allocation->id,
                    'allocation_limit' => 1,
                    'backup_limit' => 0,
                    'database_limit' => 0,
                    'memory' => $memory,
                    'cpu' => $cpu,
                    'disk' => $disk,
                    'swap' => 0,
                    'io' => 500,
                    'nest_id' => $server->nest_id,
                    'egg_id' => $server->egg_id,
                    'startup' => $server->startup,
                    'image' => $server->image,
                    'oom_disabled' => true,
                    'parent_id' => $server->id,
                ];

                // Environment variables
                $environment = [];
                foreach ($server->variables as $variable) {
                    $environment[$variable->env_variable] = $variable->server_value ?? $variable->default_value;
                }
                $data['environment'] = $environment;

                $this->creationService->handle($data);
            });

            return new JsonResponse(['success' => true, 'message' => 'Mini-servidor creado correctamente. Se está instalando.']);
        } catch (\Exception $e) {
            return new JsonResponse(['success' => false, 'message' => 'Error interno al crear el mini-servidor: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Deletes a subserver.
     */
    public function destroy(ClientApiRequest $request, Server $server, string $childUuid): JsonResponse
    {
        $child = $server->children()->where('uuid', $childUuid)->first();

        if (!$child) {
            return new JsonResponse(['success' => false, 'message' => 'Mini-servidor no encontrado.'], 404);
        }

        try {
            DB::transaction(function () use ($server, $child) {
                // Return resources to parent
                $server->memory += $child->memory;
                $server->cpu += $child->cpu;
                $server->disk += $child->disk;
                $server->save();

                $this->deletionService->withForce(true)->handle($child);
            });

            return new JsonResponse(['success' => true, 'message' => 'Mini-servidor eliminado y recursos devueltos.']);
        } catch (\Exception $e) {
            return new JsonResponse(['success' => false, 'message' => 'Error al eliminar el mini-servidor: ' . $e->getMessage()], 500);
        }
    }
}
