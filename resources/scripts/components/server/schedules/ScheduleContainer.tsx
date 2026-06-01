import React, { useEffect, useState } from 'react';
import getServerSchedules from '@/api/server/schedules/getServerSchedules';
import { ServerContext } from '@/state/server';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { useHistory, useRouteMatch } from 'react-router-dom';
import FlashMessageRender from '@/components/FlashMessageRender';
import ScheduleRow from '@/components/server/schedules/ScheduleRow';
import { httpErrorToHuman } from '@/api/http';
import EditScheduleModal from '@/components/server/schedules/EditScheduleModal';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faPlus } from '@fortawesome/free-solid-svg-icons';
import ServerContentBlock from '@/components/elements/ServerContentBlock';

export default () => {
    const match = useRouteMatch();
    const history = useHistory();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, addError } = useFlash();
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);

    const schedules = ServerContext.useStoreState((state) => state.schedules.data);
    const setSchedules = ServerContext.useStoreActions((actions) => actions.schedules.setSchedules);

    useEffect(() => {
        clearFlashes('schedules');
        getServerSchedules(uuid)
            .then((schedules) => setSchedules(schedules))
            .catch((error) => {
                addError({ message: httpErrorToHuman(error), key: 'schedules' });
                console.error(error);
            })
            .then(() => setLoading(false));
    }, []);

    return (
        <ServerContentBlock title="Automático">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}>
                            <FontAwesomeIcon icon={faClock} className="text-white text-lg" />
                        </div>
                        Tareas Automáticas
                    </h1>
                    <p className="text-neutral-400 mt-1 text-sm">
                        Programa comandos, opciones de encendido o backups recurrentes.
                    </p>
                </div>
                <Can action={'schedule.create'}>
                    <div className="hidden sm:block">
                        <EditScheduleModal visible={visible} onModalDismissed={() => setVisible(false)} />
                        <button
                            onClick={() => setVisible(true)}
                            className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-all"
                            style={{
                                background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                                color: 'white',
                                border: '1px solid rgba(59,130,246,0.4)',
                                boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
                            }}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Crear Tarea
                        </button>
                    </div>
                </Can>
            </div>

            <FlashMessageRender byKey={'schedules'} className="mb-4" />

            {/* Contenedor principal */}
            <div className="relative rounded-2xl p-4 shadow-2xl" style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.05)' }}>
                <SpinnerOverlay visible={!schedules.length && loading} />
                
                <div className="flex flex-col gap-y-3">
                    {schedules.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                            <FontAwesomeIcon icon={faClock} className="text-5xl text-neutral-800 mb-4" />
                            <p className="text-sm text-neutral-500 font-medium">
                                No hay tareas automáticas configuradas para este servidor.
                            </p>
                        </div>
                    ) : (
                        schedules.map((schedule) => (
                            <div
                                key={schedule.id}
                                onClick={(e) => {
                                    e.preventDefault();
                                    history.push(`${match.url}/${schedule.id}`);
                                }}
                            >
                                <ScheduleRow schedule={schedule} />
                            </div>
                        ))
                    )}
                </div>

                {/* Footer de acción (Móvil) */}
                <Can action={'schedule.create'}>
                    <div className="mt-6 flex sm:hidden justify-end pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <button
                            onClick={() => setVisible(true)}
                            className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-all w-full justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                                color: 'white',
                                border: '1px solid rgba(59,130,246,0.4)',
                                boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
                            }}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Crear Tarea
                        </button>
                    </div>
                </Can>
            </div>
        </ServerContentBlock>
    );
};
