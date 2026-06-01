import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faFileArchive, faFileImport, faFolder, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import { encodePathSegments } from '@/helpers';
import { differenceInHours, format, formatDistanceToNow } from 'date-fns';
import React, { memo } from 'react';
import { FileObject } from '@/api/server/files/loadDirectory';
import FileDropdownMenu from '@/components/server/files/FileDropdownMenu';
import { ServerContext } from '@/state/server';
import { NavLink, useRouteMatch } from 'react-router-dom';
import isEqual from 'react-fast-compare';
import SelectFileCheckbox from '@/components/server/files/SelectFileCheckbox';
import { usePermissions } from '@/plugins/usePermissions';
import { join } from 'pathe';
import { bytesToString } from '@/lib/formatters';

const Clickable: React.FC<{ file: FileObject; className?: string; viewMode?: 'list' | 'grid' | 'ide' }> = memo(({ file, children, className, viewMode }) => {
    const [canRead] = usePermissions(['file.read']);
    const [canReadContents] = usePermissions(['file.read-content']);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const match = useRouteMatch();

    const isGrid = viewMode === 'grid';
    const defaultClasses = isGrid 
        ? "flex flex-col items-center justify-center text-center w-full h-full cursor-default"
        : "flex-1 grid grid-cols-12 items-center cursor-default";
    const linkClasses = isGrid
        ? "flex flex-col items-center justify-center text-center w-full h-full cursor-pointer transition-colors"
        : "flex-1 grid grid-cols-12 items-center cursor-pointer transition-colors";

    return (file.isFile && (!file.isEditable() || !canReadContents)) || (!file.isFile && !canRead) ? (
        <div className={`${defaultClasses} ${className || ''}`}>{children}</div>
    ) : (
        <NavLink
            className={`${linkClasses} ${className || ''}`}
            to={`${match.url}${file.isFile ? '/edit' : ''}#${encodePathSegments(join(directory, file.name))}`}
        >
            {children}
        </NavLink>
    );
}, isEqual);

const FileObjectRow = ({ file, viewMode = 'list' }: { file: FileObject; viewMode?: 'list' | 'grid' | 'ide' }) => {
    const isGrid = viewMode === 'grid';

    if (isGrid) {
        return (
            <div
                className="group relative flex flex-col bg-[#050505] border border-white/5 hover:border-white/10 hover:bg-[#0a0a0c] rounded-xl p-4 transition-all duration-200"
                key={file.name}
                onContextMenu={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent(`pterodactyl:files:ctx:${file.key}`, { detail: e.clientX }));
                }}
            >
                <div className="absolute top-2 left-2 z-10">
                    <SelectFileCheckbox name={file.name} className="bg-[#111] border-white/10 rounded cursor-pointer h-4 w-4 checked:bg-primary-500 transition-colors" />
                </div>
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <FileDropdownMenu file={file} />
                </div>

                <Clickable file={file} viewMode="grid">
                    <div className={`text-4xl mb-3 ${file.isFile ? 'text-primary-300' : 'text-primary-500'}`}>
                        {file.isFile ? (
                            <FontAwesomeIcon icon={file.isSymlink ? faFileImport : file.isArchiveType() ? faFileArchive : faFileAlt} />
                        ) : (
                            <FontAwesomeIcon icon={faFolder} />
                        )}
                    </div>
                    <div className="w-full truncate font-medium text-sm text-neutral-200 group-hover:text-white transition-colors">
                        {file.name}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                        {file.isFile ? bytesToString(file.size) : '--'}
                    </div>
                </Clickable>
            </div>
        );
    }

    return (
        <div
            className="group flex items-center px-4 py-2 border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
            key={file.name}
            onContextMenu={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent(`pterodactyl:files:ctx:${file.key}`, { detail: e.clientX }));
            }}
        >
            <div className="mr-4 pl-2">
                <SelectFileCheckbox name={file.name} className="bg-[#050505] border-white/10 rounded cursor-pointer h-4 w-4 checked:bg-primary-500 transition-colors" />
            </div>
            
            <Clickable file={file} viewMode={viewMode}>
                <div className={`col-span-12 ${viewMode === 'list' ? 'sm:col-span-7' : ''} flex items-center gap-x-4`}>
                    <div className={`flex-none text-xl ${file.isFile ? 'text-primary-300' : 'text-primary-500'}`}>
                        {file.isFile ? (
                            <FontAwesomeIcon icon={file.isSymlink ? faFileImport : file.isArchiveType() ? faFileArchive : faFileAlt} />
                        ) : (
                            <FontAwesomeIcon icon={faFolder} />
                        )}
                    </div>
                    <div className="flex-1 truncate font-medium text-sm text-neutral-200 group-hover:text-white transition-colors">{file.name}</div>
                </div>
                
                {viewMode === 'list' && (
                    <>
                        <div className="hidden sm:block sm:col-span-2 text-right text-xs text-neutral-400 font-mono">
                            {file.isFile ? bytesToString(file.size) : <span className="text-neutral-600">--</span>}
                        </div>
                        
                        <div className="hidden sm:block sm:col-span-3 text-right pr-6 text-xs text-neutral-400" title={file.modifiedAt.toString()}>
                            {Math.abs(differenceInHours(file.modifiedAt, new Date())) > 48
                                ? format(file.modifiedAt, 'MMM do, yyyy h:mma')
                                : formatDistanceToNow(file.modifiedAt, { addSuffix: true })}
                        </div>
                    </>
                )}
            </Clickable>
            
            <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <FileDropdownMenu file={file} />
            </div>
        </div>
    );
};

export default memo(FileObjectRow, (prevProps, nextProps) => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { isArchiveType, isEditable, ...prevFile } = prevProps.file;
    const { isArchiveType: nextIsArchiveType, isEditable: nextIsEditable, ...nextFile } = nextProps.file;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    return isEqual(prevFile, nextFile) && prevProps.viewMode === nextProps.viewMode;
});
