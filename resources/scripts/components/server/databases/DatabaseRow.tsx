import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faEye, faTrashAlt, faServer, faUser, faTerminal } from '@fortawesome/free-solid-svg-icons';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { object, string } from 'yup';
import FlashMessageRender from '@/components/FlashMessageRender';
import { ServerContext } from '@/state/server';
import deleteServerDatabase from '@/api/server/databases/deleteServerDatabase';
import { httpErrorToHuman } from '@/api/http';
import RotatePasswordButton from '@/components/server/databases/RotatePasswordButton';
import Can from '@/components/elements/Can';
import { ServerDatabase } from '@/api/server/databases/getServerDatabases';
import useFlash from '@/plugins/useFlash';
import Button from '@/components/elements/Button';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';

interface Props {
    database: ServerDatabase;
    className?: string;
}

// ── MODAL: BORRAR BASE DE DATOS ──
const DeleteDatabaseDialog = asDialog({
    title: 'Confirmar Eliminación',
})(({ database }: { database: ServerDatabase }) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { addError, clearFlashes } = useFlash();
    const removeDatabase = ServerContext.useStoreActions((actions) => actions.databases.removeDatabase);
    const { close } = React.useContext(DialogWrapperContext);

    const schema = object().shape({
        confirm: string()
            .required('Debes proporcionar el nombre de la base de datos.')
            .oneOf([database.name.split('_', 2)[1], database.name], 'El nombre no coincide.'),
    });

    const submit = (values: { confirm: string }, { setSubmitting }: FormikHelpers<{ confirm: string }>) => {
        clearFlashes();
        deleteServerDatabase(uuid, database.id)
            .then(() => {
                close();
                setTimeout(() => removeDatabase(database.id), 150);
            })
            .catch((error) => {
                console.error(error);
                setSubmitting(false);
                addError({ key: 'database:delete', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik onSubmit={submit} initialValues={{ confirm: '' }} validationSchema={schema} isInitialValid={false}>
            {({ isSubmitting, isValid, submitForm }) => (
                <>
                    <FlashMessageRender byKey={'database:delete'} className="mb-6" />
                    <p className="text-sm text-neutral-300 mb-6 leading-relaxed">
                        Eliminar una base de datos es una acción permanente y no se puede deshacer. Esto borrará la base de datos <strong className="text-red-400">{database.name}</strong> y todos sus datos.
                    </p>
                    <Form className="m-0">
                        <Field
                            type={'text'}
                            id={'confirm_name'}
                            name={'confirm'}
                            label={'Confirma el nombre de la base de datos'}
                            description={'Escribe el nombre de la base de datos para confirmar la eliminación.'}
                        />
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
                            style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                            onClick={submitForm}
                            disabled={!isValid || isSubmitting}
                        >
                            <FontAwesomeIcon icon={faTrashAlt} />
                            Eliminar BD
                        </button>
                    </Dialog.Footer>
                </>
            )}
        </Formik>
    );
});

// ── MODAL: VER DETALLES DE CONEXIÓN ──
const ConnectionDetailsDialog = asDialog({
    title: 'Detalles de Conexión',
})(({ database }: { database: ServerDatabase }) => {
    const { close } = React.useContext(DialogWrapperContext);
    const appendDatabase = ServerContext.useStoreActions((actions) => actions.databases.appendDatabase);

    const jdbcConnectionString = `jdbc:mysql://${database.username}${
        database.password ? `:${encodeURIComponent(database.password)}` : ''
    }@${database.connectionString}/${database.name}`;

    const FieldDisplay = ({ label, value, copyable = true, hidden = false }: { label: string, value: string, copyable?: boolean, hidden?: boolean }) => (
        <div className="mb-4 bg-[#0a0a0d] p-3 rounded-xl border border-white/5 relative group">
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">{label}</label>
            {copyable ? (
                <CopyOnClick text={value} showInNotification={!hidden}>
                    <p className="text-sm font-mono text-neutral-200 cursor-pointer break-all group-hover:text-violet-300 transition-colors">
                        {hidden ? '••••••••••••••••' : value}
                    </p>
                </CopyOnClick>
            ) : (
                <p className="text-sm font-mono text-neutral-200 break-all">{value}</p>
            )}
        </div>
    );

    return (
        <>
            <FlashMessageRender byKey={'database-connection-modal'} className="mb-6" />
            <div className="mt-2">
                <FieldDisplay label="Endpoint (Host)" value={database.connectionString} />
                <FieldDisplay label="Conexiones desde" value={database.allowConnectionsFrom} copyable={false} />
                <FieldDisplay label="Usuario (Username)" value={database.username} />
                <Can action={'database.view_password'}>
                    <FieldDisplay label="Contraseña" value={database.password} hidden={true} />
                </Can>
                <FieldDisplay label="JDBC Connection String" value={jdbcConnectionString} hidden={true} />
            </div>
            
            <Dialog.Footer>
                <Can action={'database.update'}>
                    <div className="mr-auto">
                        <RotatePasswordButton databaseId={database.id} onUpdate={appendDatabase} />
                    </div>
                </Can>
                <button
                    className="px-4 py-2 text-sm font-semibold rounded-xl transition-all text-white"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                    onClick={close}
                >
                    Cerrar
                </button>
            </Dialog.Footer>
        </>
    );
});

// ── COMPONENTE PRINCIPAL DE LA FILA ──
export default ({ database, className }: Props) => {
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [connectionVisible, setConnectionVisible] = useState(false);

    return (
        <>
            <DeleteDatabaseDialog open={deleteVisible} onClose={() => setDeleteVisible(false)} database={database} />
            <ConnectionDetailsDialog open={connectionVisible} onClose={() => setConnectionVisible(false)} database={database} />

            <div
                className={`flex flex-col md:flex-row items-center p-4 rounded-xl transition-all duration-300 group ${className || ''}`}
                style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139,92,246,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                }}
            >
                {/* Icono + Nombre */}
                <div className="flex items-center w-full md:w-1/3 mb-4 md:mb-0 gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                         style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <FontAwesomeIcon icon={faDatabase} className="text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <CopyOnClick text={database.name}>
                            <p className="text-base font-bold text-neutral-200 truncate cursor-pointer hover:text-violet-300 transition-colors">
                                {database.name}
                            </p>
                        </CopyOnClick>
                        <p className="text-xs text-neutral-500 mt-0.5">Base de datos</p>
                    </div>
                </div>

                {/* Detalles (Host, Usuario) */}
                <div className="flex-1 w-full grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faServer} className="text-neutral-500 text-xs" />
                        <div className="min-w-0">
                            <CopyOnClick text={database.connectionString}>
                                <p className="text-sm font-mono text-neutral-300 truncate cursor-pointer hover:text-cyan-300 transition-colors">
                                    {database.connectionString}
                                </p>
                            </CopyOnClick>
                            <p className="text-[10px] uppercase font-bold text-neutral-600 mt-0.5">Host / Endpoint</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faUser} className="text-neutral-500 text-xs" />
                        <div className="min-w-0">
                            <CopyOnClick text={database.username}>
                                <p className="text-sm font-mono text-neutral-300 truncate cursor-pointer hover:text-amber-300 transition-colors">
                                    {database.username}
                                </p>
                            </CopyOnClick>
                            <p className="text-[10px] uppercase font-bold text-neutral-600 mt-0.5">Usuario</p>
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto justify-end shrink-0 pl-4">
                    <button
                        onClick={() => setConnectionVisible(true)}
                        className="flex items-center justify-center w-9 h-9 rounded-lg transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#d4d4d8' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56,189,248,0.15)'; e.currentTarget.style.color = '#38bdf8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#d4d4d8'; }}
                        title="Ver detalles de conexión"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </button>

                    <Can action={'database.delete'}>
                        <button
                            onClick={() => setDeleteVisible(true)}
                            className="flex items-center justify-center w-9 h-9 rounded-lg transition-all"
                            style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                            title="Eliminar base de datos"
                        >
                            <FontAwesomeIcon icon={faTrashAlt} />
                        </button>
                    </Can>
                </div>
            </div>
        </>
    );
};
