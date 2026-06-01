import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faFileArchive, faFileImport, faFolder } from '@fortawesome/free-solid-svg-icons';
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

const Clickable: React.FC<{ file: FileObject; className?: string }> = memo(({ file, children, className }) => {
    const [canRead] = usePermissions(['file.read']);
    const [canReadContents] = usePermissions(['file.read-content']);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const match = useRouteMatch();

    return (file.isFile && (!file.isEditable() || !canReadContents)) || (!file.isFile && !canRead) ? (
        <div className={`flex-1 grid grid-cols-12 items-center cursor-default ${className || ''}`}>{children}</div>
    ) : (
        <NavLink
            className={`flex-1 grid grid-cols-12 items-center cursor-pointer transition-colors ${className || ''}`}
            to={`${match.url}${file.isFile ? '/edit' : ''}#${encodePathSegments(join(directory, file.name))}`}
        >
            {children}
        </NavLink>
    );
}, isEqual);

const FileObjectRow = ({ file }: { file: FileObject }) => (
    <div
        className="group flex items-center px-6 py-3 border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
        key={file.name}
        onContextMenu={(e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent(`pterodactyl:files:ctx:${file.key}`, { detail: e.clientX }));
        }}
    >
        <div className="mr-4">
            <SelectFileCheckbox name={file.name} className="bg-[#050505] border-white/10 rounded cursor-pointer h-4 w-4 checked:bg-primary-500 transition-colors" />
        </div>
        
        <Clickable file={file}>
            <div className="col-span-12 sm:col-span-7 flex items-center gap-x-4">
                <div className={`flex-none text-xl ${file.isFile ? 'text-primary-300' : 'text-primary-500'}`}>
                    {file.isFile ? (
                        <FontAwesomeIcon
                            icon={file.isSymlink ? faFileImport : file.isArchiveType() ? faFileArchive : faFileAlt}
                        />
                    ) : (
                        <FontAwesomeIcon icon={faFolder} />
                    )}
                </div>
                <div className="flex-1 truncate font-medium text-sm text-neutral-200 group-hover:text-white transition-colors">{file.name}</div>
            </div>
            
            <div className="hidden sm:block sm:col-span-2 text-right text-sm text-neutral-400 font-mono">
                {file.isFile ? bytesToString(file.size) : <span className="text-neutral-600">--</span>}
            </div>
            
            <div className="hidden sm:block sm:col-span-3 text-right pr-6 text-sm text-neutral-400" title={file.modifiedAt.toString()}>
                {Math.abs(differenceInHours(file.modifiedAt, new Date())) > 48
                    ? format(file.modifiedAt, 'MMM do, yyyy h:mma')
                    : formatDistanceToNow(file.modifiedAt, { addSuffix: true })}
            </div>
        </Clickable>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <FileDropdownMenu file={file} />
        </div>
    </div>
);

export default memo(FileObjectRow, (prevProps, nextProps) => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { isArchiveType, isEditable, ...prevFile } = prevProps.file;
    const { isArchiveType: nextIsArchiveType, isEditable: nextIsEditable, ...nextFile } = nextProps.file;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    return isEqual(prevFile, nextFile);
});
