import React, { useContext, useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { join } from 'pathe';
import { object, string } from 'yup';
import createDirectory from '@/api/server/files/createDirectory';
import { FileObject } from '@/api/server/files/loadDirectory';
import { useFlashKey } from '@/plugins/useFlash';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { WithClassname } from '@/components/types';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderPlus } from '@fortawesome/free-solid-svg-icons';

interface Values {
    directoryName: string;
}

const schema = object().shape({
    directoryName: string().required('Debes indicar un nombre de carpeta válido.'),
});

const generateDirectoryData = (name: string): FileObject => ({
    key: `dir_${name.split('/', 1)[0] ?? name}`,
    name: name.replace(/^(\/*)/,'').split('/', 1)[0] ?? name,
    mode: 'drwxr-xr-x',
    modeBits: '0755',
    size: 0,
    isFile: false,
    isSymlink: false,
    mimetype: '',
    createdAt: new Date(),
    modifiedAt: new Date(),
    isArchiveType: () => false,
    isEditable: () => false,
});

const NewDirectoryDialog = asDialog({
    title: 'Nueva Carpeta',
})(() => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const { mutate } = useFileManagerSwr();
    const { close } = useContext(DialogWrapperContext);
    const { clearAndAddHttpError } = useFlashKey('files:directory-modal');

    useEffect(() => {
        return () => { clearAndAddHttpError(); };
    }, []);

    const submit = ({ directoryName }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        createDirectory(uuid, directory, directoryName)
            .then(() => mutate((data) => [...data, generateDirectoryData(directoryName)], false))
            .then(() => close())
            .catch((error) => {
                setSubmitting(false);
                clearAndAddHttpError(error);
            });
    };

    return (
        <Formik onSubmit={submit} validationSchema={schema} initialValues={{ directoryName: '' }}>
            {({ submitForm, values }) => (
                <>
                    <FlashMessageRender key={'files:directory-modal'} />
                    <Form className="m-0">
                        <Field
                            autoFocus
                            id={'directoryName'}
                            name={'directoryName'}
                            label={'Nombre de la carpeta'}
                            placeholder="mi-carpeta"
                        />
                        <p className="mt-3 text-sm break-all">
                            <span className="text-neutral-400">Se creará en: </span>
                            <code
                                className="px-2 py-0.5 rounded text-violet-300 text-xs"
                                style={{
                                    background: 'rgba(139,92,246,0.1)',
                                    border: '1px solid rgba(139,92,246,0.2)',
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}
                            >
                                /home/container/
                                <span className="text-violet-200">
                                    {join(directory || '/', values.directoryName).replace(/^(\.\.\/)\/+/, '')}
                                </span>
                            </code>
                        </p>
                    </Form>
                    <Dialog.Footer>
                        <button
                            className="px-4 py-2 text-sm font-semibold rounded-xl transition-all text-neutral-400 hover:text-white hover:bg-white/5"
                            onClick={close}
                        >
                            Cancelar
                        </button>
                        <button
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all text-white"
                            style={{
                                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                boxShadow: '0 4px 15px rgba(109,40,217,0.3)',
                            }}
                            onClick={submitForm}
                        >
                            <FontAwesomeIcon icon={faFolderPlus} />
                            Crear carpeta
                        </button>
                    </Dialog.Footer>
                </>
            )}
        </Formik>
    );
});

export default ({ className }: WithClassname) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <NewDirectoryDialog open={open} onClose={setOpen.bind(this, false)} />
            <button
                onClick={setOpen.bind(this, true)}
                className={`flex items-center justify-center gap-x-2 transition-all duration-200 text-xs font-bold h-[42px] px-4 rounded-xl whitespace-nowrap ${className || ''}`}
                style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#a1a1aa',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = '#a1a1aa';
                }}
            >
                <FontAwesomeIcon icon={faFolderPlus} className="w-4 h-4" />
                <span className="hidden lg:inline">Nueva carpeta</span>
            </button>
        </>
    );
};
