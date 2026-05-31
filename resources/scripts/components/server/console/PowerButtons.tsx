import React, { useEffect, useState } from 'react';
import Can from '@/components/elements/Can';
import { ServerContext } from '@/state/server';
import { PowerAction } from '@/components/server/console/ServerConsoleContainer';
import { Dialog } from '@/components/elements/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faSync, faSquare } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';

interface PowerButtonProps {
    className?: string;
}

export default ({ className }: PowerButtonProps) => {
    const [open, setOpen] = useState(false);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const killable = status === 'stopping';
    const onButtonClick = (
        action: PowerAction | 'kill-confirmed',
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ): void => {
        e.preventDefault();
        if (action === 'kill') {
            return setOpen(true);
        }

        if (instance) {
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    useEffect(() => {
        if (status === 'offline') {
            setOpen(false);
        }
    }, [status]);

    return (
        <div className={classNames('flex items-center space-x-2', className)}>
            <Dialog.Confirm
                open={open}
                hideCloseIcon
                onClose={() => setOpen(false)}
                title={'Forcibly Stop Process'}
                confirm={'Continue'}
                onConfirmed={onButtonClick.bind(this, 'kill-confirmed')}
            >
                Forcibly stopping a server can lead to data corruption.
            </Dialog.Confirm>
            <Can action={'control.start'}>
                <button
                    disabled={status !== 'offline'}
                    onClick={onButtonClick.bind(this, 'start')}
                    className="w-10 h-10 flex items-center justify-center bg-[#1a1b23] hover:bg-[#2a2b36] border border-white/5 rounded-lg text-neutral-300 hover:text-white transition-all disabled:opacity-50"
                >
                    <FontAwesomeIcon icon={faPlay} className="text-sm" />
                </button>
            </Can>
            <Can action={'control.restart'}>
                <button 
                    disabled={!status} 
                    onClick={onButtonClick.bind(this, 'restart')}
                    className="w-10 h-10 flex items-center justify-center bg-[#1a1b23] hover:bg-[#2a2b36] border border-white/5 rounded-lg text-neutral-300 hover:text-white transition-all disabled:opacity-50"
                >
                    <FontAwesomeIcon icon={faSync} className="text-sm" />
                </button>
            </Can>
            <Can action={'control.stop'}>
                <button
                    disabled={status === 'offline'}
                    onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
                    className="w-10 h-10 flex items-center justify-center bg-red-500 hover:bg-red-400 border border-red-400/20 rounded-lg text-white transition-all disabled:opacity-50"
                >
                    <FontAwesomeIcon icon={faSquare} className="text-sm" />
                </button>
            </Can>
        </div>
    );
};
