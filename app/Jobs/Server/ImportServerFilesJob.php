<?php

namespace Pterodactyl\Jobs\Server;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Pterodactyl\Models\Server;
use phpseclib3\Net\SFTP;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

class ImportServerFilesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 0; // Tarea puede tardar horas

    protected Server $server;
    protected array $credentials;
    protected string $sourcePath;
    protected string $destPath;

    public function __construct(Server $server, array $credentials, string $sourcePath, string $destPath)
    {
        $this->server = $server;
        $this->credentials = $credentials;
        $this->sourcePath = $sourcePath;
        $this->destPath = $destPath;
    }

    public function handle()
    {
        try {
            \Log::info("ImportServerFilesJob: Iniciando transferencia NATIVA para el servidor {$this->server->uuid}");
            
            $nodeIp = $this->server->node->fqdn;
            $uuid = $this->server->uuid;
            
            $username = $this->credentials['username'];
            $password = $this->credentials['password'];
            $host = $this->credentials['host'];
            $port = $this->credentials['port'] ?? 22;
            
            // Build the target directory
            $targetDir = '/var/lib/pterodactyl/volumes/' . $uuid;
            if ($this->destPath !== '/' && $this->destPath !== '') {
                $targetDir .= '/' . trim($this->destPath, '/');
            }
            
            $sourcePath = $this->sourcePath;

            // Secure lftp command to run on the node
            $lftpCommand = sprintf(
                'lftp -u %s,%s sftp://%s:%s -e \'set sftp:connect-program "ssh -a -x -o StrictHostKeyChecking=no"; mirror -c -P 15 --use-pget-n=5 %s %s; quit\'',
                escapeshellarg($username),
                escapeshellarg($password),
                $host,
                $port,
                escapeshellarg($sourcePath),
                escapeshellarg($targetDir)
            );

            // Command that the panel will execute to SSH into the node
            $sshCommand = sprintf(
                'ssh -i /var/www/.ssh/id_rsa -o StrictHostKeyChecking=no root@%s %s && ssh -i /var/www/.ssh/id_rsa -o StrictHostKeyChecking=no root@%s "chown -R pterodactyl:pterodactyl /var/lib/pterodactyl/volumes/%s"',
                escapeshellarg($nodeIp),
                escapeshellarg($lftpCommand),
                escapeshellarg($nodeIp),
                escapeshellarg($uuid)
            );

            $process = \Symfony\Component\Process\Process::fromShellCommandline($sshCommand);
            $process->setTimeout(null); // Infinite timeout
            $process->run();

            if (!$process->isSuccessful()) {
                \Log::error("ImportServerFilesJob: Error en transferencia nativa - " . $process->getErrorOutput());
            } else {
                \Log::info("ImportServerFilesJob: Transferencia nativa completada para {$uuid}");
            }
        } catch (\Exception $e) {
            \Log::error("ImportServerFilesJob: Error crítico en la transferencia - " . $e->getMessage());
        } finally {
            $this->server->update(['status' => null]);
        }
    }
}
