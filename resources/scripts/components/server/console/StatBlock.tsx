import React from 'react';
import Icon from '@/components/elements/Icon';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import CopyOnClick from '@/components/elements/CopyOnClick';

interface StatBlockProps {
    title: string;
    copyOnClick?: string;
    color?: string | undefined;
    themeColor?: string;
    icon: IconDefinition;
    children: React.ReactNode;
    className?: string;
}

export default ({ title, copyOnClick, icon, color, themeColor = 'blue-500', className, children }: StatBlockProps) => {
    // Si 'color' está definido (probablemente bg-red-500 o bg-yellow-500 del límite), úsalo
    // De lo contrario, usar el themeColor para el estilo premium base
    const isDanger = color?.includes('bg-red') || color?.includes('bg-yellow');
    
    const colorMaps: Record<string, { bg: string; text: string; border: string; shadow: string }> = {
        'cyan-500': { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'hover:border-cyan-500/30', shadow: 'hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]' },
        'pink-500': { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'hover:border-pink-500/30', shadow: 'hover:shadow-[0_0_15px_rgba(236,72,153,0.15)]' },
        'yellow-500': { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'hover:border-yellow-500/30', shadow: 'hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]' },
        'green-500': { bg: 'bg-green-500/10', text: 'text-green-500', border: 'hover:border-green-500/30', shadow: 'hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]' },
        'blue-500': { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'hover:border-blue-500/30', shadow: 'hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]' },
    };

    const map = colorMaps[themeColor] || colorMaps['blue-500'];
    const themeBg = map.bg;
    const themeText = map.text;
    const themeBorderHover = map.border;
    const themeShadowHover = map.shadow;

    return (
        <CopyOnClick text={copyOnClick}>
            <div className={classNames(
                'group flex items-center bg-[#050505] border rounded-xl p-3.5 transition-all duration-500',
                isDanger ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : `border-white/5 ${themeBorderHover} ${themeShadowHover}`,
                className
            )}>
                <div className={classNames(
                    'w-10 h-10 rounded-lg flex items-center justify-center mr-4 shadow-inner transition-colors duration-500',
                    isDanger ? color : themeBg
                )}>
                    <Icon
                        icon={icon}
                        className={classNames('text-base drop-shadow-md transition-colors duration-500', 
                            isDanger ? 'text-white' : themeText
                        )}
                    />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <p className={classNames("text-[10px] font-bold uppercase tracking-widest mb-1 transition-colors duration-500", themeText)}>{title}</p>
                    <div className={classNames("font-bold text-[13px] truncate tracking-tight transition-colors duration-500", themeText)}>
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
};
