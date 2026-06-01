import React from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ScheduleCronRow from '@/components/server/schedules/ScheduleCronRow';

export default ({ schedule }: { schedule: Schedule }) => (
    <div
        className="flex flex-col md:flex-row items-center p-4 rounded-xl transition-all duration-300 cursor-pointer group"
        style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(14,165,233,0.05)';
            e.currentTarget.style.borderColor = 'rgba(14,165,233,0.2)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
        }}
    >
        {/* Icono + Nombre */}
        <div className="flex items-center w-full md:w-1/3 mb-4 md:mb-0 gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
                <FontAwesomeIcon icon={faCalendarAlt} className="text-sky-400" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-neutral-200 truncate group-hover:text-sky-300 transition-colors">
                    {schedule.name}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">
                    Última vez: {schedule.lastRunAt ? format(schedule.lastRunAt, "d MMM 'a las' h:mm a", { locale: es }) : 'Nunca'}
                </p>
            </div>
        </div>

        {/* Cronjob */}
        <div className="w-full md:flex-1 md:mx-4 bg-[#050505] rounded-lg p-2 border border-white/5">
            <ScheduleCronRow cron={schedule.cron} />
        </div>

        {/* Estado + Flecha */}
        <div className="flex items-center justify-between w-full md:w-auto mt-4 md:mt-0 md:ml-4 pl-2">
            <div
                className="px-3 py-1 rounded-lg text-xs font-bold tracking-wide uppercase flex items-center gap-2"
                style={
                    schedule.isProcessing
                        ? { background: 'rgba(234,179,8,0.15)', color: '#facc15', border: '1px solid rgba(234,179,8,0.3)' }
                        : schedule.isActive
                            ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }
                            : { background: 'rgba(255,255,255,0.05)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.1)' }
                }
            >
                <div className={`w-1.5 h-1.5 rounded-full ${schedule.isProcessing ? 'bg-yellow-400 animate-pulse' : schedule.isActive ? 'bg-green-400' : 'bg-neutral-500'}`} />
                {schedule.isProcessing ? 'Procesando' : schedule.isActive ? 'Activo' : 'Inactivo'}
            </div>
            
            <FontAwesomeIcon icon={faChevronRight} className="text-neutral-600 ml-4 hidden md:block group-hover:text-sky-400 transition-colors" />
        </div>
    </div>
);
