import React, { memo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen,
    faCopy,
    faEllipsisH,
    faFileArchive,
    faFileCode,
    faFileDownload,
    faLevelUpAlt,
    faPencilAlt,
    faTrashAlt,
    IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import { ServerContext } from '@/state/server';
import { join } from 'pathe';
import deleteFiles from '@/api/server/files/deleteFiles';
import renameFiles from '@/api/server/files/renameFiles';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import copyFile from '@/api/server/files/copyFile';
import Can from '@/components/elements/Can';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import useFlash from '@/plugins/useFlash';
import { FileObject } from '@/api/server/files/loadDirectory';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import DropdownMenu from '@/components/elements/DropdownMenu';
import useEventListener from '@/plugins/useEventListener';
import compressFiles from '@/api/server/files/compressFiles';
import decompressFiles from '@/api/server/files/decompressFiles';
import isEqual from 'react-fast-compare';
import ChmodFileModal from '@/components/server/files/ChmodFileModal';
import { Dialog } from '@/components/elements/dialog';

type ModalType = 'rename' | 'move' | 'chmod';

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: IconDefinition;
    title: string;
    $danger?: boolean;
}

const Row = ({ icon, title, $danger, ...props }: RowProps) => (
    <div
        className={`p-2 px-4 flex items-center rounded-lg cursor-pointer transition-colors duration-200 ${
            $danger 
                ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300' 
                : 'hover:bg-white/10 text-neutral-300 hover:text-white'
        }`}
        {...props}
    >
        <FontAwesomeIcon icon={icon} className="text-xs w-4" fixedWidth />
        <span className="ml-3 font-medium text-sm">{title}</span>
    </div>
);

const FileDropdownMenu = ({ file }: { file: FileObject }) => {
    const onClickRef = useRef<DropdownMenu>(null);
    const [showSpinner, setShowSpinner] = useState(false);
    const [modal, setModal] = useState<ModalType | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearAndAddHttpError, clearFlashes } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const isTrash = directory.startsWith('/.trash');

    useEventListener(`pterodactyl:files:ctx:${file.key}`, (e: CustomEvent) => {
        if (onClickRef.current) {
            onClickRef.current.triggerMenu(e.detail);
        }
    });

    const doDeletion = () => {
        clearFlashes('files');

        // For UI speed, immediately remove the file from the listing before calling the deletion function.
        mutate((files) => files.filter((f) => f.key !== file.key), false);

        if (isTrash) {
            deleteFiles(uuid, directory, [file.name]).catch((error) => {
                mutate();
                clearAndAddHttpError({ key: 'files', error });
            });
        } else {
            renameFiles(uuid, '/', [{ from: join(directory, file.name), to: `/.trash/${file.name}` }]).catch((error) => {
                mutate();
                clearAndAddHttpError({ key: 'files', error });
            });
        }
    };

    const doCopy = () => {
        setShowSpinner(true);
        clearFlashes('files');

        copyFile(uuid, join(directory, file.name))
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doDownload = () => {
        setShowSpinner(true);
        clearFlashes('files');

        getFileDownloadUrl(uuid, join(directory, file.name))
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doArchive = () => {
        setShowSpinner(true);
        clearFlashes('files');

        compressFiles(uuid, directory, [file.name])
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doUnarchive = () => {
        setShowSpinner(true);
        clearFlashes('files');

        decompressFiles(uuid, directory, file.name)
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    return (
        <>
            <Dialog.Confirm
                open={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                title={isTrash ? `Eliminar permanentemente ${file.isFile ? 'el archivo' : 'la carpeta'}` : `Mover a papelera ${file.isFile ? 'el archivo' : 'la carpeta'}`}
                confirm={isTrash ? 'Eliminar permanentemente' : 'Mover a papelera'}
                onConfirmed={doDeletion}
            >
                {isTrash 
                    ? <>No podrás recuperar <span className="font-semibold text-gray-50">{file.name}</span> una vez eliminado.</>
                    : <>El archivo <span className="font-semibold text-gray-50">{file.name}</span> se moverá a la papelera.</>}
            </Dialog.Confirm>
            
            {/* The actual DropdownMenu wrapper provides absolute positioning relative to click */}
            <DropdownMenu
                ref={onClickRef}
                renderToggle={(onClick) => (
                    <div className="p-2 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(e); }}>
                        <FontAwesomeIcon icon={faEllipsisH} />
                        {modal ? (
                            modal === 'chmod' ? (
                                <ChmodFileModal
                                    visible
                                    appear
                                    files={[{ file: file.name, mode: file.modeBits }]}
                                    onDismissed={() => setModal(null)}
                                />
                            ) : (
                                <RenameFileModal
                                    visible
                                    appear
                                    files={[file.name]}
                                    useMoveTerminology={modal === 'move'}
                                    onDismissed={() => setModal(null)}
                                />
                            )
                        ) : null}
                        <SpinnerOverlay visible={showSpinner} fixed size={'large'} />
                    </div>
                )}
            >
                <div className="bg-[#0f0f11] border border-white/10 rounded-xl shadow-2xl p-1 w-48 z-50">
                    <Can action={'file.update'}>
                        <Row onClick={() => setModal('rename')} icon={faPencilAlt} title={'Renombrar'} />
                        <Row onClick={() => setModal('move')} icon={faLevelUpAlt} title={'Mover'} />
                        <Row onClick={() => setModal('chmod')} icon={faFileCode} title={'Permisos'} />
                    </Can>
                    {file.isFile && (
                        <Can action={'file.create'}>
                            <Row onClick={doCopy} icon={faCopy} title={'Copiar'} />
                        </Can>
                    )}
                    {file.isArchiveType() ? (
                        <Can action={'file.create'}>
                            <Row onClick={doUnarchive} icon={faBoxOpen} title={'Descomprimir'} />
                        </Can>
                    ) : (
                        <Can action={'file.archive'}>
                            <Row onClick={doArchive} icon={faFileArchive} title={'Comprimir'} />
                        </Can>
                    )}
                    {file.isFile && <Row onClick={doDownload} icon={faFileDownload} title={'Descargar'} />}
                    <Can action={'file.delete'}>
                        <Row onClick={() => setShowConfirmation(true)} icon={faTrashAlt} title={isTrash ? 'Eliminar (Permanente)' : 'Mover a Papelera'} $danger />
                    </Can>
                </div>
            </DropdownMenu>
        </>
    );
};

export default memo(FileDropdownMenu, isEqual);
