import React, { memo, useState } from 'react';
import { ServerEggVariable } from '@/api/server/types';
import { usePermissions } from '@/plugins/usePermissions';
import InputSpinner from '@/components/elements/InputSpinner';
import Input from '@/components/elements/Input';
import Switch from '@/components/elements/Switch';
import { debounce } from 'debounce';
import updateStartupVariable from '@/api/server/updateStartupVariable';
import useFlash from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import getServerStartup from '@/api/swr/getServerStartup';
import Select from '@/components/elements/Select';
import isEqual from 'react-fast-compare';
import { ServerContext } from '@/state/server';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

const ContentBox = styled.div`
    ${tw`bg-[#0a0a0c] border border-white/5 rounded-2xl shadow-lg relative overflow-hidden flex flex-col hover:border-white/10 transition-colors`};
`;

const BoxHeader = styled.div`
    ${tw`flex items-center justify-between p-4 pb-3 border-b border-white/5 bg-[#050505]`};
    h2 {
        ${tw`text-sm font-bold text-white uppercase tracking-wider`};
    }
`;

interface Props {
    variable: ServerEggVariable;
}

const VariableBox = ({ variable }: Props) => {
    const FLASH_KEY = `server:startup:${variable.envVariable}`;

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [loading, setLoading] = useState(false);
    const [canEdit] = usePermissions(['startup.update']);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { mutate } = getServerStartup(uuid);

    const setVariableValue = debounce((value: string) => {
        setLoading(true);
        clearFlashes(FLASH_KEY);

        updateStartupVariable(uuid, variable.envVariable, value)
            .then(([response, invocation]) =>
                mutate(
                    (data) => ({
                        ...data,
                        invocation,
                        variables: (data.variables || []).map((v) =>
                            v.envVariable === response.envVariable ? response : v
                        ),
                    }),
                    false
                )
            )
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ error, key: FLASH_KEY });
            })
            .then(() => setLoading(false));
    }, 500);

    const useSwitch = variable.rules.some(
        (v) => v === 'boolean' || v === 'in:0,1' || v === 'in:1,0' || v === 'in:true,false' || v === 'in:false,true'
    );
    const isStringSwitch = variable.rules.some((v) => v === 'string');
    const selectValues = variable.rules.find((v) => v.startsWith('in:'))?.split(',') || [];

    return (
        <ContentBox>
            <BoxHeader>
                <div className="flex items-center gap-x-2">
                    {!variable.isEditable && (
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold py-1 px-2 rounded-full uppercase tracking-wider">
                            Solo Lectura
                        </span>
                    )}
                    <h2>{variable.name}</h2>
                </div>
            </BoxHeader>
            <div className="p-4 flex-1 flex flex-col">
                <FlashMessageRender byKey={FLASH_KEY} className='mb-2 md:mb-4' />
                <InputSpinner visible={loading}>
                    {useSwitch ? (
                        <>
                            <Switch
                                readOnly={!canEdit || !variable.isEditable}
                                name={variable.envVariable}
                                defaultChecked={
                                    isStringSwitch ? variable.serverValue === 'true' : variable.serverValue === '1'
                                }
                                onChange={() => {
                                    if (canEdit && variable.isEditable) {
                                        if (isStringSwitch) {
                                            setVariableValue(variable.serverValue === 'true' ? 'false' : 'true');
                                        } else {
                                            setVariableValue(variable.serverValue === '1' ? '0' : '1');
                                        }
                                    }
                                }}
                            />
                        </>
                    ) : (
                        <>
                            {selectValues.length > 0 ? (
                                <>
                                    <Select
                                        onChange={(e) => setVariableValue(e.target.value)}
                                        name={variable.envVariable}
                                        defaultValue={variable.serverValue ?? variable.defaultValue}
                                        disabled={!canEdit || !variable.isEditable}
                                        className="bg-[#050505] border-white/5 focus:border-green-500/50"
                                    >
                                        {selectValues.map((selectValue) => (
                                            <option
                                                key={selectValue.replace('in:', '')}
                                                value={selectValue.replace('in:', '')}
                                            >
                                                {selectValue.replace('in:', '')}
                                            </option>
                                        ))}
                                    </Select>
                                </>
                            ) : (
                                <>
                                    <Input
                                        onKeyUp={(e) => {
                                            if (canEdit && variable.isEditable) {
                                                setVariableValue(e.currentTarget.value);
                                            }
                                        }}
                                        readOnly={!canEdit || !variable.isEditable}
                                        name={variable.envVariable}
                                        defaultValue={variable.serverValue ?? ''}
                                        placeholder={variable.defaultValue}
                                        className="bg-[#050505] border-white/5 focus:border-green-500/50"
                                    />
                                </>
                            )}
                        </>
                    )}
                </InputSpinner>

                <p className='mt-4 text-xs text-neutral-400 leading-relaxed'>{variable.description}</p>
            </div>
        </ContentBox>
    );
};

export default memo(VariableBox, isEqual);
