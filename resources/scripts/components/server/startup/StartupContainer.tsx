import React, { useCallback, useEffect, useState } from 'react';
import tw from 'twin.macro';
import VariableBox from '@/components/server/startup/VariableBox';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import getServerStartup from '@/api/swr/getServerStartup';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { ServerContext } from '@/state/server';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import Select from '@/components/elements/Select';
import isEqual from 'react-fast-compare';
import Input from '@/components/elements/Input';
import setSelectedDockerImage from '@/api/server/setSelectedDockerImage';
import InputSpinner from '@/components/elements/InputSpinner';
import useFlash from '@/plugins/useFlash';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle, faTerminal, faBoxOpen, faCogs } from '@fortawesome/free-solid-svg-icons';

const ContentBox = styled.div`
    ${tw`bg-[#0a0a0c] border border-white/5 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col mb-6`};
`;

const BoxHeader = styled.div`
    ${tw`flex items-center gap-x-3 p-6 pb-4 border-b border-white/5 bg-[#050505]`};
    h2 {
        ${tw`text-lg font-bold text-white tracking-wide`};
    }
    svg {
        ${tw`text-green-400 text-xl`};
    }
`;

const StartupContainer = () => {
    const [loading, setLoading] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const variables = ServerContext.useStoreState(
        ({ server }) => ({
            variables: server.data!.variables,
            invocation: server.data!.invocation,
            dockerImage: server.data!.dockerImage,
        }),
        isEqual
    );

    const { data, error, isValidating, mutate } = getServerStartup(uuid, {
        ...variables,
        dockerImages: { [variables.dockerImage]: variables.dockerImage },
    });

    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const isCustomImage =
        data &&
        !Object.values(data.dockerImages)
            .map((v) => v.toLowerCase())
            .includes(variables.dockerImage.toLowerCase());

    useEffect(() => {
        mutate();
    }, []);

    useDeepCompareEffect(() => {
        if (!data) return;

        setServerFromState((s) => ({
            ...s,
            invocation: data.invocation,
            variables: data.variables,
        }));
    }, [data]);

    const updateSelectedDockerImage = useCallback(
        (v: React.ChangeEvent<HTMLSelectElement>) => {
            setLoading(true);
            clearFlashes('startup:image');

            const image = v.currentTarget.value;
            setSelectedDockerImage(uuid, image)
                .then(() => setServerFromState((s) => ({ ...s, dockerImage: image })))
                .catch((error) => {
                    console.error(error);
                    clearAndAddHttpError({ key: 'startup:image', error });
                })
                .then(() => setLoading(false));
        },
        [uuid]
    );

    return !data ? (
        !error || (error && isValidating) ? (
            <SpinnerOverlay visible={true} />
        ) : (
            <ServerError title={'Oops!'} message={httpErrorToHuman(error)} onRetry={() => mutate()} />
        )
    ) : (
        <ServerContentBlock title={'Inicio'} showFlashKey={'startup:image'}>
            
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Parámetros de Inicio</h1>
                <p className="text-sm text-neutral-400">Configura cómo arranca tu servidor, cambia la imagen de Docker o modifica las variables de entorno.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 mb-8 items-stretch">
                <ContentBox className="flex-1 mb-0 h-full">
                    <BoxHeader>
                        <FontAwesomeIcon icon={faTerminal} />
                        <h2>Comando de Inicio</h2>
                    </BoxHeader>
                    <div className="p-6 h-full flex flex-col justify-center">
                        <div className="bg-[#050505] border border-green-500/20 rounded-xl p-4 shadow-inner relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50 group-hover:bg-green-400 transition-colors"></div>
                            <p className="font-mono text-green-200/90 text-sm break-all leading-relaxed pl-2">
                                {data.invocation}
                            </p>
                        </div>
                        <p className="text-xs text-neutral-500 mt-4">
                            Este comando es ejecutado automáticamente por el panel al iniciar el servidor. Las variables encerradas en llaves son reemplazadas por sus respectivos valores debajo.
                        </p>
                    </div>
                </ContentBox>

                <ContentBox className="w-full lg:w-1/3 mb-0 h-full shrink-0">
                    <BoxHeader>
                        <FontAwesomeIcon icon={faBoxOpen} />
                        <h2>Imagen Docker</h2>
                    </BoxHeader>
                    <div className="p-6 h-full flex flex-col justify-center">
                        {Object.keys(data.dockerImages).length > 1 && !isCustomImage ? (
                            <>
                                <InputSpinner visible={loading}>
                                    <Select
                                        disabled={Object.keys(data.dockerImages).length < 2}
                                        onChange={updateSelectedDockerImage}
                                        defaultValue={variables.dockerImage}
                                        className="bg-[#050505] border-white/5 h-[42px]"
                                    >
                                        {Object.keys(data.dockerImages).map((key) => (
                                            <option key={data.dockerImages[key]} value={data.dockerImages[key]}>
                                                {key}
                                            </option>
                                        ))}
                                    </Select>
                                </InputSpinner>
                                <p className="text-xs text-neutral-500 mt-4 leading-relaxed">
                                    Esta es una función avanzada que permite seleccionar el entorno virtual (Imagen Docker) donde se ejecutará tu servidor.
                                </p>
                            </>
                        ) : (
                            <>
                                <Input disabled readOnly value={variables.dockerImage} className="bg-[#050505] border-white/5 opacity-70" />
                                {isCustomImage && (
                                    <p className="text-xs text-amber-500/80 mt-4 leading-relaxed">
                                        La imagen Docker de este servidor ha sido configurada manualmente por un administrador y no puede cambiarse desde aquí.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </ContentBox>
            </div>

            <div className="flex items-center gap-x-3 mb-6">
                <FontAwesomeIcon icon={faCogs} className="text-emerald-500 text-xl" />
                <h3 className="text-xl font-bold text-white tracking-tight">Variables de Entorno</h3>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
                {data.variables.map((variable) => (
                    <VariableBox key={variable.envVariable} variable={variable} />
                ))}
            </div>
        </ServerContentBlock>
    );
};

export default StartupContainer;
