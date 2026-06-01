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
import tw from 'twin.macro';
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
import { faTrashAlt, faList, faThLarge, faCode, faSearch, faFolderPlus, faCloudUploadAlt, faFileAlt } from '@fortawesome/free-solid-svg-icons';

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
        <ServerContentBlock title={'File Manager'} showFlashKey={'files'}>
            <ErrorBoundary>
                {/* Top Action Bar */}
                <div className="flex items-center justify-between mb-6">
                    <button className="flex items-center gap-x-2 bg-transparent border border-white/10 hover:border-white/20 text-neutral-400 hover:text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm font-semibold">
                        <FontAwesomeIcon icon={faTrashAlt} className="w-4 h-4" />
                        Papelera
                    </button>
                    
                    <div className="flex items-center bg-[#0a0a0c] border border-white/5 rounded-xl p-1 shadow-lg">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-x-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'list' ? 'bg-primary-500/20 text-primary-300' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            <FontAwesomeIcon icon={faList} /> Lista
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-x-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'grid' ? 'bg-primary-500/20 text-primary-300' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            <FontAwesomeIcon icon={faThLarge} /> Cuadrícula
                        </button>
                        <button 
                            onClick={() => setViewMode('ide')}
                            className={`flex items-center gap-x-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'ide' ? 'bg-primary-500/20 text-primary-300' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            <FontAwesomeIcon icon={faCode} /> IDE
                        </button>
                    </div>
                </div>

                {/* Breadcrumbs and Main Actions */}
                <div className="flex flex-col lg:flex-row gap-4 mb-4 items-center">
                    <div className="flex-1 bg-[#0a0a0c] border border-white/5 rounded-xl p-2 px-4 flex items-center h-[46px] shadow-lg w-full">
                        <FileManagerBreadcrumbs />
                    </div>
                    <Can action={'file.create'}>
                        <div className="flex items-center gap-x-3 w-full lg:w-auto overflow-x-auto no-scrollbar shrink-0">
                            <UploadButton />
                            <NewDirectoryButton />
                            <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
                                <Button className="bg-primary-600 hover:bg-primary-500 text-white font-bold h-[46px] px-5 rounded-xl shadow-lg flex items-center gap-x-2 whitespace-nowrap">
                                    <FontAwesomeIcon icon={faFileAlt} /> Nuevo archivo
                                </Button>
                            </NavLink>
                        </div>
                    </Can>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faSearch} className="text-neutral-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search this folder..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0a0a0c] border border-white/5 text-white text-sm rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all placeholder:text-neutral-600 shadow-lg"
                    />
                </div>
            </ErrorBoundary>

            {/* File List Header */}
            <div className="grid grid-cols-12 items-center px-6 py-3 mb-2 border-b border-white/5 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                <div className="col-span-12 sm:col-span-7 flex items-center gap-x-4">
                    <FileActionCheckbox
                        type={'checkbox'}
                        checked={selectedFilesLength === (filteredFiles.length === 0 ? -1 : filteredFiles.length)}
                        onChange={onSelectAllClick}
                        className="bg-[#050505] border-white/10 rounded cursor-pointer h-4 w-4 checked:bg-primary-500 transition-colors"
                    />
                    <span>Nombre</span>
                </div>
                <div className="hidden sm:block sm:col-span-2 text-right">
                    <span>Tamaño</span>
                </div>
                <div className="hidden sm:block sm:col-span-3 text-right pr-6">
                    <span>Modificado</span>
                </div>
            </div>

            {/* File List Body */}
            {!files ? (
                <Spinner size={'large'} centered />
            ) : (
                <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-2 shadow-2xl relative">
                    {!filteredFiles.length ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <FontAwesomeIcon icon={faSearch} className="text-4xl text-neutral-800 mb-4" />
                            <p className="text-sm text-neutral-400 font-medium">No se encontraron archivos en este directorio.</p>
                        </div>
                    ) : (
                        <CSSTransition classNames={'fade'} timeout={150} appear in>
                            <div className="flex flex-col gap-y-[2px]">
                                {filteredFiles.length > 250 && (
                                    <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-2 p-3">
                                        <p className="text-yellow-400/90 text-sm text-center font-medium">
                                            This directory is too large to display in the browser, limiting the output
                                            to the first 250 files.
                                        </p>
                                    </div>
                                )}
                                {sortFiles(filteredFiles.slice(0, 250)).map((file) => (
                                    <FileObjectRow key={file.key} file={file} />
                                ))}
                                <MassActionsBar />
                            </div>
                        </CSSTransition>
                    )}
                </div>
            )}
        </ServerContentBlock>
    );
};
