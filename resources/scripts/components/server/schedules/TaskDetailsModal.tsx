import React, { useContext, useEffect } from 'react';
import { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import { Field as FormikField, Form, Formik, FormikHelpers, useField } from 'formik';
import { ServerContext } from '@/state/server';
import createOrUpdateScheduleTask from '@/api/server/schedules/createOrUpdateScheduleTask';
import { httpErrorToHuman } from '@/api/http';
import Field from '@/components/elements/Field';
import FlashMessageRender from '@/components/FlashMessageRender';
import { boolean, number, object, string } from 'yup';
import useFlash from '@/plugins/useFlash';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Label from '@/components/elements/Label';
import { Textarea } from '@/components/elements/Input';
import Select from '@/components/elements/Select';
import ModalContext from '@/context/ModalContext';
import asModal from '@/hoc/asModal';
import FormikSwitch from '@/components/elements/FormikSwitch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave } from '@fortawesome/free-solid-svg-icons';

interface Props {
    schedule: Schedule;
    task?: Task;
}

interface Values {
    action: string;
    payload: string;
    timeOffset: string;
    continueOnFailure: boolean;
}

const schema = object().shape({
    action: string().required().oneOf(['command', 'power', 'backup']),
    payload: string().when('action', {
        is: (v) => v !== 'backup',
        then: string().required('Debe proporcionar un valor para esta acción.'),
        otherwise: string(),
    }),
    continueOnFailure: boolean(),
    timeOffset: number()
        .typeError('El retraso debe ser un número válido entre 0 y 900.')
        .required('Debe proporcionar un tiempo de retraso.')
        .min(0, 'El retraso debe ser de al menos 0 segundos.')
        .max(900, 'El retraso debe ser menor a 900 segundos.'),
});

const ActionListener = () => {
    const [{ value }, { initialValue: initialAction }] = useField<string>('action');
    const [, { initialValue: initialPayload }, { setValue, setTouched }] = useField<string>('payload');

    useEffect(() => {
        if (value !== initialAction) {
            setValue(value === 'power' ? 'start' : '');
            setTouched(false);
        } else {
            setValue(initialPayload || '');
            setTouched(false);
        }
    }, [value]);

    return null;
};

const TaskDetailsModal = ({ schedule, task }: Props) => {
    const { dismiss } = useContext(ModalContext);
    const { clearFlashes, addError } = useFlash();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);

    useEffect(() => {
        return () => {
            clearFlashes('schedule:task');
        };
    }, []);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:task');
        if (backupLimit === 0 && values.action === 'backup') {
            setSubmitting(false);
            addError({
                message: "No se puede crear una tarea de backup porque el límite de backups de este servidor es 0.",
                key: 'schedule:task',
            });
        } else {
            createOrUpdateScheduleTask(uuid, schedule.id, task?.id, values)
                .then((task) => {
                    let tasks = schedule.tasks.map((t) => (t.id === task.id ? task : t));
                    if (!schedule.tasks.find((t) => t.id === task.id)) {
                        tasks = [...tasks, task];
                    }

                    appendSchedule({ ...schedule, tasks });
                    dismiss();
                })
                .catch((error) => {
                    console.error(error);
                    setSubmitting(false);
                    addError({ message: httpErrorToHuman(error), key: 'schedule:task' });
                });
        }
    };

    return (
        <Formik
            onSubmit={submit}
            validationSchema={schema}
            initialValues={{
                action: task?.action || 'command',
                payload: task?.payload || '',
                timeOffset: task?.timeOffset.toString() || '0',
                continueOnFailure: task?.continueOnFailure || false,
            }}
        >
            {({ isSubmitting, values }) => (
                <Form className="m-0">
                    <FlashMessageRender byKey={'schedule:task'} className="mb-4" />
                    <h2 className="text-2xl font-bold mb-6 text-white">{task ? 'Editar Acción' : 'Crear Acción'}</h2>
                    
                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                        <div className="w-full md:w-1/2">
                            <Label>Tipo de Acción</Label>
                            <ActionListener />
                            <FormikFieldWrapper name={'action'}>
                                <FormikField as={Select} name={'action'}>
                                    <option value={'command'}>Enviar comando</option>
                                    <option value={'power'}>Acción de energía</option>
                                    <option value={'backup'}>Crear backup</option>
                                </FormikField>
                            </FormikFieldWrapper>
                        </div>
                        <div className="w-full md:w-1/2">
                            <Field
                                name={'timeOffset'}
                                label={'Retraso (en segundos)'}
                                description={
                                    'Tiempo de espera antes de ejecutar esta tarea después de la anterior. No aplica si es la primera tarea.'
                                }
                            />
                        </div>
                    </div>

                    <div className="mb-6 bg-[#0a0a0d] border border-white/5 p-5 rounded-xl">
                        {values.action === 'command' ? (
                            <div>
                                <Label>Comando a enviar</Label>
                                <FormikFieldWrapper name={'payload'} description="Introduce el comando que deseas ejecutar en la consola del servidor.">
                                    <FormikField as={Textarea} name={'payload'} rows={3} className="font-mono text-sm" />
                                </FormikFieldWrapper>
                            </div>
                        ) : values.action === 'power' ? (
                            <div>
                                <Label>Acción a realizar</Label>
                                <FormikFieldWrapper name={'payload'}>
                                    <FormikField as={Select} name={'payload'}>
                                        <option value={'start'}>Iniciar el servidor</option>
                                        <option value={'restart'}>Reiniciar el servidor</option>
                                        <option value={'stop'}>Detener el servidor</option>
                                        <option value={'kill'}>Forzar apagado (Kill)</option>
                                    </FormikField>
                                </FormikFieldWrapper>
                            </div>
                        ) : (
                            <div>
                                <Label>Archivos Ignorados (Opcional)</Label>
                                <FormikFieldWrapper
                                    name={'payload'}
                                    description={
                                        'Opcional. Incluye los archivos/carpetas a excluir en este backup. Por defecto usa .pteroignore. Si llegas al límite de backups, el más antiguo rotará.'
                                    }
                                >
                                    <FormikField as={Textarea} name={'payload'} rows={3} className="font-mono text-sm" />
                                </FormikFieldWrapper>
                            </div>
                        )}
                    </div>

                    <div className="mb-8 bg-[#0a0a0d] border border-white/5 p-5 rounded-xl">
                        <FormikSwitch
                            name={'continueOnFailure'}
                            description={'Si esta acción falla, las siguientes acciones de la lista aún se ejecutarán.'}
                            label={'Continuar en caso de fallo'}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={dismiss}
                            className="px-4 py-2 text-sm font-semibold rounded-xl transition-all text-neutral-400 hover:text-white hover:bg-white/5"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-xl transition-all text-white disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}
                            disabled={isSubmitting}
                        >
                            <FontAwesomeIcon icon={faSave} />
                            {task ? 'Guardar Cambios' : 'Añadir Acción'}
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default asModal<Props>()(TaskDetailsModal);
