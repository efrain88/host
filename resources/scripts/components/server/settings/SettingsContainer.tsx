import React, { useState } from 'react';
import { ServerContext } from '@/state/server';
import { useStoreState } from 'easy-peasy';
import RenameServerBox from '@/components/server/settings/RenameServerBox';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import ReinstallServerBox from '@/components/server/settings/ReinstallServerBox';
import tw from 'twin.macro';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { ip } from '@/lib/formatters';
import { Button } from '@/components/elements/button/index';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWrench, faNetworkWired, faSync, faPencilAlt, faServer, faTerminal, faCopy } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components/macro';

const TabButton = styled.button<{ $active?: boolean; $danger?: boolean }>`
    ${tw`flex items-center gap-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold`};
    ${(props) => props.$active 
        ? (props.$danger ? tw`bg-red-500/10 text-red-400 border border-red-500/20 shadow-inner` : tw`bg-pink-500/20 text-pink-400 border border-pink-500/30 shadow-inner`) 
        : tw`text-neutral-400 hover:bg-white/5 hover:text-neutral-200 border border-transparent`};
`;

const ContentBox = styled.div`
    ${tw`bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-2xl mb-6 relative overflow-hidden`};
`;

const BoxHeader = styled.div<{ $danger?: boolean }>`
    ${tw`flex items-center gap-x-3 mb-6 pb-4 border-b border-white/5`};
    h2 {
        ${tw`text-lg font-bold text-white tracking-wide`};
    }
    svg {
        ${(props) => props.$danger ? tw`text-red-400 text-xl` : tw`text-pink-400 text-xl`};
    }
`;

