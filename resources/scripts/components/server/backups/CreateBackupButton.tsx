import React, { useEffect, useState } from 'react';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import { Field as FormikField, Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { boolean, object, string } from 'yup';
import Field from '@/components/elements/Field';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import useFlash from '@/plugins/useFlash';
import createServerBackup from '@/api/server/backups/createServerBackup';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';
import { Textarea } from '@/components/elements/Input';
import getServerBackups from '@/api/swr/getServerBackups';
import { ServerContext } from '@/state/server';
import FormikSwitch from '@/components/elements/FormikSwitch';
import Can from '@/components/elements/Can';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

interface Values {
    name: string;
    ignored: string;
    isLocked: boolean;
}

const ModalContent = ({ ...props }: RequiredModalProps) => {
    const { isSubmitting } = useFormikContext<Values>();

    return (
        <Modal {...props} showSpinnerOverlay={isSubmitting}>
            <Form className="m-0">
                <FlashMessageRender byKey={'backups:create'} className="mb-4" />
                <h2 className="text-2xl font-bold mb-6 text-white">Crear copia de seguridad</h2>
                
                <div className="bg-[#0a0a0d] p-5 rounded-xl border border-white/5 mb-6">
                    <Field
                        name={'name'}
                        label={'Nombre del Backup'}
                        description={'Opcional. Un nombre para identificar fácilmente esta copia de seguridad.'}
                    />
                </div>

                <div className="mb-6 bg-[#0a0a0d] p-5 rounded-xl border border-white/5">
                    <FormikFieldWrapper
                        name={'ignored'}
                        label={'Archivos y Directorios Ignorados'}
                        description={`
                            Ingresa los archivos o carpetas a ignorar. Déjalo en blanco para usar el archivo .pteroignore. 
                            Se admite el uso de comodines (wildcards) y se puede negar una regla anteponiendo un signo de exclamación (!).
                        `}
                    >
                        <FormikField as={Textarea} name={'ignored'} rows={4} className="font-mono text-sm" />
                    </FormikFieldWrapper>
                </div>

                <Can action={'backup.delete'}>
                    <div className="mb-8 bg-[#0a0a0d] p-5 rounded-xl border border-white/5">
                        <FormikSwitch
                            name={'isLocked'}
                            label={'Bloquear Backup'}
                            description={'Evita que esta copia de seguridad sea eliminada manual o automáticamente hasta que se desbloquee explícitamente.'}
                        />
                    </div>
                </Can>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={props.onDismissed}
                        className="px-4 py-2 text-sm font-semibold rounded-xl transition-all text-neutral-400 hover:text-white hover:bg-white/5"
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-xl transition-all text-white disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }}
                        disabled={isSubmitting}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Iniciar Backup
                    </button>
                </div>
            </Form>
        </Modal>
    );
};

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [visible, setVisible] = useState(false);
    const { mutate } = getServerBackups();

    useEffect(() => {
        clearFlashes('backups:create');
    }, [visible]);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('backups:create');
        createServerBackup(uuid, values)
            .then((backup) => {
                mutate(
                    (data) => ({ ...data, items: data.items.concat(backup), backupCount: data.backupCount + 1 }),
                    false
                );
                setVisible(false);
            })
            .catch((error) => {
                clearAndAddHttpError({ key: 'backups:create', error });
                setSubmitting(false);
            });
    };

    return (
        <>
            {visible && (
                <Formik
                    onSubmit={submit}
                    initialValues={{ name: '', ignored: '', isLocked: false }}
                    validationSchema={object().shape({
                        name: string().max(191),
                        ignored: string(),
                        isLocked: boolean(),
                    })}
                >
                    <ModalContent appear visible={visible} onDismissed={() => setVisible(false)} />
                </Formik>
            )}
            <button
                onClick={() => setVisible(true)}
                className="flex items-center justify-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-all w-full sm:w-auto"
                style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
                    color: 'white',
                    border: '1px solid rgba(168,85,247,0.4)',
                    boxShadow: '0 4px 15px rgba(139,92,246,0.3)',
                }}
            >
                <FontAwesomeIcon icon={faPlus} />
                Crear Backup
            </button>
        </>
    );
};
