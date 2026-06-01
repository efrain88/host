import React, { useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/http';
import { CSSTransition } from 'react-transition-group';
import Spinner from '@/components/elements/Spinner';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { FileObject } from '@/api/server/files/loadDirectory';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import { NavLink, useLocation } from 'react-router-dom';
import Can from '@/components/elements/Can';
import { ServerError } from '@/components/elements/ScreenBlock';
import { ServerContext } from '@/state/server';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import UploadButton from '@/components/server/files/UploadButton';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useStoreActions } from '@/state/hooks';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FileActionCheckbox } from '@/components/server/files/SelectFileCheckbox';
import { hashToPath } from '@/helpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faList, faThLarge, faCode, faSearch, faFileAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import EmbeddedFileEditor from '@/components/server/files/EmbeddedFileEditor';
import TrashModal from '@/components/server/files/TrashModal';

const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles: FileObject[] = [...files]
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1].name);
};

export default () => {
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const { hash } = useLocation();
    const { data: files, error, mutate } = useFileManagerSwr();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);

    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'ide'>('list');
    const [selectedIdeFile, setSelectedIdeFile] = useState<FileObject | null>(null);
    const [showTrashModal, setShowTrashModal] = useState(false);

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
        setDirectory(hashToPath(hash));
        setSearchQuery('');
        setSelectedIdeFile(null);
    }, [hash]);

    useEffect(() => {
        mutate();
    }, [directory]);

    const onSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(e.currentTarget.checked ? files?.map((file) => file.name) || [] : []);
    };

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => mutate()} />;
    }

    const filteredFiles = (files?.filter((file) => file.name !== '.trash') || [])
        .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <ServerContentBlock title={'Administrador de Archivos'} showFlashKey={'files'}>
            {showTrashModal && <TrashModal onClose={() => setShowTrashModal(false)} />}

            <ErrorBoundary>
                {/* ── Fila 1: Botón Papelera ── */}
                <div className="flex items-center gap-3 mb-3">
                    <button
                        onClick={() => setShowTrashModal(true)}
                        className="flex items-center gap-x-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 shrink-0"
                        style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#f87171',
                        }}
                    >
                        <FontAwesomeIcon icon={faTrashAlt} className="w-4 h-4" />
                        <span>Papelera</span>
                    </button>
                </div>

                {/* ── Fila 2: Breadcrumb + acciones ── */}
                <div className="flex items-center gap-3 mb-4 overflow-x-auto no-scrollbar pb-1">
                    {/* Breadcrumb */}
                    <div className="flex-1 min-w-0 bg-[#0a0a0d] border border-white/5 rounded-xl px-4 py-2.5 flex items-center h-[42px] shadow-lg">
                        <FileManagerBreadcrumbs />
                    </div>

                    {/* Botones de acción */}
                    <Can action={'file.create'}>
                        <div className="flex items-center gap-x-2 shrink-0">
                            <UploadButton className="h-[42px] text-xs px-4" />
                            <NewDirectoryButton className="h-[42px] text-xs px-4" />
                            <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
                                <div
                                    className="flex items-center gap-x-2 font-bold h-[42px] px-4 rounded-xl shadow-lg whitespace-nowrap text-xs cursor-pointer transition-all"
                                    style={{
                                        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                        color: 'white',
                                    }}
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    <span className="hidden lg:inline">Nuevo archivo</span>
                                </div>
                            </NavLink>
                        </div>
                    </Can>

                    {/* Selector de vista */}
                    <div className="flex items-center bg-[#0a0a0d] border border-white/5 rounded-xl p-1 shadow-lg shrink-0 h-[42px]">
                        {[
                            { mode: 'list' as const, icon: faList, label: 'Lista' },
                            { mode: 'grid' as const, icon: faThLarge, label: 'Cuadrícula' },
                            { mode: 'ide' as const, icon: faCode, label: 'IDE' },
                        ].map(({ mode, icon, label }) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`flex items-center gap-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                                    viewMode === mode
                                        ? 'text-violet-300'
                                        : 'text-neutral-500 hover:text-neutral-300'
                                }`}
                                style={viewMode === mode ? { background: 'rgba(139,92,246,0.15)' } : {}}
                            >
                                <FontAwesomeIcon icon={icon} />
                                <span className="hidden xl:inline">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Barra de búsqueda ── */}
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faSearch} className="text-neutral-600" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar archivos en este directorio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-white text-sm rounded-xl py-3 pl-11 pr-4 focus:outline-none transition-all placeholder:text-neutral-700 shadow-lg"
                        style={{
                            background: '#0a0a0d',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                    />
                </div>
            </ErrorBoundary>

            {/* ── Cabecera de columnas (solo modo lista) ── */}
            {viewMode === 'list' && (
                <div className="flex items-center px-4 py-3 mb-1 text-[11px] font-bold text-neutral-600 uppercase tracking-widest"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="mr-4 pl-2">
                        <FileActionCheckbox
                            type={'checkbox'}
                            checked={selectedFilesLength === (filteredFiles.length === 0 ? -1 : filteredFiles.length)}
                            onChange={onSelectAllClick}
                            className="bg-[#050505] border-white/10 rounded cursor-pointer h-4 w-4 checked:bg-violet-500 transition-colors"
                        />
                    </div>
                    <div className="flex-1 grid grid-cols-12 items-center">
                        <div className="col-span-12 sm:col-span-7 flex items-center gap-x-4">
                            <span>Nombre</span>
                        </div>
                        <div className="hidden sm:block sm:col-span-2 text-right">
                            <span>Tamaño</span>
                        </div>
                        <div className="hidden sm:block sm:col-span-3 text-right pr-6">
                            <span>Modificado</span>
                        </div>
                    </div>
                    <div className="w-8"></div>
                </div>
            )}

            {/* ── Cuerpo principal ── */}
            {!files ? (
                <Spinner size={'large'} centered />
            ) : (
                <div className="rounded-2xl p-2 shadow-2xl relative" style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {!filteredFiles.length ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                            <FontAwesomeIcon icon={faSearch} className="text-5xl text-neutral-800 mb-4" />
                            <p className="text-sm text-neutral-500 font-medium">No se encontraron archivos en este directorio.</p>
                        </div>
                    ) : (
                        <CSSTransition classNames={'fade'} timeout={150} appear in>
                            <div className={
                                viewMode === 'ide'
                                    ? 'flex items-stretch min-h-[75vh] gap-4'
                                    : viewMode === 'grid'
                                        ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-2'
                                        : 'flex flex-col gap-y-[2px]'
                            }>
                                {viewMode === 'ide' ? (
                                    <>
                                        {/* Panel izquierdo IDE: Lista de archivos */}
                                        <div className="w-1/3 overflow-y-auto max-h-[75vh] no-scrollbar flex flex-col gap-y-1 relative pr-3"
                                            style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                                            {sortFiles(filteredFiles).map((file) => (
                                                <div
                                                    key={file.key}
                                                    onClick={() => file.isFile && setSelectedIdeFile(file)}
                                                    className="rounded-lg cursor-pointer transition-all"
                                                    style={selectedIdeFile?.key === file.key ? { background: 'rgba(139,92,246,0.1)' } : {}}
                                                >
                                                    <FileObjectRow file={file} viewMode="ide" isIdeSelected={selectedIdeFile?.key === file.key} />
                                                </div>
                                            ))}
                                        </div>
                                        {/* Panel derecho IDE: Editor */}
                                        <div className="w-2/3">
                                            <EmbeddedFileEditor file={selectedIdeFile} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {filteredFiles.length > 250 && viewMode === 'list' && (
                                            <div className="rounded-xl mb-2 p-3 col-span-full"
                                                style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)' }}>
                                                <p className="text-yellow-400/80 text-sm text-center font-medium">
                                                    Este directorio es muy grande, mostrando los primeros 250 archivos.
                                                </p>
                                            </div>
                                        )}
                                        {sortFiles(filteredFiles.slice(0, 250)).map((file) => (
                                            <FileObjectRow key={file.key} file={file} viewMode={viewMode as 'list' | 'grid'} />
                                        ))}
                                        <MassActionsBar />
                                    </>
                                )}
                            </div>
                        </CSSTransition>
                    )}
                </div>
            )}
        </ServerContentBlock>
    );
};
