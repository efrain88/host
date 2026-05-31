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
import { faWrench, faNetworkWired, faBolt, faExclamationTriangle, faPencilAlt, faServer, faTerminal, faCopy, faPlus } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components/macro';

const TabButton = styled.button<{ $active?: boolean; $danger?: boolean }>`
    ${tw`flex items-center gap-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold`};
    ${(props) => props.$active 
        ? (props.$danger ? tw`bg-red-500/10 text-red-400 border border-red-500/20 shadow-inner` : tw`bg-primary-500/20 text-primary-300 border border-primary-500/30 shadow-inner`) 
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
        ${(props) => props.$danger ? tw`text-red-400 text-xl` : tw`text-primary-400 text-xl`};
    }
`;

export default () => {
    const username = useStoreState((state) => state.user.data!.username);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const sftp = ServerContext.useStoreState((state) => state.server.data!.sftpDetails, isEqual);
    const [activeTab, setActiveTab] = useState<'general' | 'sftp' | 'macros' | 'danger'>('general');

    return (
        <ServerContentBlock title={'Configuración'}>
            <FlashMessageRender byKey={'settings'} css={tw`mb-4`} />
            
            {/* Cabecera de Página */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Ajustes generales</h1>
                <p className="text-sm text-neutral-400">Gestiona la identidad del servidor y consulta información de depuración</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Menú Lateral de Ajustes */}
                <div className="w-full md:w-[240px] shrink-0 flex flex-col gap-y-2">
                    <TabButton $active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
                        <FontAwesomeIcon icon={faPencilAlt} className="w-4 h-4" /> General
                    </TabButton>
                    <TabButton $active={activeTab === 'sftp'} onClick={() => setActiveTab('sftp')}>
                        <FontAwesomeIcon icon={faNetworkWired} className="w-4 h-4" /> Acceso SFTP
                    </TabButton>
                    <TabButton $active={activeTab === 'macros'} onClick={() => setActiveTab('macros')}>
                        <FontAwesomeIcon icon={faBolt} className="w-4 h-4" /> Macros
                    </TabButton>
                    <TabButton $active={activeTab === 'danger'} $danger onClick={() => setActiveTab('danger')}>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4" /> Zona de peligro
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
                                    <h2>Información del servidor</h2>
                                </BoxHeader>
                                <div className="flex flex-col gap-y-4">
                                    <div className="flex items-center justify-between p-4 bg-[#050505] border border-white/5 rounded-xl">
                                        <div className="flex items-center gap-x-3 text-neutral-400">
                                            <FontAwesomeIcon icon={faServer} />
                                            <span className="text-sm font-semibold">Nodo</span>
                                        </div>
                                        <code className="font-mono bg-black border border-white/10 rounded-md py-1 px-3 text-sm text-neutral-300">
                                            {node}
                                        </code>
                                    </div>
                                    <CopyOnClick text={uuid}>
                                        <div className="flex items-center justify-between p-4 bg-[#050505] border border-white/5 rounded-xl cursor-pointer hover:border-primary-500/30 transition-colors">
                                            <div className="flex items-center gap-x-3 text-neutral-400">
                                                <FontAwesomeIcon icon={faNetworkWired} />
                                                <span className="text-sm font-semibold">ID del servidor</span>
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
                                        <h2>Detalles de conexión</h2>
                                    </BoxHeader>
                                    
                                    <div className="mb-6">
                                        <Label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-x-2">
                                            <FontAwesomeIcon icon={faNetworkWired} /> Dirección del Servidor
                                        </Label>
                                        <div className="relative group">
                                            <Input type={'text'} value={`sftp://${ip(sftp.ip)}:${sftp.port}`} readOnly className="pr-10 bg-[#050505]" />
                                            <CopyOnClick text={`sftp://${ip(sftp.ip)}:${sftp.port}`}>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer transition-colors p-1 bg-[#0a0a0c] rounded">
                                                    <FontAwesomeIcon icon={faCopy} />
                                                </div>
                                            </CopyOnClick>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-2 ml-1">Usa esta dirección en tu cliente SFTP</p>
                                    </div>

                                    <div className="mb-6">
                                        <Label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-x-2">
                                            <FontAwesomeIcon icon={faTerminal} /> Nombre de Usuario
                                        </Label>
                                        <div className="relative group">
                                            <Input type={'text'} value={`${username}.${id}`} readOnly className="pr-10 bg-[#050505]" />
                                            <CopyOnClick text={`${username}.${id}`}>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer transition-colors p-1 bg-[#0a0a0c] rounded">
                                                    <FontAwesomeIcon icon={faCopy} />
                                                </div>
                                            </CopyOnClick>
                                        </div>
                                    </div>

                                    <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 mb-8 flex items-center gap-x-3">
                                        <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
                                            <span className="text-primary-400 text-xs font-bold font-serif">i</span>
                                        </div>
                                        <p className="text-sm text-primary-200/80">Tu contraseña SFTP es la misma que usas para acceder a este panel.</p>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                        <div>
                                            <h3 className="text-white font-bold text-sm">Abrir cliente SFTP</h3>
                                            <p className="text-xs text-neutral-400">Abre tu aplicación SFTP predeterminada</p>
                                        </div>
                                        <a href={`sftp://${username}.${id}@${ip(sftp.ip)}:${sftp.port}`}>
                                            <Button.Text className="bg-primary-600 hover:bg-primary-500 text-white border-0 shadow-lg px-6 rounded-xl">
                                                <FontAwesomeIcon icon={faNetworkWired} className="mr-2" />
                                                Conectar
                                            </Button.Text>
                                        </a>
                                    </div>
                                </ContentBox>
                            </Can>
                        </div>
                    )}

                    {activeTab === 'macros' && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Command Macros</h2>
                                    <p className="text-sm text-neutral-400">Crea accesos directos para comandos usados frecuentemente.</p>
                                </div>
                                <Button className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg border-0 px-5">
                                    <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Macro
                                </Button>
                            </div>
                            
                            <div className="bg-[#050505] border border-white/5 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center">
                                <FontAwesomeIcon icon={faBolt} className="text-4xl text-primary-500 mb-4 drop-shadow-[0_0_15px_rgba(var(--color-primary-500),0.8)]" />
                                <h3 className="text-lg font-bold text-white mb-2">No macros configured</h3>
                                <p className="text-sm text-neutral-400 mb-6">Create your first command macro to get started.</p>
                                <Button className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg border-0 px-6">
                                    <FontAwesomeIcon icon={faPlus} className="mr-2" /> Create Macro
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'danger' && (
                        <div className="animate-fade-in">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-red-500 mb-1">Zona de peligro</h2>
                                <p className="text-sm text-neutral-400">Acciones irreversibles y destructivas</p>
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
