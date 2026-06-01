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
    
    // Convertir el nombre base 'cyan-500' a sus clases para aplicar estilos
    const themeBg = `bg-${themeColor}/10`;
    const themeText = `text-${themeColor}`;
    const themeBorderHover = `hover:border-${themeColor}/30`;
    const themeShadowHover = `hover:shadow-[0_0_15px_rgba(var(--tw-color-${themeColor}),0.15)]`;

    return (
        <CopyOnClick text={copyOnClick}>
            <div className={classNames(
                'group flex items-center bg-[#050505] border rounded-xl p-3.5 transition-all duration-500',
                isDanger ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : `border-white/5 ${themeBorderHover} shadow-lg`,
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
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{title}</p>
                    <div className="font-bold text-[13px] text-neutral-100 truncate tracking-tight group-hover:text-white transition-colors duration-500">
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
};
