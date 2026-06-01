import React, { useEffect, useState } from 'react';
import getFileContents from '@/api/server/files/getFileContents';
import { httpErrorToHuman } from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import saveFileContents from '@/api/server/files/saveFileContents';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { useHistory, useLocation, useParams } from 'react-router';
import FileNameModal from '@/components/server/files/FileNameModal';
import Can from '@/components/elements/Can';
import FlashMessageRender from '@/components/FlashMessageRender';
import { ServerError } from '@/components/elements/ScreenBlock';
import Button from '@/components/elements/Button';
import modes from '@/modes';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { encodePathSegments, hashToPath } from '@/helpers';
import { dirname } from 'pathe';
import CodemirrorEditor from '@/components/elements/CodemirrorEditor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faPlus, faChevronDown } from '@fortawesome/free-solid-svg-icons';

export default () => {
    const [error, setError] = useState('');
    const { action } = useParams<{ action: 'new' | string }>();
    const [loading, setLoading] = useState(action === 'edit');
    const [content, setContent] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [mode, setMode] = useState('text/plain');
    const [saved, setSaved] = useState(false);

    const history = useHistory();
    const { hash } = useLocation();

    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);
    const { addError, clearFlashes } = useFlash();

    let fetchFileContent: null | (() => Promise<string>) = null;

    useEffect(() => {
        if (action === 'new') return;

        setError('');
        setLoading(true);
        const path = hashToPath(hash);
        setDirectory(dirname(path));
        getFileContents(uuid, path)
            .then(setContent)
            .catch((error) => {
                console.error(error);
                setError(httpErrorToHuman(error));
            })
            .then(() => setLoading(false));
    }, [action, uuid, hash]);

    const save = (name?: string) => {
        if (!fetchFileContent) return;

        setLoading(true);
        clearFlashes('files:view');
        fetchFileContent()
            .then((content) => saveFileContents(uuid, name || hashToPath(hash), content))
            .then(() => {
                if (name) {
                    history.push(`/server/${id}/files/edit#/${encodePathSegments(name)}`);
                    return;
                }
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            })
            .catch((error) => {
                console.error(error);
                addError({ message: httpErrorToHuman(error), key: 'files:view' });
            })
            .then(() => setLoading(false));
    };

    if (error) {
        return <ServerError message={error} onBack={() => history.goBack()} />;
    }

    const currentModeName = modes.find(m => m.mime === mode)?.name || 'Texto plano';

    return (
        <div
            className="min-h-screen"
            style={{ background: 'linear-gradient(180deg, #080809 0%, #0a0a0d 100%)' }}
        >
            {/* Cabecera */}
            <div
                className="sticky top-0 z-30 px-6 py-3 flex items-center justify-between gap-4"
                style={{
                    background: 'rgba(10,10,13,0.95)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {/* Breadcrumb */}
                <ErrorBoundary>
                    <div className="flex-1 min-w-0">
                        <FileManagerBreadcrumbs withinFileEditor isNewFile={action !== 'edit'} />
                    </div>
                </ErrorBoundary>

                {/* Controles derechos */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* Selector de lenguaje */}
                    <div className="relative">
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.currentTarget.value)}
                            className="appearance-none text-xs font-semibold pl-3 pr-8 py-2 rounded-xl cursor-pointer transition-all focus:outline-none"
                            style={{
                                background: 'rgba(139,92,246,0.12)',
                                border: '1px solid rgba(139,92,246,0.25)',
                                color: '#c4b5fd',
                                minWidth: '130px',
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
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-violet-400">
                            <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                        </div>
                    </div>

                    {/* Botón Guardar / Crear */}
                    {action === 'edit' ? (
                        <Can action={'file.update'}>
                            <button
                                onClick={() => save()}
                                disabled={loading}
                                className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                                style={{
                                    background: saved
                                        ? 'rgba(34,197,94,0.2)'
                                        : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                    color: saved ? '#4ade80' : 'white',
                                    border: saved
                                        ? '1px solid rgba(34,197,94,0.3)'
                                        : '1px solid rgba(139,92,246,0.4)',
                                    boxShadow: saved ? 'none' : '0 4px 15px rgba(109,40,217,0.3)',
                                }}
                            >
                                <FontAwesomeIcon icon={faSave} />
                                {saved ? '¡Guardado!' : 'Guardar'}
                            </button>
                        </Can>
                    ) : (
                        <Can action={'file.create'}>
                            <button
                                onClick={() => setModalVisible(true)}
                                disabled={loading}
                                className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                                style={{
                                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                    color: 'white',
                                    border: '1px solid rgba(139,92,246,0.4)',
                                    boxShadow: '0 4px 15px rgba(109,40,217,0.3)',
                                }}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                Crear archivo
                            </button>
                        </Can>
                    )}
                </div>
            </div>

            {/* Cuerpo */}
            <div className="px-6 py-4">
                <FlashMessageRender byKey={'files:view'} className="mb-4" />

                {/* Aviso .pteroignore */}
                {hash.replace(/^#/, '').endsWith('.pteroignore') && (
                    <div
                        className="mb-4 p-4 rounded-xl flex items-start gap-3"
                        style={{
                            background: 'rgba(6,182,212,0.08)',
                            border: '1px solid rgba(6,182,212,0.2)',
                            borderLeft: '3px solid #06b6d4',
                        }}
                    >
                        <p className="text-neutral-300 text-sm leading-relaxed">
                            Estás editando un archivo{' '}
                            <code
                                className="px-1.5 py-0.5 rounded text-cyan-300"
                                style={{ background: 'rgba(0,0,0,0.4)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}
                            >
                                .pteroignore
                            </code>
                            . Los archivos y directorios listados aquí serán excluidos de las copias de seguridad.
                            Puedes usar el comodín{' '}
                            <code
                                className="px-1.5 py-0.5 rounded text-cyan-300"
                                style={{ background: 'rgba(0,0,0,0.4)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}
                            >
                                *
                            </code>
                            {' '}y negar reglas con{' '}
                            <code
                                className="px-1.5 py-0.5 rounded text-cyan-300"
                                style={{ background: 'rgba(0,0,0,0.4)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}
                            >
                                !
                            </code>
                            .
                        </p>
                    </div>
                )}

                <FileNameModal
                    visible={modalVisible}
                    onDismissed={() => setModalVisible(false)}
                    onFileNamed={(name) => {
                        setModalVisible(false);
                        save(name);
                    }}
                />

                {/* Editor */}
                <div
                    className="relative rounded-2xl overflow-hidden shadow-2xl"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                >
                    <SpinnerOverlay visible={loading} />
                    <CodemirrorEditor
                        mode={mode}
                        filename={hash.replace(/^#/, '')}
                        onModeChanged={setMode}
                        initialContent={content}
                        fetchContent={(value) => {
                            fetchFileContent = value;
                        }}
                        onContentSaved={() => {
                            if (action !== 'edit') {
                                setModalVisible(true);
                            } else {
                                save();
                            }
                        }}
                    />
                </div>

                {/* Pie del editor */}
                <div
                    className="flex items-center justify-between px-4 py-2 mt-0 rounded-b-2xl"
                    style={{
                        background: 'rgba(15,15,20,0.95)',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        marginTop: '-2px',
                    }}
                >
                    <span className="text-xs text-neutral-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {currentModeName}
                    </span>
                    <span className="text-xs text-neutral-700">
                        Ctrl+S para guardar
                    </span>
                </div>
            </div>
        </div>
    );
};
