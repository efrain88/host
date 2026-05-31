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
            <div className={classNames('flex items-center bg-[#0a0a0a] border border-white/5 rounded-xl p-4 transition-colors hover:bg-white/[0.02]', className)}>
                <div className={classNames('w-12 h-12 rounded-lg flex items-center justify-center mr-4', color || 'bg-white/5')}>
                    <Icon
                        icon={icon}
                        className={classNames('text-lg', {
                            'text-neutral-400': !color || color === 'bg-white/5',
                            'text-white': color && color !== 'bg-white/5',
                        })}
                    />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">{title}</p>
                    <div className="font-bold text-sm text-neutral-200 truncate">
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
};