export default () => {
    const username = useStoreState((state) => state.user.data!.username);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const sftp = ServerContext.useStoreState((state) => state.server.data!.sftpDetails, isEqual);
    const [activeTab, setActiveTab] = useState<'general' | 'sftp' | 'reinstall'>('general');

    return (
        <ServerContentBlock title={'Configuración'}>
            <FlashMessageRender byKey={'settings'} css={tw`mb-4`} />
            
            {/* Cabecera de Página */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Ajustes Generales</h1>
                <p className="text-sm text-neutral-400">Gestiona la identidad del servidor y visualiza información técnica.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Menú Lateral de Ajustes */}
                <div className="w-full md:w-[240px] shrink-0 flex flex-col gap-y-2">
                    <TabButton $active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
                        <FontAwesomeIcon icon={faPencilAlt} className="w-4 h-4" /> Detalles del Servidor
                    </TabButton>
                    <TabButton $active={activeTab === 'sftp'} onClick={() => setActiveTab('sftp')}>
                        <FontAwesomeIcon icon={faNetworkWired} className="w-4 h-4" /> Acceso SFTP
                    </TabButton>
                    <TabButton $active={activeTab === 'reinstall'} $danger onClick={() => setActiveTab('reinstall')}>
                        <FontAwesomeIcon icon={faSync} className="w-4 h-4" /> Reinstalar Servidor
                    </TabButton>
                </div>

                {/* Contenido Principal */}
                <div className="flex-1 min-w-0">
                    {activeTab === 'general' && (
                        <div className="animate-fade-in">
                            <Can action={'settings.rename'}>
                                <RenameServerBox />
                            </Can>

                            <ContentBox>
                                <BoxHeader>
                                    <FontAwesomeIcon icon={faServer} />
                                    <h2>Información Técnica</h2>
                                </BoxHeader>
                                <div className="flex flex-col gap-y-4">
                                    <div className="flex items-center justify-between p-4 bg-[#050505] border border-white/5 rounded-xl">
                                        <div className="flex items-center gap-x-3 text-neutral-400">
                                            <FontAwesomeIcon icon={faServer} />
                                            <span className="text-sm font-semibold">Nodo Asignado</span>
                                        </div>
                                        <code className="font-mono bg-black border border-white/10 rounded-md py-1 px-3 text-sm text-neutral-300">
                                            {node}
                                        </code>
                                    </div>
                                    <CopyOnClick text={uuid}>
                                        <div className="flex items-center justify-between p-4 bg-[#050505] border border-white/5 rounded-xl cursor-pointer hover:border-pink-500/30 transition-colors">
                                            <div className="flex items-center gap-x-3 text-neutral-400">
                                                <FontAwesomeIcon icon={faNetworkWired} />
                                                <span className="text-sm font-semibold">ID del Servidor</span>
                                            </div>
                                            <code className="font-mono bg-black border border-white/10 rounded-md py-1 px-3 text-sm text-neutral-300 truncate max-w-[200px] sm:max-w-md">
                                                {uuid}
                                            </code>
                                        </div>
                                    </CopyOnClick>
                                </div>
                            </ContentBox>
                        </div>
                    )}

                    {activeTab === 'sftp' && (
                        <div className="animate-fade-in">
                            <Can action={'file.sftp'}>
                                <ContentBox>
                                    <BoxHeader>
                                        <FontAwesomeIcon icon={faNetworkWired} />
                                        <h2>Detalles de Conexión SFTP</h2>
                                    </BoxHeader>
                                    
                                    <div className="mb-6">
                                        <Label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-x-2">
                                            <FontAwesomeIcon icon={faNetworkWired} /> Dirección del Servidor
                                        </Label>
                                        <div className="relative group cursor-pointer">
                                            <Input 
                                                type={'text'} 
                                                value={`sftp://${ip(sftp.ip)}:${sftp.port}`} 
                                                readOnly 
                                                className="pr-10 bg-[#050505] blur-sm group-hover:blur-none transition-all duration-300 pointer-events-none select-none group-hover:select-auto group-hover:pointer-events-auto" 
                                            />
                                            <CopyOnClick text={`sftp://${ip(sftp.ip)}:${sftp.port}`}>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer transition-colors p-1 bg-[#0a0a0c] rounded opacity-0 group-hover:opacity-100">
                                                    <FontAwesomeIcon icon={faCopy} />
                                                </div>
                                            </CopyOnClick>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-2 ml-1">Pasa el cursor por encima para revelar la dirección segura.</p>
                                    </div>

                                    <div className="mb-6">
                                        <Label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-x-2">
                                            <FontAwesomeIcon icon={faTerminal} /> Usuario SFTP
                                        </Label>
                                        <div className="relative group cursor-pointer">
                                            <Input 
                                                type={'text'} 
                                                value={`${username}.${id}`} 
                                                readOnly 
                                                className="pr-10 bg-[#050505] blur-sm group-hover:blur-none transition-all duration-300 pointer-events-none select-none group-hover:select-auto group-hover:pointer-events-auto" 
                                            />
                                            <CopyOnClick text={`${username}.${id}`}>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer transition-colors p-1 bg-[#0a0a0c] rounded opacity-0 group-hover:opacity-100">
                                                    <FontAwesomeIcon icon={faCopy} />
                                                </div>
                                            </CopyOnClick>
                                        </div>
                                    </div>

                                    <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4 mb-8 flex items-center gap-x-3">
                                        <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
                                            <span className="text-pink-400 text-xs font-bold font-serif">i</span>
                                        </div>
                                        <p className="text-sm text-pink-200/80">Tu contraseña SFTP es exactamente la misma que usas para iniciar sesión en este panel.</p>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                        <div>
                                            <h3 className="text-white font-bold text-sm">Conectar mediante cliente</h3>
                                            <p className="text-xs text-neutral-400">Abre tu aplicación SFTP predeterminada automáticamente.</p>
                                        </div>
                                        <a href={`sftp://${username}.${id}@${ip(sftp.ip)}:${sftp.port}`}>
                                            <Button.Text className="bg-pink-600 hover:bg-pink-500 text-white border-0 shadow-lg px-6 rounded-xl">
                                                <FontAwesomeIcon icon={faNetworkWired} className="mr-2" />
                                                Abrir Cliente SFTP
                                            </Button.Text>
                                        </a>
                                    </div>
                                </ContentBox>
                            </Can>
                        </div>
                    )}

                    {activeTab === 'reinstall' && (
                        <div className="animate-fade-in">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-red-500 mb-1">Reinstalación de Sistema</h2>
                                <p className="text-sm text-neutral-400">Acciones que afectan el estado base del servidor.</p>
                            </div>
                            <Can action={'settings.reinstall'}>
                                <ReinstallServerBox />
                            </Can>
                        </div>
                    )}
                </div>
            </div>
        </ServerContentBlock>
    );
};
