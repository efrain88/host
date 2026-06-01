import React, { useContext, useEffect, useState } from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import Field from '@/components/elements/Field';
import { Form, Formik, FormikHelpers } from 'formik';
import FormikSwitch from '@/components/elements/FormikSwitch';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import ModalContext from '@/context/ModalContext';
import asModal from '@/hoc/asModal';
import Switch from '@/components/elements/Switch';
import ScheduleCheatsheetCards from '@/components/server/schedules/ScheduleCheatsheetCards';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave } from '@fortawesome/free-solid-svg-icons';

interface Props {
    schedule?: Schedule;
}

interface Values {
    name: string;
    dayOfWeek: string;
    month: string;
    dayOfMonth: string;
    hour: string;
    minute: string;
    enabled: boolean;
    onlyWhenOnline: boolean;
}

const EditScheduleModal = ({ schedule }: Props) => {
    const { addError, clearFlashes } = useFlash();
    const { dismiss } = useContext(ModalContext);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const [showCheatsheet, setShowCheetsheet] = useState(false);

    useEffect(() => {
        return () => {
            clearFlashes('schedule:edit');
        };
    }, []);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:edit');
        createOrUpdateSchedule(uuid, {
            id: schedule?.id,
            name: values.name,
            cron: {
                minute: values.minute,
                hour: values.hour,
                dayOfWeek: values.dayOfWeek,
                month: values.month,
                dayOfMonth: values.dayOfMonth,
            },
            onlyWhenOnline: values.onlyWhenOnline,
            isActive: values.enabled,
        })
            .then((schedule) => {
                setSubmitting(false);
                appendSchedule(schedule);
                dismiss();
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                addError({ key: 'schedule:edit', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={
                {
                    name: schedule?.name || '',
                    minute: schedule?.cron.minute || '*/5',
                    hour: schedule?.cron.hour || '*',
                    dayOfMonth: schedule?.cron.dayOfMonth || '*',
                    month: schedule?.cron.month || '*',
                    dayOfWeek: schedule?.cron.dayOfWeek || '*',
                    enabled: schedule?.isActive ?? true,
                    onlyWhenOnline: schedule?.onlyWhenOnline ?? true,
                } as Values
            }
        >
            {({ isSubmitting }) => (
                <Form>
                    <h3 className="text-2xl font-bold mb-6 text-white">{schedule ? 'Editar tarea automática' : 'Crear tarea automática'}</h3>
                    <FlashMessageRender byKey={'schedule:edit'} className="mb-6" />
                    
                    <div className="bg-[#0a0a0d] p-5 rounded-xl border border-white/5 mb-6">
                        <Field
                            name={'name'}
                            label={'Nombre de la tarea'}
                            description={'Un identificador legible para esta tarea.'}
                        />
                        
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
                            <Field name={'minute'} label={'Minuto'} />
                            <Field name={'hour'} label={'Hora'} />
                            <Field name={'dayOfMonth'} label={'Día (Mes)'} />
                            <Field name={'month'} label={'Mes'} />
                            <Field name={'dayOfWeek'} label={'Día (Semana)'} />
                        </div>
                        <p className="text-neutral-500 text-[11px] mt-3">
                            El sistema admite el uso de sintaxis Cronjob estándar para definir cuándo deben ejecutarse las tareas. 
                            Utiliza los campos anteriores para especificar el horario.
                        </p>
                    </div>

                    <div className="mb-6 bg-[#0a0a0d] border border-white/5 p-5 rounded-xl">
                        <Switch
                            name={'show_cheatsheet'}
                            description={'Muestra ejemplos comunes de sintaxis Cron.'}
                            label={'Mostrar Hoja de Trucos (Cheatsheet)'}
                            defaultChecked={showCheatsheet}
                            onChange={() => setShowCheetsheet((s) => !s)}
                        />
                        {showCheatsheet && (
                            <div className="block md:flex w-full mt-4 p-4 bg-[#050505] rounded-lg border border-white/5">
                                <ScheduleCheatsheetCards />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-[#0a0a0d] border border-white/5 p-5 rounded-xl">
                            <FormikSwitch
                                name={'onlyWhenOnline'}
                                description={'Solo ejecutar si el servidor está encendido.'}
                                label={'Solo Estando Online'}
                            />
                        </div>
                        <div className="bg-[#0a0a0d] border border-white/5 p-5 rounded-xl">
                            <FormikSwitch
                                name={'enabled'}
                                description={'Esta tarea se ejecutará si está activada.'}
                                label={'Tarea Activada'}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
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
                            {schedule ? 'Guardar Cambios' : 'Crear Tarea'}
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default asModal<Props>()(EditScheduleModal);
