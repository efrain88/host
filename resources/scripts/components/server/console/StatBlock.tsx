import React from 'react';
import Icon from '@/components/elements/Icon';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import styles from './style.module.css';
import useFitText from 'use-fit-text';
import CopyOnClick from '@/components/elements/CopyOnClick';

interface StatBlockProps {
    title: string;
    copyOnClick?: string;
    color?: string | undefined;
    icon: IconDefinition;
    children: React.ReactNode;
    className?: string;
}

export default ({ title, copyOnClick, icon, color, className, children }: StatBlockProps) => {
    return (
        <CopyOnClick text={copyOnClick}>
            <div className={classNames('group flex items-center bg-[#050505] border border-white/5 hover:border-white/10 rounded-2xl p-5 shadow-xl transition-all duration-300', className)}>
                <div className={classNames('w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-inner transition-colors duration-300', color ? color : 'bg-white/[0.02] group-hover:bg-white/[0.04]')}>
                    <Icon
                        icon={icon}
                        className={classNames('text-xl drop-shadow-sm transition-colors duration-300', {
                            'text-neutral-400 group-hover:text-neutral-300': !color || color.includes('bg-white'),
                            'text-white': color && !color.includes('bg-white'),
                        })}
                    />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.15em] mb-1">{title}</p>
                    <div className="font-bold text-[15px] text-neutral-100 truncate tracking-tight group-hover:text-white transition-colors duration-300">
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
};
