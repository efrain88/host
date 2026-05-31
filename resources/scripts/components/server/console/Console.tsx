import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { ITerminalOptions, Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { SearchAddon } from 'xterm-addon-search';
import { SearchBarAddon } from 'xterm-addon-search-bar';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { Unicode11Addon } from 'xterm-addon-unicode11';
import { ScrollDownHelperAddon } from '@/plugins/XtermScrollDownHelperAddon';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import { theme as th } from 'twin.macro';
import useEventListener from '@/plugins/useEventListener';
import { debounce } from 'debounce';
import { usePersistedState } from '@/plugins/usePersistedState';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import classNames from 'classnames';
import { ChevronDoubleRightIcon } from '@heroicons/react/solid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay, faShareAlt, faTrashAlt, faHistory } from '@fortawesome/free-solid-svg-icons';

import 'xterm/css/xterm.css';
import styles from './style.module.css';

const theme = {
    background: th`colors.black`.toString(),
    cursor: 'transparent',
    black: th`colors.black`.toString(),
    red: '#E54B4B',
    green: '#9ECE58',
    yellow: '#FAED70',
    blue: '#396FE2',
    magenta: '#BB80B3',
    cyan: '#2DDAFD',
    white: '#d0d0d0',
    brightBlack: 'rgba(255, 255, 255, 0.2)',
    brightRed: '#FF5370',
    brightGreen: '#C3E88D',
    brightYellow: '#FFCB6B',
    brightBlue: '#82AAFF',
    brightMagenta: '#C792EA',
    brightCyan: '#89DDFF',
    brightWhite: '#ffffff',
    selection: '#FAF089',
};

const terminalProps: ITerminalOptions = {
    disableStdin: true,
    cursorStyle: 'underline',
    allowTransparency: true,
    fontSize: 12,
    fontFamily: th('fontFamily.mono'),
    rows: 40,
    theme: theme,
};

export default () => {
    const TERMINAL_PRELUDE = '\u001b[1m\u001b[33mcontainer@pterodactyl~ \u001b[0m';
    const ref = useRef<HTMLDivElement>(null);
    const terminal = useMemo(() => new Terminal({ ...terminalProps }), []);
    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    const searchBar = new SearchBarAddon({ searchAddon });
    const webLinksAddon = new WebLinksAddon();
    const unicode11Addon = new Unicode11Addon();
    const scrollDownHelperAddon = new ScrollDownHelperAddon();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const [canSendCommands] = usePermissions(['control.console']);
    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const user = useStoreState((state) => state.user.data);
    const [history, setHistory] = usePersistedState<any[]>(`${serverId}:command_history`, []);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isPaused, setIsPaused] = useState(false);
    const isPausedRef = useRef(isPaused);
    const [showHistory, setShowHistory] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    const uploadToMclogs = async () => {
        let logContent = '';
        const buffer = terminal.buffer.active;
        for (let i = 0; i < buffer.length; i++) {
            const line = buffer.getLine(i);
            if (line) {
                logContent += line.translateToString(true) + '\n';
            }
        }
        if (!logContent.trim()) return;
        try {
            const res = await fetch('https://api.mclo.gs/1/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `content=${encodeURIComponent(logContent)}`,
            });
            const json = await res.json();
            if (json.success) {
                window.open(json.url, '_blank');
            }
        } catch (e) {
            console.error('Failed to upload logs', e);
        }
    };

    // SearchBarAddon has hardcoded z-index: 999 :(
    const zIndex = `
    .xterm-search-bar__addon {
        z-index: 10;
    }`;

    const handleConsoleOutput = (line: string, prelude = false) => {
        if (isPausedRef.current) return;
        let formattedLine = line.replace(/(?:\r\n|\r|\n)$/im, '');
        // Magic coloring for Minecraft logs [HH:MM:SS INFO]
        formattedLine = formattedLine.replace(/^\[(\d{2}:\d{2}:\d{2}) ([^\]]+)\]/g, (match, time, level) => {
            const color = level === 'ERROR' ? '\u001b[31m' : level === 'WARN' ? '\u001b[33m' : '\u001b[36m';
            return `\u001b[90m[\u001b[35m${time}\u001b[90m]\u001b[0m ${color}[${level}]\u001b[0m`;
        });
        terminal.writeln((prelude ? TERMINAL_PRELUDE : '') + formattedLine + '\u001b[0m');
    };

    const handleTransferStatus = (status: string) => {
        switch (status) {
            // Sent by either the source or target node if a failure occurs.
            case 'failure':
                terminal.writeln(TERMINAL_PRELUDE + 'Transfer has failed.\u001b[0m');
                return;
        }
    };

    const handleDaemonErrorOutput = (line: string) =>
        terminal.writeln(
            TERMINAL_PRELUDE + '\u001b[1m\u001b[41m' + line.replace(/(?:\r\n|\r|\n)$/im, '') + '\u001b[0m'
        );

    const handlePowerChangeEvent = (state: string) =>
        terminal.writeln(TERMINAL_PRELUDE + 'Server marked as ' + state + '...\u001b[0m');

    const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            const newIndex = Math.min(historyIndex + 1, history!.length - 1);

            setHistoryIndex(newIndex);
            e.currentTarget.value = history![newIndex]?.cmd || '';

            e.preventDefault();
        }

        if (e.key === 'ArrowDown') {
            const newIndex = Math.max(historyIndex - 1, -1);

            setHistoryIndex(newIndex);
            e.currentTarget.value = history![newIndex]?.cmd || '';
        }

        const command = e.currentTarget.value;
        if (e.key === 'Enter' && command.length > 0) {
            const newEntry = { cmd: command, user: user?.username || 'Usuario', time: new Date().toLocaleTimeString() };
            setHistory((prevHistory) => [newEntry, ...prevHistory!].slice(0, 32));
            setHistoryIndex(-1);

            instance && instance.send('send command', command);
            e.currentTarget.value = '';
        }
    };

    useEffect(() => {
        if (connected && ref.current && !terminal.element) {
            terminal.loadAddon(fitAddon);
            terminal.loadAddon(searchAddon);
            terminal.loadAddon(searchBar);
            terminal.loadAddon(webLinksAddon);
            terminal.loadAddon(unicode11Addon);
            terminal.loadAddon(scrollDownHelperAddon);

            terminal.open(ref.current);

            // Activate Unicode 11 for proper emoji and special character width handling
            terminal.unicode.activeVersion = '11';

            fitAddon.fit();
            searchBar.addNewStyle(zIndex);

            // Add support for capturing keys
            terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                    document.execCommand('copy');
                    return false;
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                    e.preventDefault();
                    searchBar.show();
                    return false;
                } else if (e.key === 'Escape') {
                    searchBar.hidden();
                }
                return true;
            });
        }
    }, [terminal, connected]);

    useEventListener(
        'resize',
        debounce(() => {
            if (terminal.element) {
                fitAddon.fit();
            }
        }, 100)
    );

    useEffect(() => {
        const listeners: Record<string, (s: string) => void> = {
            [SocketEvent.STATUS]: handlePowerChangeEvent,
            [SocketEvent.CONSOLE_OUTPUT]: handleConsoleOutput,
            [SocketEvent.INSTALL_OUTPUT]: handleConsoleOutput,
            [SocketEvent.TRANSFER_LOGS]: handleConsoleOutput,
            [SocketEvent.TRANSFER_STATUS]: handleTransferStatus,
            [SocketEvent.DAEMON_MESSAGE]: (line) => handleConsoleOutput(line, true),
            [SocketEvent.DAEMON_ERROR]: handleDaemonErrorOutput,
        };

        if (connected && instance) {
            // Do not clear the console if the server is being transferred.
            if (!isTransferring) {
                terminal.clear();
            }

            Object.keys(listeners).forEach((key: string) => {
                instance.addListener(key, listeners[key]);
            });
            instance.send(SocketRequest.SEND_LOGS);
        }

        return () => {
            if (instance) {
                Object.keys(listeners).forEach((key: string) => {
                    instance.removeListener(key, listeners[key]);
                });
            }
        };
    }, [connected, instance]);

    return (
        <div className="relative rounded-xl overflow-hidden border border-white/5 shadow-2xl bg-[#050505] flex flex-col">
            {/* Mac Title Bar */}
            <div className="bg-[#0a0a0c] border-b border-white/[0.02] flex items-center px-4 py-2.5">
                <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.3)]"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.3)]"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.3)]"></div>
                </div>
                <div className="flex-1 text-center text-[10px] font-bold text-neutral-600 tracking-widest uppercase">
                    Consola del Servidor
                </div>
                <div className="flex space-x-3 text-neutral-500">
                    <button onClick={() => setIsPaused(!isPaused)} className="hover:text-primary-400 transition-colors outline-none" title={isPaused ? "Reanudar Registros" : "Pausar Registros"}>
                        <FontAwesomeIcon icon={isPaused ? faPlay : faPause} className="w-3 h-3" />
                    </button>
                    <button onClick={uploadToMclogs} className="hover:text-blue-400 transition-colors outline-none" title="Compartir en mclo.gs">
                        <FontAwesomeIcon icon={faShareAlt} className="w-3 h-3" />
                    </button>
                    <button onClick={() => terminal.clear()} className="hover:text-red-400 transition-colors outline-none" title="Limpiar Consola">
                        <FontAwesomeIcon icon={faTrashAlt} className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className={classNames(styles.terminal, 'relative p-2')}>
                <SpinnerOverlay visible={!connected} size={'large'} />
                <div
                    className={classNames(styles.container, styles.overflows_container, { 'rounded-b': !canSendCommands })}
                >
                    <div className={'h-full'}>
                        <div id={styles.terminal} ref={ref} />
                    </div>
                </div>
            </div>

            {canSendCommands && (
                <div className={classNames('relative bg-[#080808] border-t border-white/[0.02] p-2', styles.overflows_container)}>
                    <input
                        ref={inputRef}
                        className={classNames('peer w-full bg-transparent text-white font-mono text-sm px-8 py-2 outline-none placeholder-neutral-600', styles.command_input)}
                        type={'text'}
                        placeholder={'Escribe un comando...'}
                        aria-label={'Console command input.'}
                        disabled={!instance || !connected}
                        onKeyDown={handleCommandKeyDown}
                        autoCorrect={'off'}
                        autoCapitalize={'none'}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500 peer-focus:text-primary-400 peer-focus:animate-pulse">
                        <ChevronDoubleRightIcon className={'w-4 h-4'} />
                    </div>
                    <button 
                        onClick={() => setShowHistory(!showHistory)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-primary-400 transition-colors outline-none"
                        title="Historial de comandos"
                    >
                        <FontAwesomeIcon icon={faHistory} className="w-4 h-4" />
                    </button>
                    {showHistory && history && history.length > 0 && (
                        <div className="absolute right-4 bottom-full mb-2 w-72 bg-[#0a0a0c] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                            <div className="bg-white/5 px-3 py-2 border-b border-white/10 text-xs font-bold text-neutral-400 uppercase tracking-widest flex justify-between">
                                <span>Comando</span>
                                <span>Ejecutado por</span>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {history.map((entry, idx) => (
                                    <div 
                                        key={idx} 
                                        className="px-3 py-2 hover:bg-white/5 cursor-pointer text-xs flex justify-between items-center transition-colors border-b border-white/[0.02] last:border-0"
                                        onClick={() => {
                                            if (inputRef.current) {
                                                inputRef.current.value = entry.cmd || entry;
                                                inputRef.current.focus();
                                            }
                                            setShowHistory(false);
                                        }}
                                    >
                                        <span className="font-mono text-primary-400 truncate w-3/5" title={entry.cmd || entry}>{entry.cmd || entry}</span>
                                        <div className="flex flex-col items-end w-2/5">
                                            <span className="text-white truncate">{entry.user || 'Desconocido'}</span>
                                            <span className="text-neutral-500 text-[9px]">{entry.time || 'Anterior'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
