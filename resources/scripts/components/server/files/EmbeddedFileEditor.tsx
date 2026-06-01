import React, { useEffect, useState } from 'react';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { httpErrorToHuman } from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Can from '@/components/elements/Can';
import modes from '@/modes';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import { FileObject } from '@/api/server/files/loadDirectory';
import { join } from 'pathe';
import CodemirrorEditor from '@/components/elements/CodemirrorEditor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faSave, faFileCode } from '@fortawesome/free-solid-svg-icons';

interface Props {
    file: FileObject | null;
}

export default ({ file }: Props) => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('');
    const [mode, setMode] = useState('text/plain');
    const [saved, setSaved] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { addError, clearFlashes } = useFlash();

    let fetchFileContent: null | (() => Promise<string>) = null;

    useEffect(() => {
        if (!file) return;

        setError('');
        setLoading(true);
        setContent('');
        setSaved(false);

        const path = join(directory || '/', file.name);
        getFileContents(uuid, path)
            .then((text) => setContent(text))
            .catch((error) => {
                console.error(error);
                setError(httpErrorToHuman(error));
            })
            .then(() => setLoading(false));
    }, [file?.key, uuid, directory]);

    const save = () => {
        if (!fetchFileContent || !file) return;

        setLoading(true);
        clearFlashes('files:view');

        fetchFileContent()
            .then((text) => saveFileContents(uuid, join(directory || '/', file.name), text))
            .then(() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
                addError({ message: 'Archivo guardado correctamente.', key: 'files:view', type: 'success' });
            })
            .catch((error) => {
                console.error(error);
                addError({ message: httpErrorToHuman(error), key: 'files:view', type: 'error' });
            })
            .then(() => setLoading(false));
    };

    if (!file) {
        return (
            <div
                className="w-full h-full rounded-2xl flex flex-col items-center justify-center text-neutral-600"
                style={{
                    background: '#07070a',
                    border: '1px solid rgba(255,255,255,0.05)',
                    minHeight: '400px',
                }}
            >
                <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}
                >
                    <FontAwesomeIcon icon={faCode} className="text-3xl text-violet-800" />
                </div>
                <p className="font-semibold text-neutral-500 text-base">Selecciona un archivo para editar</p>
                <p className="text-xs text-neutral-700 mt-1">Haz clic en cualquier archivo de la izquierda</p>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="w-full h-full rounded-2xl flex flex-col items-center justify-center p-8 text-center"
                style={{ background: '#07070a', border: '1px solid rgba(239,68,68,0.15)', minHeight: '400px' }}
            >
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                    <FontAwesomeIcon icon={faFileCode} className="text-2xl text-red-400" />
                </div>
                <p className="font-bold text-red-400 text-base mb-2">Error al cargar el archivo</p>
                <p className="text-neutral-500 text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div
            className="w-full h-full rounded-2xl flex flex-col overflow-hidden relative"
            style={{ background: '#07070a', border: '1px solid rgba(255,255,255,0.06)' }}
        >
            <SpinnerOverlay visible={loading} />

            {/* Barra de herramientas del editor (Estilo Mac) */}
            <div
                className="flex items-center justify-between px-4 py-2 shrink-0 select-none"
                style={{
                    height: '42px',
                    background: 'linear-gradient(180deg, #161620 0%, #111118 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {/* Izquierda: Puntos Mac e Info del archivo */}
                <div className="flex items-center gap-3 min-w-0">
                    {/* Puntos Mac */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f56', boxShadow: '0 0 6px rgba(255,95,86,0.3)' }} />
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ffbd2e', boxShadow: '0 0 6px rgba(255,189,46,0.3)' }} />
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#27c93f', boxShadow: '0 0 6px rgba(39,201,63,0.3)' }} />
                    </div>

                    <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)' }} />

                    <div className="flex items-center gap-2 min-w-0">
                        <FontAwesomeIcon icon={faFileCode} className="text-violet-400 text-xs shrink-0" />
                        <p
                            className="text-white font-semibold text-xs truncate"
                            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
                        >
                            {file.name}
                        </p>
                    </div>
                </div>

                {/* Controles */}
                <div className="flex items-center gap-2 flex-none ml-3">
                    <div className="relative flex-none">
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.currentTarget.value)}
                            className="appearance-none text-xs font-semibold pl-3 pr-8 py-1.5 rounded-lg cursor-pointer transition-all focus:outline-none"
                            style={{
                                background: 'rgba(139,92,246,0.12)',
                                border: '1px solid rgba(139,92,246,0.25)',
                                color: '#c4b5fd',
                                minWidth: '120px',
                            }}
                        >
                            {modes.map((m) => (
                                <option
                                    key={`${m.name}_${m.mime}`}
                                    value={m.mime}
                                    style={{ background: '#1a1a22', color: '#e2e8f0' }}
                                >
                                    {m.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8b5cf6' }}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    <Can action={'file.update'}>
                        <button
                            onClick={() => save()}
                            disabled={loading}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                            style={{
                                background: saved
                                    ? 'rgba(34,197,94,0.15)'
                                    : 'rgba(139,92,246,0.2)',
                                color: saved ? '#4ade80' : '#a78bfa',
                                border: saved
                                    ? '1px solid rgba(34,197,94,0.25)'
                                    : '1px solid rgba(139,92,246,0.3)',
                            }}
                        >
                            <FontAwesomeIcon icon={faSave} />
                            {saved ? 'Guardado' : 'Guardar'}
                        </button>
                    </Can>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 relative overflow-hidden">
                <CodemirrorEditor
                    mode={mode}
                    filename={file.name}
                    onModeChanged={setMode}
                    initialContent={content}
                    fetchContent={(value) => {
                        fetchFileContent = value;
                    }}
                    onContentSaved={() => save()}
                    style={{ height: '100%' }}
                />
            </div>
        </div>
    );
};
