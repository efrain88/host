import React, { useEffect, useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { ServerContext } from '@/state/server';
import useFlash from '@/plugins/useFlash';
import { getServerSplits, createServerSplit, deleteServerSplit, SplitterResponse } from '@/api/server/splitter';
import Spinner from '@/components/elements/Spinner';
import Button from '@/components/elements/Button';
import { Form, Formik } from 'formik';
import { object, string, number } from 'yup';
import Field from '@/components/elements/Field';
import tw from 'twin.macro';
import GreyRowBox from '@/components/elements/GreyRowBox';
import FlashMessageRender from '@/components/FlashMessageRender';
import TitledGreyBox from '@/components/elements/TitledGreyBox';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [data, setData] = useState<SplitterResponse | null>(null);
    const { addFlash, clearFlashes } = useFlash();

    const loadData = () => {
        getServerSplits(uuid)
            .then(setData)
            .catch((error) => {
                console.error(error);
                addFlash({ type: 'error', title: 'Error', message: 'No se pudo cargar la información de los divisores.' });
            });
    };

    useEffect(() => {
        clearFlashes();
        loadData();
    }, [uuid]);

    if (!data) {
        return (
            <PageContentBlock title={'Divisores'}>
                <Spinner size={'large'} centered />
            </PageContentBlock>
        );
    }

    const submit = (values: any, { setSubmitting, resetForm }: any) => {
        clearFlashes('splitter');
        createServerSplit(uuid, values)
            .then(() => {
                addFlash({ key: 'splitter', type: 'success', title: 'Éxito', message: 'Mini-servidor en proceso de creación.' });
                resetForm();
                loadData();
            })
            .catch((error) => {
                addFlash({ key: 'splitter', type: 'error', title: 'Error', message: error.response?.data?.message || 'Error desconocido' });
            })
            .finally(() => setSubmitting(false));
    };

    const remove = (childUuid: string) => {
        if (!confirm('¿Estás seguro de eliminar este mini-servidor? Se borrarán todos sus datos y recuperarás sus recursos.')) return;
        
        deleteServerSplit(uuid, childUuid)
            .then(() => {
                addFlash({ key: 'splitter', type: 'success', title: 'Éxito', message: 'Mini-servidor eliminado.' });
                loadData();
            })
            .catch((error) => {
                addFlash({ key: 'splitter', type: 'error', title: 'Error', message: error.response?.data?.message || 'Error desconocido' });
            });
    };

    return (
        <PageContentBlock title={'Divisores de Servidor'}>
            <FlashMessageRender byKey={'splitter'} css={tw`mb-4`} />
            
            <div css={tw`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4`}>
                <TitledGreyBox title={'Tus Recursos Actuales'} css={tw`w-full`}>
                    <div css={tw`flex flex-col gap-2`}>
                        <p css={tw`text-gray-300`}>
                            <strong>RAM Disponible:</strong> {data.parent_resources.memory} MB
                        </p>
                        <p css={tw`text-gray-300`}>
                            <strong>CPU Disponible:</strong> {data.parent_resources.cpu}%
                        </p>
                        <p css={tw`text-gray-300`}>
                            <strong>Disco Disponible:</strong> {data.parent_resources.disk} MB
                        </p>
                        <p css={tw`mt-4 text-sm text-gray-400`}>
                            Tienes {data.allowed_splits - data.current_splits} divisiones restantes de un total de {data.allowed_splits}.
                        </p>
                    </div>
                </TitledGreyBox>

                {data.allowed_splits > data.current_splits && (
                    <TitledGreyBox title={'Crear Mini-Servidor'} css={tw`w-full`}>
                        <Formik
                            onSubmit={submit}
                            initialValues={{ name: '', memory: 1024, cpu: 100, disk: 5120 }}
                            validationSchema={object().shape({
                                name: string().required().max(191),
                                memory: number().required().min(256).max(data.parent_resources.memory - 512),
                                cpu: number().required().min(10).max(data.parent_resources.cpu - 10),
                                disk: number().required().min(256).max(data.parent_resources.disk - 1024),
                            })}
                        >
                            {({ isSubmitting }) => (
                                <Form css={tw`flex flex-col gap-4`}>
                                    <Field name={'name'} label={'Nombre del Mini-Servidor'} />
                                    <div css={tw`grid grid-cols-3 gap-2`}>
                                        <Field name={'memory'} label={'RAM (MB)'} type={'number'} />
                                        <Field name={'cpu'} label={'CPU (%)'} type={'number'} />
                                        <Field name={'disk'} label={'Disco (MB)'} type={'number'} />
                                    </div>
                                    <div css={tw`flex justify-end mt-4`}>
                                        <Button type={'submit'} disabled={isSubmitting}>Crear Mini-Servidor</Button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </TitledGreyBox>
                )}
            </div>

            <h3 css={tw`text-lg font-semibold text-gray-200 mb-2 mt-6`}>Tus Mini-Servidores</h3>
            {data.children.length === 0 ? (
                <p css={tw`text-gray-400`}>No tienes ningún mini-servidor creado actualmente.</p>
            ) : (
                data.children.map((child) => (
                    <GreyRowBox key={child.uuid} css={tw`mb-2 flex items-center justify-between`}>
                        <div>
                            <p css={tw`font-semibold text-gray-100`}>{child.name}</p>
                            <p css={tw`text-sm text-gray-400`}>
                                RAM: {child.memory}MB | CPU: {child.cpu}% | Disco: {child.disk}MB | IP: {child.allocation}
                            </p>
                        </div>
                        <div>
                            <Button color={'red'} onClick={() => remove(child.uuid)}>
                                Eliminar y Recuperar Recursos
                            </Button>
                        </div>
                    </GreyRowBox>
                ))
            )}
        </PageContentBlock>
    );
};
