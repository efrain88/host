import React, { memo, useCallback } from 'react';
import { useField } from 'formik';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import tw from 'twin.macro';
import Input from '@/components/elements/Input';
import isEqual from 'react-fast-compare';
import classNames from 'classnames';

interface Props {
    isEditable: boolean;
    title: string;
    permissions: string[];
    className?: string;
}

const PermissionTitleBox: React.FC<Props> = memo(({ isEditable, title, permissions, className, children }) => {
    const [{ value }, , { setValue }] = useField<string[]>('permissions');

    const onCheckboxClicked = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.currentTarget.checked) {
                setValue([...value, ...permissions.filter((p) => !value.includes(p))]);
            } else {
                setValue(value.filter((p) => !permissions.includes(p)));
            }
        },
        [permissions, value]
    );

    return (
        <div className={classNames('bg-[#0a0a0c] border border-white/5 rounded-2xl shadow-lg relative overflow-hidden flex flex-col transition-all duration-300 hover:border-purple-500/30', className)}>
            <div className="flex items-center gap-x-3 p-4 border-b border-white/5 bg-[#050505]">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex-1">{title}</h3>
                {isEditable && (
                    <Input
                        type={'checkbox'}
                        checked={permissions.every((p) => value.includes(p))}
                        onChange={onCheckboxClicked}
                        className="w-5 h-5 accent-purple-500 bg-black border border-white/10 rounded transition-all cursor-pointer"
                    />
                )}
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    );
}, isEqual);

export default PermissionTitleBox;
