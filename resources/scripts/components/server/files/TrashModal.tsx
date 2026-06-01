import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faTimes, faTrashRestore, faSpinner, faFolder, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { ServerContext } from '@/state/server';
import { FileObject } from '@/api/server/files/loadDirectory';
import loadDirectory from '@/api/server/files/loadDirectory';
import deleteFiles from '@/api/server/files/deleteFiles';
import renameFiles from '@/api/server/files/renameFiles';
import useFlash from '@/plugins/useFlash';
import { bytesToString } from '@/lib/formatters';
import { join } from 'pathe';
import { format } from 'date-fns';

interface Props {
    onClose: () => void;
}

const TrashModal = ({ onClose }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [files, setFiles] = useState<FileObject[]>([]);
    const [loading, setLoading] = useState(true);
    const [emptying, setEmptying] = useState(false);
    const { clearAndAddHttpError } = useFlash();

    const fetchTrash = () => {
        setLoading(true);
        loadDirectory(uuid, '/.trash')
            .then(setFiles)
            .catch((e) => clearAndAddHttpError({ key: 'files', error: e }))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTrash();
    }, []);

    const totalSize = files.reduce((acc, f) => acc + (f.isFile ? f.size : 0), 0);

    const emptyTrash = () => {
        if (!files.length) return;
        setEmptying(true);
        deleteFiles(uuid, '/.trash', files.map(f => f.name))
            .then(() => fetchTrash())
            .catch((e) => clearAndAddHttpError({ key: 'files', error: e }))
            .finally(() => setEmptying(false));
    };

    const restoreFile = (file: FileObject) => {
        renameFiles(uuid, '/', [{ from: join('/.trash', file.name), to: `/${file.name}` }])
            .then(() => fetchTrash())
            .catch((e) => clearAndAddHttpError({ key: 'files', error: e }));
    };

    const deleteFile = (file: FileObject) => {
        deleteFiles(uuid, '/.trash', [file.name])
            .then(() => fetchTrash())
            .catch((e) => clearAndAddHttpError({ key: 'files', error: e }));
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-[#0d0d10] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8"
                    style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #0d0d10 100%)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <FontAwesomeIcon icon={faTrashAlt} className="text-red-400 text-sm" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-base">Papelera</h2>
                            <p className="text-neutral-500 text-xs">Archivos eliminados recientemente</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 min-h-[200px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-14 text-neutral-500">
                            <FontAwesomeIcon icon={faSpinner} className="text-3xl animate-spin mb-3" />
                            <p className="text-sm">Cargando...</p>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-neutral-600">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <FontAwesomeIcon icon={faTrashAlt} className="text-2xl" />
                            </div>
                            <p className="font-semibold text-neutral-400">La papelera está vacía</p>
                            <p className="text-xs text-neutral-600 mt-1">Los archivos eliminados aparecerán aquí</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1 -mr-1">
                            {files.map((file) => (
                                <div
                                    key={file.key}
                                    className="group flex items-center justify-between rounded-xl px-4 py-3 transition-all"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`text-lg flex-none ${file.isFile ? 'text-violet-400' : 'text-amber-400'}`}>
                                            <FontAwesomeIcon icon={file.isFile ? faFileAlt : faFolder} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-neutral-500 text-xs mt-0.5">
                                                {file.isFile ? bytesToString(file.size) : 'Carpeta'} · {format(file.modifiedAt, 'dd MMM yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-none ml-3">
                                        <button
                                            onClick={() => restoreFile(file)}
                                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                                            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}
                                            title="Restaurar archivo"
                                        >
                                            <FontAwesomeIcon icon={faTrashRestore} />
                                            <span className="hidden sm:inline">Restaurar</span>
                                        </button>
                                        <button
                                            onClick={() => deleteFile(file)}
                                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}
                                            title="Eliminar permanentemente"
                                        >
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/8"
                    style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-neutral-500 text-xs">
                        <span className="font-semibold text-neutral-400">{files.length}</span> elemento{files.length !== 1 ? 's' : ''}
                        {totalSize > 0 && (
                            <span className="ml-2 text-neutral-600">· {bytesToString(totalSize)}</span>
                        )}
                    </div>
                    <button
                        onClick={emptyTrash}
                        disabled={files.length === 0 || emptying}
                        className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
                    >
                        {emptying
                            ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                            : <FontAwesomeIcon icon={faTrashAlt} />
                        }
                        Vaciar papelera
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TrashModal;
