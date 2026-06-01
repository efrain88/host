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
import { Button } from '@/components/elements/button/index';
import { ServerContext } from '@/state/server';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import FileManagerStatus from '@/components/server/files/FileManagerStatus';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import UploadButton from '@/components/server/files/UploadButton';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useStoreActions } from '@/state/hooks';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FileActionCheckbox } from '@/components/server/files/SelectFileCheckbox';
import { hashToPath } from '@/helpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faList, faThLarge, faCode, faSearch, faFileAlt } from '@fortawesome/free-solid-svg-icons';

const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles: FileObject[] = files
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

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
        setDirectory(hashToPath(hash));
        setSearchQuery('');
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

    const filteredFiles = files?.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];

    return (
        <ServerContentBlock title={'Administrador de Archivos'} showFlashKey={'files'}>
            <ErrorBoundary>
                {/* Unified Top Bar - Single Line */}
                <div className="flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar pb-1">
                    {/* Left Group */}
                    <NavLink to={`/server/${id}/files#/.trash`} className="flex items-center justify-center gap-x-2 bg-[#0a0a0c] border border-white/5 hover:border-white/20 text-neutral-400 hover:text-white h-[42px] px-4 rounded-xl transition-all duration-200 text-sm font-semibold shadow-lg shrink-0">
                        <FontAwesomeIcon icon={faTrashAlt} className="w-4 h-4" />
                        <span className="hidden md:inline">Papelera</span>
                    </NavLink>
                    
                    <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-2 px-4 flex items-center h-[42px] shadow-lg shrink-0 min-w-[200px]">
                        <FileManagerBreadcrumbs />
                    </div>

                    <div className="flex-1 min-w-[20px]"></div>

                    {/* Right Group: Actions + Views */}
                    <Can action={'file.create'}>
                        <div className="flex items-center gap-x-3 shrink-0">
                            <UploadButton className="h-[42px] text-xs px-4" />
                            <NewDirectoryButton className="h-[42px] text-xs px-4" />
                            <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
                                <Button className="bg-primary-600 hover:bg-primary-500 text-white font-bold h-[42px] px-4 rounded-xl shadow-lg flex items-center gap-x-2 whitespace-nowrap text-xs">
                                    <FontAwesomeIcon icon={faFileAlt} /> <span className="hidden lg:inline">Nuevo archivo</span>
                                </Button>
                            </NavLink>
                        </div>
                    </Can>

                    <div className="flex items-center bg-[#0a0a0c] border border-white/5 rounded-xl p-1 shadow-lg shrink-0 h-[42px]">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${viewMode === 'list' ? 'bg-primary-500/20 text-primary-300' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            <FontAwesomeIcon icon={faList} /> <span className="hidden xl:inline">Lista</span>
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${viewMode === 'grid' ? 'bg-primary-500/20 text-primary-300' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            <FontAwesomeIcon icon={faThLarge} /> <span className="hidden xl:inline">Cuadrícula</span>
                        </button>
                        <button 
                            onClick={() => setViewMode('ide')}
                            className={`flex items-center gap-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${viewMode === 'ide' ? 'bg-primary-500/20 text-primary-300' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            <FontAwesomeIcon icon={faCode} /> <span className="hidden xl:inline">IDE</span>
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faSearch} className="text-neutral-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar en este directorio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0a0a0c] border border-white/5 text-white text-sm rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all placeholder:text-neutral-600 shadow-lg"
                    />
                </div>
            </ErrorBoundary>

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

            {/* File List Body */}
            {!files ? (
                <Spinner size={'large'} centered />
            ) : (
                <div className={`bg-[#0a0a0c] border border-white/5 rounded-2xl p-2 shadow-2xl relative`}>
                    {!filteredFiles.length ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <FontAwesomeIcon icon={faSearch} className="text-4xl text-neutral-800 mb-4" />
                            <p className="text-sm text-neutral-400 font-medium">No se encontraron archivos en este directorio.</p>
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
                                        {/* IDE Left Sidebar: File List */}
                                        <div className="w-1/3 border-r border-white/5 pr-4 overflow-y-auto max-h-[75vh] no-scrollbar flex flex-col gap-y-1 relative">
                                            {sortFiles(filteredFiles).map((file) => (
                                                <FileObjectRow key={file.key} file={file} viewMode="ide" />
                                            ))}
                                        </div>
                                        {/* IDE Right Content: Editor Placeholder */}
                                        <div className="w-2/3 bg-[#050505] rounded-xl border border-white/5 flex flex-col items-center justify-center text-neutral-500 shadow-inner">
                                            <FontAwesomeIcon icon={faCode} className="text-6xl mb-4 text-neutral-800" />
                                            <p className="font-medium text-lg">Seleccione un archivo para editar</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {filteredFiles.length > 250 && viewMode === 'list' && (
                                            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-2 p-3 col-span-full">
                                                <p className="text-yellow-400/90 text-sm text-center font-medium">
                                                    Este directorio es muy grande para mostrarse, limitando a 250 archivos.
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
