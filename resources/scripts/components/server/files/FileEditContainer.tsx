import React, { useEffect, useState } from 'react';
import getFileContents from '@/api/server/files/getFileContents';
import { httpErrorToHuman } from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import saveFileContents from '@/api/server/files/saveFileContents';
import { useHistory, useLocation, useParams } from 'react-router';
import FileNameModal from '@/components/server/files/FileNameModal';
import Can from '@/components/elements/Can';
import FlashMessageRender from '@/components/FlashMessageRender';
import { ServerError } from '@/components/elements/ScreenBlock';
import modes from '@/modes';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import { encodePathSegments, hashToPath } from '@/helpers';
import { dirname } from 'pathe';
import CodemirrorEditor from '@/components/elements/CodemirrorEditor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faPlus, faChevronRight, faChevronDown, faFileCode } from '@fortawesome/free-solid-svg-icons';
import { NavLink } from 'react-router-dom';

export default () => {
    const [error, setError] = useState('');
    const { action } = useParams<{ action: 'new' | string }>();
    const [loading, setLoading] = useState(action === 'edit');
    const [content, setContent] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [mode, setMode] = useState('text/plain');
    const [saved, setSaved] = useState(false);
    const [lineCount, setLineCount] = useState(0);

    const history = useHistory();
    const { hash } = useLocation();

    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);
    const { addError, clearFlashes } = useFlash();

    let fetchFileContent: null | (() => Promise<string>) = null;

    // Build breadcrumbs from hash path
    const fullPath = hashToPath(hash); // e.g. /config/server.properties
    const segments = fullPath.split('/').filter(Boolean);
    const fileName = action === 'edit' ? (segments.pop() || '') : null;
    const dirSegments = segments; // remaining segments = directory path

    useEffect(() => {
        if (action === 'new') return;

        setError('');
        setLoading(true);
        setDirectory(dirname(fullPath));
        getFileContents(uuid, fullPath)
            .then((text) => {
                setContent(text);
                setLineCount(text.split('\n').length);
            })
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
            .then((content) => saveFileContents(uuid, name || fullPath, content))
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

    const currentModeName = modes.find(m => m.mime === mode)?.name || 'Texto';

    // Traffic light dot colors (Mac style)
    const dots = [
        { color: '#ff5f56', title: 'Cerrar' },
        { color: '#ffbd2e', title: 'Minimizar' },
        { color: '#27c93f', title: 'Maximizar' },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 w-full">
            <div
                className="flex flex-col rounded-xl overflow-hidden shadow-2xl"
                style={{
                    height: 'calc(100vh - 140px)',
                    minHeight: '400px',
                    background: '#0b0b0e',
                    fontFamily: "'Inter', sans-serif",
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
            >
            {/* ── Barra superior estilo Mac ── */}
            <div
                className="flex items-center justify-between px-4 shrink-0 select-none"
                style={{
                    height: '48px',
                    background: 'linear-gradient(180deg, #161620 0%, #111118 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {/* Izquierda: puntos Mac + ruta */}
                <div className="flex items-center gap-4">
                    {/* Puntos Mac */}
                    <div className="flex items-center gap-1.5">
                        {dots.map((dot) => (
                            <div
                                key={dot.color}
                                title={dot.title}
                                className="w-3 h-3 rounded-full cursor-default"
                                style={{ background: dot.color, boxShadow: `0 0 6px ${dot.color}55` }}
                            />
                        ))}
                    </div>

                    {/* Separador */}
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.08)' }} />

                    {/* Breadcrumb tipo Mac */}
                    <div className="flex items-center gap-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                        {/* home */}
                        <span className="text-neutral-600">home</span>
                        <FontAwesomeIcon icon={faChevronRight} className="text-neutral-700 mx-0.5" style={{ fontSize: '9px' }} />

                        {/* container (link a /files) */}
                        <NavLink
                            to={`/server/${id}/files`}
                            className="text-cyan-500 hover:text-cyan-300 transition-colors no-underline px-1 py-0.5 rounded"
                            style={{ background: 'rgba(6,182,212,0.08)' }}
                        >
                            container
                        </NavLink>

                        {/* segmentos de directorio */}
                        {dirSegments.map((seg, i) => {
                            const path = '/' + dirSegments.slice(0, i + 1).join('/');
                            return (
                                <React.Fragment key={i}>
                                    <FontAwesomeIcon icon={faChevronRight} className="text-neutral-700 mx-0.5" style={{ fontSize: '9px' }} />
                                    <NavLink
                                        to={`/server/${id}/files#${encodePathSegments(path)}`}
                                        className="text-amber-400 hover:text-amber-200 transition-colors no-underline px-1 py-0.5 rounded"
                                        style={{ background: 'rgba(251,191,36,0.08)' }}
                                    >
                                        {seg}
                                    </NavLink>
                                </React.Fragment>
                            );
                        })}

                        {/* nombre del archivo */}
                        {fileName && (
                            <>
                                <FontAwesomeIcon icon={faChevronRight} className="text-neutral-700 mx-0.5" style={{ fontSize: '9px' }} />
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded"
                                    style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                    <FontAwesomeIcon icon={faFileCode} className="text-violet-400" style={{ fontSize: '10px' }} />
                                    <span className="text-violet-300 font-semibold">{fileName}</span>
                                </div>
                            </>
                        )}

                        {action === 'new' && (
                            <>
                                <FontAwesomeIcon icon={faChevronRight} className="text-neutral-700 mx-0.5" style={{ fontSize: '9px' }} />
                                <span className="text-emerald-400 px-1.5 py-0.5 rounded"
                                    style={{ background: 'rgba(52,211,153,0.1)' }}>
                                    nuevo archivo
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Derecha: selector lenguaje + guardar */}
                <div className="flex items-center gap-2">
                    {/* Selector de lenguaje */}
                    <div className="relative">
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.currentTarget.value)}
                            className="appearance-none text-xs font-semibold pl-3 pr-7 py-1.5 rounded-lg cursor-pointer focus:outline-none"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#94a3b8',
                                minWidth: '110px',
                            }}
                        >
                            {modes.map((m) => (
                                <option
                                    key={`${m.name}_${m.mime}`}
                                    value={m.mime}
                                    style={{ background: '#1e1e2a', color: '#e2e8f0' }}
                                >
                                    {m.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                            <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '9px' }} />
                        </div>
                    </div>

                    {/* Botón acción */}
                    {action === 'edit' ? (
                        <Can action={'file.update'}>
                            <button
                                onClick={() => save()}
                                disabled={loading}
                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                                style={saved ? {
                                    background: 'rgba(34,197,94,0.15)',
                                    border: '1px solid rgba(34,197,94,0.3)',
                                    color: '#4ade80',
                                } : {
                                    background: 'rgba(139,92,246,0.2)',
                                    border: '1px solid rgba(139,92,246,0.35)',
                                    color: '#c4b5fd',
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
                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                                style={{
                                    background: 'rgba(52,211,153,0.15)',
                                    border: '1px solid rgba(52,211,153,0.3)',
                                    color: '#34d399',
                                }}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                Crear archivo
                            </button>
                        </Can>
                    )}
                </div>
            </div>

            {/* ── Flash messages ── */}
            <FlashMessageRender byKey={'files:view'} className="mx-4 mt-2" />

            {/* ── Aviso .pteroignore ── */}
            {hash.replace(/^#/, '').endsWith('.pteroignore') && (
                <div
                    className="mx-4 mt-2 px-4 py-3 rounded-xl text-sm text-neutral-300 leading-relaxed"
                    style={{
                        background: 'rgba(6,182,212,0.07)',
                        border: '1px solid rgba(6,182,212,0.18)',
                        borderLeft: '3px solid #06b6d4',
                    }}
                >
                    Estás editando{' '}
                    <code className="text-cyan-300" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
                        .pteroignore
                    </code>
                    . Los archivos aquí serán excluidos de las copias de seguridad. Usa <code className="text-cyan-300" style={{ fontFamily: 'monospace' }}>*</code> como comodín y <code className="text-cyan-300" style={{ fontFamily: 'monospace' }}>!</code> para negar reglas.
                </div>
            )}

            {/* ── Modal nombre de archivo nuevo ── */}
            <FileNameModal
                visible={modalVisible}
                onDismissed={() => setModalVisible(false)}
                onFileNamed={(name) => {
                    setModalVisible(false);
                    save(name);
                }}
            />

            {/* ── Editor (ocupa todo el espacio restante) ── */}
            <div className="flex-1 relative overflow-hidden">
                <SpinnerOverlay visible={loading} />
                <CodemirrorEditor
                    mode={mode}
                    filename={hash.replace(/^#/, '')}
                    onModeChanged={setMode}
                    initialContent={content}
                    fetchContent={(value) => { fetchFileContent = value; }}
                    onContentSaved={() => {
                        if (action !== 'edit') {
                            setModalVisible(true);
                        } else {
                            save();
                        }
                    }}
                    style={{ height: '100%' }}
                />
            </div>

            {/* ── Barra de estado inferior estilo IDE ── */}
            <div
                className="flex items-center justify-between px-4 shrink-0"
                style={{
                    height: '26px',
                    background: '#0d0d14',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <div className="flex items-center gap-4 text-neutral-600" style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>
                    <span className="text-violet-500">{currentModeName}</span>
                    <span>UTF-8</span>
                    {lineCount > 0 && <span>{lineCount} líneas</span>}
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'monospace' }} className="text-neutral-700">
                    Ctrl+S para guardar
                </span>
            </div>
            </div>
        </div>
    );
};
