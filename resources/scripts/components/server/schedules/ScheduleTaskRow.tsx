import React, { useState } from 'react';
import { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowCircleDown,
    faClock,
    faCode,
    faFileArchive,
    faPencilAlt,
    faToggleOn,
    faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import deleteScheduleTask from '@/api/server/schedules/deleteScheduleTask';
import { httpErrorToHuman } from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import TaskDetailsModal from '@/components/server/schedules/TaskDetailsModal';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import ConfirmationModal from '@/components/elements/ConfirmationModal';

interface Props {
    schedule: Schedule;
    task: Task;
    isLast?: boolean;
}

const getActionDetails = (action: string): [string, any, string] => {
    switch (action) {
        case 'command':
            return ['Ejecutar Comando', faCode, 'text-sky-400'];
        case 'power':
            return ['Acción de Energía', faToggleOn, 'text-yellow-400'];
        case 'backup':
            return ['Crear Backup', faFileArchive, 'text-violet-400'];
        default:
            return ['Acción Desconocida', faCode, 'text-white'];
    }
};

export default ({ schedule, task, isLast }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, addError } = useFlash();
    const [visible, setVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    const onConfirmDeletion = () => {
        setIsLoading(true);
        clearFlashes('schedules');
        deleteScheduleTask(uuid, schedule.id, task.id)
            .then(() =>
                appendSchedule({
                    ...schedule,
                    tasks: schedule.tasks.filter((t) => t.id !== task.id),
                })
            )
            .catch((error) => {
                console.error(error);
                setIsLoading(false);
                addError({ message: httpErrorToHuman(error), key: 'schedules' });
            });
    };

    const [title, icon, iconColor] = getActionDetails(task.action);

    return (
        <div className={`relative flex flex-col sm:flex-row sm:items-center p-4 sm:p-6 transition-colors hover:bg-white/[0.02] ${!isLast ? 'border-b border-white/5' : ''}`}>
            <SpinnerOverlay visible={isLoading} />
            <TaskDetailsModal
                schedule={schedule}
                task={task}
                visible={isEditing}
                onModalDismissed={() => setIsEditing(false)}
            />
            <ConfirmationModal
                title={'Confirmar eliminación'}
                buttonText={'Eliminar Tarea'}
                onConfirmed={onConfirmDeletion}
                visible={visible}
                onModalDismissed={() => setVisible(false)}
            >
                ¿Estás seguro de que quieres eliminar esta acción? Esto no se puede deshacer.
            </ConfirmationModal>

            {/* Número de Secuencia */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-500/20 to-sky-500/0 hidden sm:block" />

            <div className="flex items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-white/5 border border-white/10 ${iconColor}`}>
                    <FontAwesomeIcon icon={icon} className="text-lg" />
                </div>
                
                <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-bold text-neutral-200 uppercase tracking-wide">{title}</p>
                    {task.payload && (
                        <div className="mt-1.5">
                            {task.action === 'backup' && (
                                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Ignorando archivos:</p>
                            )}
                            <div className="font-mono bg-[#050505] border border-white/10 rounded-md py-1 px-2.5 text-xs inline-block max-w-full truncate text-sky-200">
                                {task.payload}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Badges y Acciones */}
            <div className="mt-4 sm:mt-0 flex items-center flex-wrap gap-3 sm:pl-4">
                {task.continueOnFailure && (
                    <div className="flex items-center px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                        <FontAwesomeIcon icon={faArrowCircleDown} className="mr-1.5" />
                        Ignora Errores
                    </div>
                )}
                {task.sequenceId > 1 && task.timeOffset > 0 && (
                    <div className="flex items-center px-2.5 py-1 bg-white/5 border border-white/10 text-neutral-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                        <FontAwesomeIcon icon={faClock} className="mr-1.5" />
                        {task.timeOffset}s de retraso
                    </div>
                )}

                <div className="flex items-center gap-2 ml-auto sm:ml-4">
                    <Can action={'schedule.update'}>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-sky-500/20 hover:text-sky-400 text-neutral-400"
                            title="Editar"
                        >
                            <FontAwesomeIcon icon={faPencilAlt} className="text-xs" />
                        </button>
                    </Can>
                    <Can action={'schedule.update'}>
                        <button
                            onClick={() => setVisible(true)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-neutral-400"
                            title="Eliminar"
                        >
                            <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                        </button>
                    </Can>
                </div>
            </div>
        </div>
    );
};
