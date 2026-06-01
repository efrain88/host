import React, { useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/http';
import { CSSTransition } from 'react-transition-group';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { FileObject } from '@/api/server/files/loadDirectory';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import { NavLink, useLocation } from 'react-router-dom';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import UploadButton from '@/components/server/files/UploadButton';
import { ServerError } from '@/components/elements/ScreenBlock';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FileActionCheckbox } from '@/components/server/files/SelectFileCheckbox';
import { hashToPath } from '@/helpers';
import style from './style.module.css';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { ServerContext } from '@/state/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThLarge, faList, faCode, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import EmbeddedFileEditor from '@/components/server/files/EmbeddedFileEditor';
import deleteFiles from '@/api/server/files/deleteFiles';
import useFlash from '@/plugins/useFlash';
import Button from '@/components/elements/Button';
import ServerContentBlock from '@/components/elements/ServerContentBlock';

const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles: FileObject[] = [...files]
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1].name);
};

export default () => {
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { hash } = useLocation();
    const { data: files, error, mutate } = useFileManagerSwr();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const clearFlashes = ServerContext.useStoreActions((actions) => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);

    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);

    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'ide'>('list');
    const [selectedIdeFile, setSelectedIdeFile] = useState<FileObject | null>(null);
    const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);
    const { clearAndAddHttpError } = useFlash();

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
        setDirectory(hashToPath(hash));
        setSelectedIdeFile(null);
    }, [hash]);

    useEffect(() => {
        mutate();
    }, [directory]);

    const onSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(e.currentTarget.checked ? (files?.map((file) => file.name) ?? []) : []);
    };

    const emptyTrash = () => {
        if (!files || files.length === 0) return;
        setIsEmptyingTrash(true);
        clearFlashes('files');
        
        const fileNames = files.map(f => f.name);
        
        deleteFiles(uuid, directory, fileNames)
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .finally(() => setIsEmptyingTrash(false));
    };

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => mutate()} />;
    }

    const isTrash = directory.startsWith('/.trash');
    const filteredFiles = isTrash ? (files || []) : (files?.filter((file) => file.name !== '.trash') || []);

    return (
        <ServerContentBlock title={'Administrador de Archivos'} showFlashKey={'files'}>
            <div className="flex flex-col gap-6 relative">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#0a0a0c] border border-white/5 rounded-2xl shadow-xl">
                    <ErrorBoundary>
                        <div className="flex-1 min-w-[200px]">
                            <FileManagerBreadcrumbs
                                renderLeft={
                                    <div className="flex items-center gap-x-2 mr-4 bg-black/40 p-1 rounded-lg border border-white/5">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-2 rounded-md transition-all duration-200 ${
                                                viewMode === 'list' ? 'bg-primary-500 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                                            }`}
                                            title="Vista de Lista"
                                        >
                                            <FontAwesomeIcon icon={faList} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-2 rounded-md transition-all duration-200 ${
                                                viewMode === 'grid' ? 'bg-primary-500 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                                            }`}
                                            title="Vista de Cuadrícula"
                                        >
                                            <FontAwesomeIcon icon={faThLarge} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('ide')}
                                            className={`p-2 rounded-md transition-all duration-200 ${
                                                viewMode === 'ide' ? 'bg-primary-500 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                                            }`}
                                            title="Vista IDE (Split-Screen)"
                                        >
                                            <FontAwesomeIcon icon={faCode} />
                                        </button>
                                    </div>
                                }
                            />
                        </div>
                    </ErrorBoundary>

                    <div className="flex items-center gap-2">
                        {isTrash && (
                            <Button 
                                color="red" 
                                size="small" 
                                className="mr-2 flex items-center gap-2" 
                                disabled={filteredFiles.length === 0 || isEmptyingTrash}
                                onClick={emptyTrash}
                            >
                                <FontAwesomeIcon icon={faTrashAlt} />
                                Vaciar Papelera
                            </Button>
                        )}
                        <NewDirectoryButton />
                        <UploadButton />
                        <NavLink
                            to={`/server/${id}/files/new${window.location.hash}`}
                            className="flex items-center gap-x-2 bg-primary-600 hover:bg-primary-500 text-white font-bold px-4 h-[42px] rounded-xl transition-all duration-200 shadow-lg text-sm whitespace-nowrap"
                        >
                            Crear Archivo
                        </NavLink>
                    </div>
                </div>

                {!files ? (
                    <SpinnerOverlay visible size={'large'} />
                ) : (
                    <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl shadow-xl overflow-hidden min-h-[500px]">
                        <CSSTransition classNames={'fade'} timeout={150} appear in>
                            <>
                                {filteredFiles.length === 0 ? (
                                    <p className="text-sm text-neutral-400 text-center py-12">
                                        Esta carpeta está vacía.
                                    </p>
                                ) : (
                                    <>
                                        {/* File List Header (Only visible in list mode) */}
                                        {viewMode === 'list' && (
                                            <div className="flex items-center px-4 py-3 mb-2 border-b border-white/5 text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                                                <div className="mr-4 pl-2">
                                                    <FileActionCheckbox
                                                        type={'checkbox'}
                                                        checked={selectedFilesLength === (filteredFiles.length === 0 ? -1 : filteredFiles.length)}
                                                        onChange={onSelectAllClick}
                                                        className="bg-[#050505] border-white/10 rounded cursor-pointer h-4 w-4 checked:bg-primary-500 transition-colors"
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
                                                {/* Placeholder for the 3-dots menu width */}
                                                <div className="w-8"></div>
                                            </div>
                                        )}

                                        <div className={
                                            viewMode === 'ide' 
                                                ? 'flex items-stretch min-h-[calc(100vh-250px)] w-full gap-4 p-2' 
                                                : viewMode === 'grid' 
                                                    ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-2' 
                                                    : 'flex flex-col gap-y-[2px]'
                                        }>
                                            {viewMode === 'ide' ? (
                                                <>
                                                    {/* IDE Left Sidebar: File List */}
                                                    <div className="w-1/3 border-r border-white/5 pr-4 overflow-y-auto max-h-[calc(100vh-250px)] no-scrollbar flex flex-col gap-y-1 relative">
                                                        {sortFiles(filteredFiles).map((file) => (
                                                            <div key={file.key} onClick={() => file.isFile && setSelectedIdeFile(file)} className={selectedIdeFile?.key === file.key ? 'bg-primary-500/10 rounded-lg' : ''}>
                                                                <FileObjectRow file={file} viewMode="ide" isIdeSelected={selectedIdeFile?.key === file.key} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {/* IDE Right Content: Editor */}
                                                    <div className="w-2/3">
                                                        <EmbeddedFileEditor file={selectedIdeFile} />
                                                    </div>
                                                </>
                                            ) : (
                                                sortFiles(filteredFiles).map((file) => (
                                                    <FileObjectRow key={file.key} file={file} viewMode={viewMode} />
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </>
                        </CSSTransition>
                    </div>
                )}

                <MassActionsBar />
            </div>
        </ServerContentBlock>
    );
};
