import React, { useState } from 'react';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { object, string } from 'yup';
import createServerDatabase from '@/api/server/databases/createServerDatabase';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

interface Values {
    databaseName: string;
    connectionsFrom: string;
}

const schema = object().shape({
    databaseName: string()
        .required('Debes proporcionar un nombre para la base de datos.')
        .min(3, 'El nombre debe tener al menos 3 caracteres.')
        .max(48, 'El nombre no debe exceder 48 caracteres.')
        .matches(
            /^[\w\-.]{3,48}$/,
            'El nombre solo puede contener caracteres alfanuméricos, guiones bajos, guiones y/o puntos.'
        ),
    connectionsFrom: string().matches(/^[\w\-/.%:]+$/, 'Debe proporcionar una dirección de host válida.'),
});

const CreateDatabaseDialog = asDialog({
    title: 'Nueva base de datos',
})(() => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { addError, clearFlashes } = useFlash();
    const appendDatabase = ServerContext.useStoreActions((actions) => actions.databases.appendDatabase);
    const { close } = React.useContext(DialogWrapperContext);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('database:create');
        createServerDatabase(uuid, {
            databaseName: values.databaseName,
            connectionsFrom: values.connectionsFrom || '%',
        })
            .then((database) => {
                appendDatabase(database);
                close();
            })
            .catch((error) => {
                addError({ key: 'database:create', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{ databaseName: '', connectionsFrom: '' }}
            validationSchema={schema}
        >
            {({ isSubmitting, submitForm }) => (
                <>
                    <FlashMessageRender byKey={'database:create'} className="mb-6" />
                    <Form className="m-0">
                        <Field
                            type={'string'}
                            id={'database_name'}
                            name={'databaseName'}
                            label={'Nombre de la base de datos'}
                            description={'Un nombre descriptivo para tu instancia.'}
                        />
                        <div className="mt-6">
                            <Field
                                type={'string'}
                                id={'connections_from'}
                                name={'connectionsFrom'}
                                label={'Conexiones desde (Endpoint/Host)'}
                                description={
                                    'Desde dónde se permitirán las conexiones. Déjalo en blanco para permitir conexiones desde cualquier lugar (%)'
                                }
                            />
                        </div>
                    </Form>
                    <Dialog.Footer>
                        <button
                            className="px-4 py-2 text-sm font-semibold rounded-xl transition-all text-neutral-400 hover:text-white hover:bg-white/5"
                            onClick={close}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all text-white disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }}
                            onClick={submitForm}
                            disabled={isSubmitting}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Crear Base de Datos
                        </button>
                    </Dialog.Footer>
                </>
            )}
        </Formik>
    );
});

export default () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <CreateDatabaseDialog open={open} onClose={() => setOpen(false)} />
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-all w-full sm:w-auto"
                style={{
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: 'white',
                    border: '1px solid rgba(139,92,246,0.4)',
                    boxShadow: '0 4px 15px rgba(124,58,237,0.3)',
                }}
            >
                <FontAwesomeIcon icon={faPlus} />
                Nueva Base de Datos
            </button>
        </>
    );
};
