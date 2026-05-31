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
            <div className={classNames('group flex items-center bg-[#0a0a0c] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/[0.05] hover:border-primary-500/40 rounded-2xl p-5 shadow-lg hover:shadow-primary-500/10 transition-all duration-500', className)}>
                <div className={classNames('w-14 h-14 rounded-2xl flex items-center justify-center mr-5 shadow-inner transition-colors duration-500', color ? color : 'bg-primary-500/10 group-hover:bg-primary-500/20')}>
                    <Icon
                        icon={icon}
                        className={classNames('text-2xl drop-shadow-md transition-colors duration-500', {
                            'text-primary-400 group-hover:text-primary-300': !color || color.includes('bg-white'),
                            'text-white': color && !color.includes('bg-white'),
                        })}
                    />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-1.5">{title}</p>
                    <div className="font-black text-lg text-neutral-100 truncate tracking-tight group-hover:text-white transition-colors duration-500">
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
};
