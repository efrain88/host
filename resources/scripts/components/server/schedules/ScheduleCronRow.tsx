import React from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';

interface Props {
    cron: Schedule['cron'];
    className?: string;
}

const ScheduleCronRow = ({ cron, className }: Props) => (
    <div className={`flex items-center justify-between gap-2 ${className || ''}`}>
        <div className="flex-1 text-center bg-[#0a0a0d] rounded px-1 py-1.5 border border-white/5">
            <p className="font-mono text-sm font-bold text-sky-300">{cron.minute}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-0.5">Minuto</p>
        </div>
        <div className="flex-1 text-center bg-[#0a0a0d] rounded px-1 py-1.5 border border-white/5">
            <p className="font-mono text-sm font-bold text-sky-300">{cron.hour}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-0.5">Hora</p>
        </div>
        <div className="flex-1 text-center bg-[#0a0a0d] rounded px-1 py-1.5 border border-white/5">
            <p className="font-mono text-sm font-bold text-sky-300">{cron.dayOfMonth}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-0.5">Día(M)</p>
        </div>
        <div className="flex-1 text-center bg-[#0a0a0d] rounded px-1 py-1.5 border border-white/5">
            <p className="font-mono text-sm font-bold text-sky-300">{cron.month}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-0.5">Mes</p>
        </div>
        <div className="flex-1 text-center bg-[#0a0a0d] rounded px-1 py-1.5 border border-white/5">
            <p className="font-mono text-sm font-bold text-sky-300">{cron.dayOfWeek}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-0.5">Día(S)</p>
        </div>
    </div>
);

export default ScheduleCronRow;
