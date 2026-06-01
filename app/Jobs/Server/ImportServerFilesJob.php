<?php

namespace Pterodactyl\Jobs\Server;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Pterodactyl\Models\Server;
use phpseclib3\Net\SFTP;
use Pterodactyl\Repositories\Wings\DaemonRepository;
use Illuminate\Contracts\Foundation\Application;

class ImportServerFilesJob extends DaemonRepository implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 0; // Tarea puede tardar horas

    protected array $credentials;
    protected string $sourcePath;
    protected string $destPath;

    public function __construct(Server $server, array $credentials, string $sourcePath, string $destPath, Application $app)
    {
        parent::__construct($app);
        $this->setServer($server);
        
        $this->credentials = $credentials;
        $this->sourcePath = $sourcePath;
        $this->destPath = $destPath;
    }

    public function handle()
    {
        $sftp = new SFTP($this->credentials['host'], $this->credentials['port']);
        if (!$sftp->login($this->credentials['username'], $this->credentials['password'])) {
            \Log::error("ImportServerFilesJob: Error de autenticación SFTP para el servidor {$this->server->uuid}");
            return;
        }

        \Log::info("ImportServerFilesJob: Iniciando transferencia para el servidor {$this->server->uuid} desde {$this->sourcePath}");
        $this->transferDirectory($sftp, rtrim($this->sourcePath, '/'), rtrim($this->destPath, '/'));
        \Log::info("ImportServerFilesJob: Transferencia completada para el servidor {$this->server->uuid}");
    }

    protected function transferDirectory(SFTP $sftp, string $remoteDir, string $localDir)
    {
        $files = $sftp->nlist($remoteDir);
        if ($files === false) return;

        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $remoteFilePath = $remoteDir . '/' . $file;
            $localFilePath = $localDir === '' || $localDir === '/' ? '/' . $file : $localDir . '/' . $file;

            $type = $sftp->stat($remoteFilePath);
            if (!$type) continue;

            if ($type['type'] === 2) { // Directorio
                // Enviar comando para crear directorio en Wings
                $this->createDirectoryInWings($localFilePath);
                $this->transferDirectory($sftp, $remoteFilePath, $localFilePath);
            } else { // Archivo regular
                $this->transferFile($sftp, $remoteFilePath, $localFilePath);
            }
        }
    }

    protected function transferFile(SFTP $sftp, string $remoteFile, string $targetFile)
    {
        // Crear un archivo temporal
        $tempFile = tempnam(sys_get_temp_dir(), 'sftp_import_');
        if (!$tempFile) return;

        try {
            // Descargar de SFTP a local (Panel)
            $sftp->get($remoteFile, $tempFile);

            // Subir a Wings mediante Stream
            $stream = fopen($tempFile, 'r');
            if ($stream) {
                $this->getHttpClient([
                    'Content-Type' => 'application/octet-stream',
                ])->post(sprintf('/api/servers/%s/files/write', $this->server->uuid), [
                    'query' => ['file' => $targetFile],
                    'body' => $stream,
                ]);
                fclose($stream);
            }
        } catch (\Exception $e) {
            \Log::error("ImportServerFilesJob: Error transfiriendo {$remoteFile} a {$targetFile} - " . $e->getMessage());
        } finally {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }

    protected function createDirectoryInWings(string $path)
    {
        // Dividir el path en directorio base y nombre de carpeta
        $parts = explode('/', trim($path, '/'));
        $name = array_pop($parts);
        $base = '/' . implode('/', $parts);

        try {
            $this->getHttpClient()->post(sprintf('/api/servers/%s/files/create-directory', $this->server->uuid), [
                'json' => [
                    'name' => $name,
                    'path' => $base,
                ],
            ]);
        } catch (\Exception $e) {
            // Es posible que el directorio ya exista
        }
    }
}
