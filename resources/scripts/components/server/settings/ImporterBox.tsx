import React, { useState } from 'react';
import { Form, Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudDownloadAlt, faKey, faNetworkWired, faFolder, faPlus } from '@fortawesome/free-solid-svg-icons';
import Field from '@/components/elements/Field';
import Select from '@/components/elements/Select';
import { Button } from '@/components/elements/button/index';
import Label from '@/components/elements/Label';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';

const ContentBox = styled.div`
    ${tw`bg-[#0a0a0c] border border-white/5 rounded-2xl shadow-2xl mb-6 relative overflow-hidden flex flex-col`};
`;

const BoxHeader = styled.div`
    ${tw`flex items-center gap-x-3 p-6 pb-4 border-b border-white/5 bg-[#050505]`};
    h2 {
        ${tw`text-lg font-bold text-white tracking-wide`};
    }
    svg {
        ${tw`text-primary-400 text-xl`};
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
    const [testing, setTesting] = useState(false);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        console.log("Importing...", values);
        setTimeout(() => setSubmitting(false), 2000);
    };

    const testConnection = () => {
        setTesting(true);
        setTimeout(() => setTesting(false), 2000);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-[320px] shrink-0">
                <ContentBox className="h-full">
                    <BoxHeader>
                        <FontAwesomeIcon icon={faKey} />
                        <h2>Perfiles</h2>
                    </BoxHeader>
                    <div className="p-6">
                        <div className="flex items-end gap-x-3 mb-6">
                            <div className="flex-1">
                                <Select name={'profile'} className="bg-[#050505] border-white/5 text-sm h-[42px]">
                                    <option value="">Credenciales</option>
                                </Select>
                            </div>
                            <button className="h-[42px] w-[42px] rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors shrink-0">
                                <FontAwesomeIcon icon={faPlus} />
                            </button>
                        </div>
                        <div className="border-t border-white/5 pt-6 text-center">
                            <p className="text-sm text-neutral-400">No se han creado perfiles de credenciales.</p>
                        </div>
                    </div>
                </ContentBox>
            </div>

            <div className="flex-1">
                <ContentBox>
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
                            host: string().required(),
                            port: string().required(),
                            username: string().required(),
                            source: string().required(),
                            destination: string().required(),
                        })}
                    >
                        {({ isSubmitting, values }) => (
                            <Form className="p-6 relative">
                                <SpinnerOverlay visible={isSubmitting || testing} />
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <Field id={'host'} name={'host'} label={'Host'} type={'text'} placeholder={'ej. sftp.server.com'} className="bg-[#050505] border-white/5" />
                                    </div>
                                    <div>
                                        <Field id={'port'} name={'port'} label={'Puerto'} type={'number'} className="bg-[#050505] border-white/5" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <Field id={'username'} name={'username'} label={'Usuario'} type={'text'} className="bg-[#050505] border-white/5" />
                                    </div>
                                    <div>
                                        <Field id={'password'} name={'password'} label={'Contraseña'} type={'password'} className="bg-[#050505] border-white/5" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <Field id={'source'} name={'source'} label={'Directorio de Origen'} type={'text'} className="bg-[#050505] border-white/5 font-mono" />
                                    </div>
                                    <div>
                                        <Field id={'destination'} name={'destination'} label={'Directorio de Destino'} type={'text'} className="bg-[#050505] border-white/5 font-mono" />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-end justify-between gap-6 pt-6 border-t border-white/5 mt-2">
                                    <div className="w-full sm:w-[240px]">
                                        <Label>Modo</Label>
                                        <Select name={'mode'} className="bg-[#050505] border-white/5 h-[42px] mt-1">
                                            <option value="SFTP">SFTP</option>
                                        </Select>
                                    </div>
                                    <div className="flex gap-x-4">
                                        <Button.Text type="button" onClick={testConnection} className="bg-white/5 hover:bg-white/10 text-white border-0 px-6 h-[42px] rounded-xl transition-colors">
                                            Probar Conexión
                                        </Button.Text>
                                        <Button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white border-0 shadow-[0_0_15px_rgba(var(--color-primary-500),0.4)] px-8 h-[42px] rounded-xl font-bold transition-all">
                                            Importar
                                        </Button>
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </ContentBox>
            </div>
        </div>
    );
};
