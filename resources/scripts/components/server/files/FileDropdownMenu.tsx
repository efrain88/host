import React, { memo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    faTrashRestore,
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
import useEventListener from '@/plugins/useEventListener';
import compressFiles from '@/api/server/files/compressFiles';
import decompressFiles from '@/api/server/files/decompressFiles';
import isEqual from 'react-fast-compare';
import ChmodFileModal from '@/components/server/files/ChmodFileModal';
import { Dialog } from '@/components/elements/dialog';
import Fade from '@/components/elements/Fade';

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
    const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
    const [showSpinner, setShowSpinner] = useState(false);
    const [modal, setModal] = useState<ModalType | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showPermDeleteConfirmation, setShowPermDeleteConfirmation] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearAndAddHttpError, clearFlashes } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const isTrash = directory && directory.startsWith('/.trash');

    useEventListener(`pterodactyl:files:ctx:${file.key}`, (e: CustomEvent) => {
        setMenuPos(menuPos ? null : { x: e.detail.x, y: e.detail.y });
    });

    useEffect(() => {
        if (!menuPos) return;

        const handleClickOutside = () => setMenuPos(null);
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('contextmenu', handleClickOutside);
        
        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('contextmenu', handleClickOutside);
        };
    }, [menuPos]);

    const closeMenu = () => setMenuPos(null);

    const doDeletion = () => {
        closeMenu();
        clearFlashes('files');
        mutate((files) => files.filter((f) => f.key !== file.key), false);

        renameFiles(uuid, '/', [{ from: join(directory, file.name), to: `/.trash/${file.name}` }]).catch((error) => {
            mutate();
            clearAndAddHttpError({ key: 'files', error });
        });
    };

    const doPermDeletion = () => {
        closeMenu();
        clearFlashes('files');
        mutate((files) => files.filter((f) => f.key !== file.key), false);

        deleteFiles(uuid, directory, [file.name]).catch((error) => {
            mutate();
            clearAndAddHttpError({ key: 'files', error });
        });
    };

    const doRestore = () => {
        closeMenu();
        clearFlashes('files');
        mutate((files) => files.filter((f) => f.key !== file.key), false);

        renameFiles(uuid, '/', [{ from: join(directory, file.name), to: `/${file.name}` }]).catch((error) => {
            mutate();
            clearAndAddHttpError({ key: 'files', error });
        });
    };

    const doCopy = () => {
        closeMenu();
        setShowSpinner(true);
        clearFlashes('files');

        copyFile(uuid, join(directory, file.name))
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doDownload = () => {
        closeMenu();
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
        closeMenu();
        setShowSpinner(true);
        clearFlashes('files');

        compressFiles(uuid, directory, [file.name])
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doUnarchive = () => {
        closeMenu();
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
                title={`Mover a papelera ${file.isFile ? 'el archivo' : 'la carpeta'}`}
                confirm={'Mover a papelera'}
                onConfirmed={doDeletion}
            >
                El archivo <span className="font-semibold text-gray-50">{file.name}</span> se moverá a la papelera.
            </Dialog.Confirm>

            <Dialog.Confirm
                open={showPermDeleteConfirmation}
                onClose={() => setShowPermDeleteConfirmation(false)}
                title={`Eliminar permanentemente ${file.isFile ? 'el archivo' : 'la carpeta'}`}
                confirm={'Eliminar permanentemente'}
                onConfirmed={doPermDeletion}
            >
                No podrás recuperar <span className="font-semibold text-gray-50">{file.name}</span> una vez eliminado.
            </Dialog.Confirm>

            <div 
                className="p-2 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors" 
                onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    setMenuPos(menuPos ? null : { x: e.clientX, y: e.clientY }); 
                }}
            >
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

            {/* Render Context Menu globally via Portal */}
            {menuPos && createPortal(
                <Fade timeout={150} in={!!menuPos} unmountOnExit>
                    <div 
                        className="fixed bg-[#0f0f11] border border-white/10 rounded-xl shadow-2xl p-1 w-52 z-[9999]"
                        style={{ left: Math.min(menuPos.x, window.innerWidth - 220), top: Math.min(menuPos.y, window.innerHeight - 350) }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Can action={'file.update'}>
                            <Row onClick={() => { setModal('rename'); closeMenu(); }} icon={faPencilAlt} title={'Renombrar'} />
                            <Row onClick={() => { setModal('move'); closeMenu(); }} icon={faLevelUpAlt} title={'Mover'} />
                            <Row onClick={() => { setModal('chmod'); closeMenu(); }} icon={faFileCode} title={'Permisos'} />
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
                        
                        <div className="h-px bg-white/5 my-1 mx-2" />
                        
                        {isTrash ? (
                            <Can action={'file.update'}>
                                <Row onClick={doRestore} icon={faTrashRestore} title={'Restaurar a principal'} />
                                <Can action={'file.delete'}>
                                    <Row onClick={() => { setShowPermDeleteConfirmation(true); closeMenu(); }} icon={faTrashAlt} title={'Eliminar Permanente'} $danger />
                                </Can>
                            </Can>
                        ) : (
                            <Can action={'file.delete'}>
                                <Row onClick={() => { setShowConfirmation(true); closeMenu(); }} icon={faTrashAlt} title={'Mover a Papelera'} $danger />
                                <Row onClick={() => { setShowPermDeleteConfirmation(true); closeMenu(); }} icon={faTrashAlt} title={'Eliminar Permanente'} $danger />
                            </Can>
                        )}
                    </div>
                </Fade>,
                document.body
            )}
        </>
    );
};

export default memo(FileDropdownMenu, isEqual);
