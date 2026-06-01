import React from 'react';
import { ServerContext } from '@/state/server';
import Input from '@/components/elements/Input';

export const FileActionCheckbox = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <Input
        {...props}
        className={`border-neutral-500 bg-transparent hover:border-neutral-300 transition-colors ${className || ''}`}
    />
);

export default ({ name, className }: { name: string; className?: string }) => {
    const isChecked = ServerContext.useStoreState((state) => state.files.selectedFiles.indexOf(name) >= 0);
    const appendSelectedFile = ServerContext.useStoreActions((actions) => actions.files.appendSelectedFile);
    const removeSelectedFile = ServerContext.useStoreActions((actions) => actions.files.removeSelectedFile);

    return (
        <label className="flex-none flex items-center justify-center cursor-pointer m-0">
            <FileActionCheckbox
                name={'selectedFiles'}
                value={name}
                checked={isChecked}
                type={'checkbox'}
                className={className}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.currentTarget.checked) {
                        appendSelectedFile(name);
                    } else {
                        removeSelectedFile(name);
                    }
                }}
            />
        </label>
    );
};
