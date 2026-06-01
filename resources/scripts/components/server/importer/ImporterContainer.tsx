import React, { useState } from 'react';
import { Form, Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudDownloadAlt, faKey, faPlus } from '@fortawesome/free-solid-svg-icons';
import Field from '@/components/elements/Field';
import Select from '@/components/elements/Select';
import { Button } from '@/components/elements/button/index';
import Label from '@/components/elements/Label';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';

import http from '@/api/http';
import { ServerContext } from '@/state/server';

const ContentBox = styled.div`
    ${tw`bg-[#0a0a0c] border border-white/5 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col`};
`;

const BoxHeader = styled.div`
    ${tw`flex items-center gap-x-3 p-6 pb-4 border-b border-white/5 bg-[#050505]`};
    h2 {
        ${tw`text-lg font-bold text-white tracking-wide`};
    }
    svg {
        ${tw`text-cyan-400 text-xl`};
    }
`;

interface Values {
    host: string;
    port: number;
    username: string;
    password?: string;
    source: string;
    destination: string;
    mode: 'SFTP';
}

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const setServer = ServerContext.useStoreActions((actions) => actions.server.setServer);
    
    const { addFlash, clearFlashes } = useFlash();
    const [testing, setTesting] = useState(false);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('importer');
        
        http.post(`/api/client/servers/${uuid}/importer/run`, values)
            .then((data) => {
                addFlash({ type: 'success', key: 'importer', message: data.data.message || 'Importación iniciada correctamente.' });
                // Bloquear la UI localmente sin necesidad de recargar la página
                // @ts-ignore
                setServer({ ...server, status: 'importing' });
            })
            .catch((error) => {
                const msg = error.response?.data?.message || 'Ocurrió un error inesperado al procesar la solicitud.';
                addFlash({ type: 'error', key: 'importer', message: msg });
            })
            .finally(() => setSubmitting(false));
    };

    const testConnection = (values: Values) => {
        if (!values.host || !values.username || !values.password) {
            clearFlashes('importer');
            addFlash({ type: 'error', key: 'importer', message: 'Debes rellenar los campos Host, Usuario y Contraseña para probar.' });
            return;
        }

        clearFlashes('importer');
        setTesting(true);
        
        http.post(`/api/client/servers/${uuid}/importer/test`, values)
            .then((data) => {
                addFlash({ type: 'success', key: 'importer', message: data.data.message || 'Conexión exitosa al servidor remoto.' });
            })
            .catch((error) => {
                const msg = error.response?.data?.message || 'Error de conexión. Verifica que los datos sean correctos.';
                addFlash({ type: 'error', key: 'importer', message: msg });
            })
            .finally(() => setTesting(false));
    };

    return (
        <ServerContentBlock title={'Importar Servidor'}>
            <FlashMessageRender byKey={'importer'} css={tw`mb-4`} />
            
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Importar Servidor</h1>
                <p className="text-sm text-neutral-400">Transfiere archivos y configuraciones desde un servidor externo mediante SFTP.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                <div className="w-full lg:w-[320px] shrink-0">
                    <ContentBox className="h-full">
                        <BoxHeader>
                            <FontAwesomeIcon icon={faKey} />
                            <h2>Perfiles de Servidores</h2>
                        </BoxHeader>
                        <div className="p-6">
                            <div className="flex items-end gap-x-3 mb-6">
                                <div className="flex-1">
                                    <Select name={'profile'} className="bg-[#050505] border-white/5 text-sm h-[42px]">
                                        <option value="">Seleccionar Servidor...</option>
                                    </Select>
                                </div>
                                <button className="h-[42px] w-[42px] rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors shrink-0">
                                    <FontAwesomeIcon icon={faPlus} />
                                </button>
                            </div>
                            <div className="border-t border-white/5 pt-6 text-center">
                                <p className="text-sm text-neutral-400">No hay perfiles de credenciales guardados.</p>
                            </div>
                        </div>
                    </ContentBox>
                </div>

                <div className="flex-1">
                    <ContentBox className="h-full">
                        <BoxHeader>
                            <FontAwesomeIcon icon={faCloudDownloadAlt} />
                            <h2>Ajustes de Importación</h2>
                        </BoxHeader>
                        <Formik
                            onSubmit={submit}
                            initialValues={{
                                host: '',
                                port: 22,
                                username: '',
                                password: '',
                                source: '/',
                                destination: '/',
                                mode: 'SFTP',
                            }}
                            validationSchema={object().shape({
                                host: string().required('Requerido'),
                                port: string().required('Requerido'),
                                username: string().required('Requerido'),
                                source: string().required('Requerido'),
                                destination: string().required('Requerido'),
                            })}
                        >
                            {({ isSubmitting, values, setFieldValue }) => (
                                <Form className="p-6 relative flex-1 flex flex-col">
                                    <SpinnerOverlay visible={isSubmitting || testing} />
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                        <div className="group relative">
                                            <Field 
                                                id={'host'} 
                                                name={'host'} 
                                                label={'Host (IP/Dominio)'} 
                                                type={'text'} 
                                                placeholder={'ej. sftp.server.com'} 
                                                className="bg-[#050505] border-white/5 blur-sm transition-all duration-300 group-hover:blur-none focus:blur-none"
                                                onChange={(e: any) => {
                                                    let val = e.target.value;
                                                    
                                                    // Si pegan algo con sftp:// o :puerto, limpiarlo y asignar puerto
                                                    if (val.includes('sftp://') || val.includes('ftp://') || val.includes(':')) {
                                                        let cleanHost = val.replace(/^sftp:\/\//i, '').replace(/^ftp:\/\//i, '');
                                                        if (cleanHost.includes(':')) {
                                                            const parts = cleanHost.split(':');
                                                            setFieldValue('host', parts[0]);
                                                            setFieldValue('port', parts[1].replace(/[^0-9]/g, '') || '22');
                                                        } else {
                                                            setFieldValue('host', cleanHost);
                                                        }
                                                    } else {
                                                        setFieldValue('host', val);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="group relative">
                                            <Field id={'port'} name={'port'} label={'Puerto'} type={'number'} className="bg-[#050505] border-white/5 blur-sm transition-all duration-300 group-hover:blur-none focus:blur-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                        <div className="group relative">
                                            <Field id={'username'} name={'username'} label={'Usuario SFTP'} type={'text'} className="bg-[#050505] border-white/5 blur-sm transition-all duration-300 group-hover:blur-none focus:blur-none" />
                                        </div>
                                        <div className="group relative">
                                            <Field id={'password'} name={'password'} label={'Contraseña'} type={'password'} className="bg-[#050505] border-white/5 blur-sm transition-all duration-300 group-hover:blur-none focus:blur-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <Field id={'source'} name={'source'} label={'Directorio de Origen (Servidor Remoto)'} type={'text'} className="bg-[#050505] border-white/5 font-mono" />
                                        </div>
                                        <div>
                                            <Field id={'destination'} name={'destination'} label={'Directorio de Destino (Servidor Local)'} type={'text'} className="bg-[#050505] border-white/5 font-mono" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-end justify-between gap-6 pt-6 border-t border-white/5 mt-auto">
                                        <div className="w-full sm:w-[240px]">
                                            <Label>Protocolo</Label>
                                            <Select name={'mode'} className="bg-[#050505] border-white/5 h-[42px] mt-1">
                                                <option value="SFTP">SFTP (Seguro)</option>
                                            </Select>
                                        </div>
                                        <div className="flex gap-x-4">
                                            <Button.Text type="button" onClick={() => testConnection(values)} className="bg-white/5 hover:bg-white/10 text-white border-0 px-6 h-[42px] rounded-xl transition-colors font-semibold">
                                                Probar Conexión
                                            </Button.Text>
                                            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white border-0 shadow-[0_0_15px_rgba(20,184,166,0.4)] px-8 h-[42px] rounded-xl font-bold transition-all">
                                                Importar Datos
                                            </Button>
                                        </div>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </ContentBox>
                </div>
            </div>
        </ServerContentBlock>
    );
};
