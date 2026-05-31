import React from 'react';
import classNames from 'classnames';
import styles from '@/components/server/console/style.module.css';

interface ChartBlockProps {
    title: string;
    legend?: React.ReactNode;
    children: React.ReactNode;
}

export default ({ title, legend, children }: ChartBlockProps) => (
    <div className="bg-[#050505] border border-white/5 rounded-xl overflow-hidden shadow-lg hover:border-white/10 transition-colors group">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider group-hover:text-neutral-300 transition-colors">
                {title}
            </h3>
            {legend && <div className="text-xs flex items-center">{legend}</div>}
        </div>
        <div className="p-3">
            {children}
        </div>
    </div>
);
