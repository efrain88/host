import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import getServerSchedule from '@/api/server/schedules/getServerSchedule';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import EditScheduleModal from '@/components/server/schedules/EditScheduleModal';
import NewTaskButton from '@/components/server/schedules/NewTaskButton';
import DeleteScheduleButton from '@/components/server/schedules/DeleteScheduleButton';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import ScheduleTaskRow from '@/components/server/schedules/ScheduleTaskRow';
import isEqual from 'react-fast-compare';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ScheduleCronRow from '@/components/server/schedules/ScheduleCronRow';
import RunScheduleButton from '@/components/server/schedules/RunScheduleButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faPen, faChevronLeft } from '@fortawesome/free-solid-svg-icons';

interface Params {
    id: string;
}

export default () => {
    const history = useHistory();
    const { id: scheduleId } = useParams<Params>();

    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    const schedule = ServerContext.useStoreState(
        (st) => st.schedules.data.find((s) => s.id === Number(scheduleId)),
        isEqual
    );
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    useEffect(() => {
        if (schedule?.id === Number(scheduleId)) {
            setIsLoading(false);
            return;
        }

        clearFlashes('schedules');
        getServerSchedule(uuid, Number(scheduleId))
            .then((schedule) => appendSchedule(schedule))
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ error, key: 'schedules' });
            })
            .then(() => setIsLoading(false));
    }, [scheduleId]);

    const toggleEditModal = useCallback(() => {
        setShowEditModal((s) => !s);
    }, []);

    return (
        <div className="flex flex-col w-full relative">
            <SpinnerOverlay visible={!schedule || isLoading} />
            
            <FlashMessageRender byKey={'schedules'} className="mb-4" />

            {schedule && !isLoading && (
                <>
                    {/* Botón Volver */}
                    <button
                        onClick={() => history.push(`/server/${id}/schedules`)}
                        className="flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition-colors mb-4 w-max"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} />
                        Volver a Tareas
                    </button>

                    <div className="rounded-2xl shadow-2xl bg-[#0a0a0d] border border-white/5 overflow-hidden">
                        {/* Cabecera del Schedule */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-gradient-to-b from-[#111116] to-[#0a0a0d] border-b border-white/5">
                            <div className="flex-1 min-w-0 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                     style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
                                    <FontAwesomeIcon icon={faCalendarAlt} className="text-sky-400 text-xl" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="flex items-center text-white text-2xl font-bold gap-3 truncate">
                                        {schedule.name}
                                        <div
                                            className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5"
                                            style={
                                                schedule.isProcessing
                                                    ? { background: 'rgba(234,179,8,0.15)', color: '#facc15' }
                                                    : schedule.isActive
                                                        ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80' }
                                                        : { background: 'rgba(255,255,255,0.05)', color: '#a1a1aa' }
                                            }
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${schedule.isProcessing ? 'bg-yellow-400 animate-pulse' : schedule.isActive ? 'bg-green-400' : 'bg-neutral-500'}`} />
                                            {schedule.isProcessing ? 'Procesando' : schedule.isActive ? 'Activo' : 'Inactivo'}
                                        </div>
                                    </h3>
                                    <div className="flex flex-col sm:flex-row sm:items-center mt-2 text-xs text-neutral-400 gap-2 sm:gap-6">
                                        <p>
                                            <span className="font-semibold text-neutral-300">Última ejecución:</span>{' '}
                                            {schedule.lastRunAt ? format(schedule.lastRunAt, "d MMM 'a las' h:mm a", { locale: es }) : 'N/A'}
                                        </p>
                                        <p className="hidden sm:block text-neutral-600">•</p>
                                        <p>
                                            <span className="font-semibold text-neutral-300">Próxima ejecución:</span>{' '}
                                            {schedule.nextRunAt ? format(schedule.nextRunAt, "d MMM 'a las' h:mm a", { locale: es }) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
                                <Can action={'schedule.update'}>
                                    <button
                                        onClick={toggleEditModal}
                                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all w-full sm:w-auto"
                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#d4d4d8' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#d4d4d8'; }}
                                    >
                                        <FontAwesomeIcon icon={faPen} className="text-xs" />
                                        Editar
                                    </button>
                                </Can>
                            </div>
                        </div>

                        {/* Fila del Cron */}
                        <div className="p-4 bg-[#08080a] border-b border-white/5">
                            <ScheduleCronRow cron={schedule.cron} className="max-w-3xl mx-auto" />
                        </div>

                        {/* Botón de Nueva Tarea */}
                        <div className="p-4 flex justify-between items-center bg-[#0d0d12] border-b border-white/5">
                            <h4 className="text-sm font-bold text-neutral-300 uppercase tracking-widest ml-2">Lista de Tareas ({schedule.tasks.length})</h4>
                            <Can action={'schedule.update'}>
                                <NewTaskButton schedule={schedule} />
                            </Can>
                        </div>

                        {/* Lista de Tareas */}
                        <div className="bg-[#0a0a0d] flex flex-col">
                            {schedule.tasks.length > 0
                                ? schedule.tasks
                                      .sort((a, b) =>
                                          a.sequenceId === b.sequenceId ? 0 : a.sequenceId > b.sequenceId ? 1 : -1
                                      )
                                      .map((task, index) => (
                                          <ScheduleTaskRow
                                              key={`${schedule.id}_${task.id}`}
                                              task={task}
                                              schedule={schedule}
                                              isLast={index === schedule.tasks.length - 1}
                                          />
                                      ))
                                : (
                                    <div className="py-12 text-center">
                                        <p className="text-neutral-500 text-sm">No hay acciones configuradas para esta tarea automática.</p>
                                    </div>
                                )}
                        </div>
                    </div>

                    <EditScheduleModal visible={showEditModal} schedule={schedule} onModalDismissed={toggleEditModal} />
                    
                    {/* Botones inferiores */}
                    <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <Can action={'schedule.delete'}>
                            <DeleteScheduleButton
                                scheduleId={schedule.id}
                                onDeleted={() => history.push(`/server/${id}/schedules`)}
                            />
                        </Can>
                        {schedule.tasks.length > 0 && (
                            <Can action={'schedule.update'}>
                                <RunScheduleButton schedule={schedule} />
                            </Can>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
