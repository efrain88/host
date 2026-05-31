import React from 'react';
import { ServerContext } from '@/state/server';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Field as FormikField, Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { Actions, useStoreActions } from 'easy-peasy';
import renameServer from '@/api/server/renameServer';
import Field from '@/components/elements/Field';
import { object, string } from 'yup';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import { Button } from '@/components/elements/button/index';
import tw from 'twin.macro';
import Label from '@/components/elements/Label';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import { Textarea } from '@/components/elements/Input';

interface Values {
    name: string;
    description: string;
}

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components/macro';

const ContentBox = styled.div`
    ${tw`bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-2xl mb-6 relative overflow-hidden`};
`;

const BoxHeader = styled.div`
    ${tw`flex items-center gap-x-3 mb-6 pb-4 border-b border-white/5`};
    h2 {
        ${tw`text-lg font-bold text-white tracking-wide`};
    }
    svg {
        ${tw`text-primary-400 text-xl`};
    }
`;

const RenameServerBox = () => {
    const { isSubmitting } = useFormikContext<Values>();

    return (
        <ContentBox>
            <BoxHeader>
                <FontAwesomeIcon icon={faPencilAlt} />
                <h2>Detalles del servidor</h2>
            </BoxHeader>
            <SpinnerOverlay visible={isSubmitting} />
            <Form className="mb-0 bg-[#050505] p-5 rounded-xl border border-white/5">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <Field id={'name'} name={'name'} label={'Nombre del servidor'} type={'text'} />
                    </div>
                    <div className="flex-1">
                        <Label>Descripción</Label>
                        <FormikFieldWrapper name={'description'}>
                            <FormikField as={Textarea} name={'description'} rows={1} />
                        </FormikFieldWrapper>
                    </div>
                </div>
                
                <div className="mt-6">
                    <Field id={'ip_alias'} name={'ip_alias'} label={'IP Alias'} type={'text'} placeholder={'mc.lumencraft.lat'} />
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-y-4 justify-between sm:items-end border-t border-white/5 pt-6">
                    <p className="text-xs text-neutral-500">
                        Nombre opcional para mostrar la IP de tu servidor (ej. play.miservidor.com)
                    </p>
                    <Button type={'submit'} className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg border-0 px-8 py-2.5">
                        Guardar
                    </Button>
                </div>
            </Form>
        </ContentBox>
    );
};

export default () => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const setServer = ServerContext.useStoreActions((actions) => actions.server.setServer);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = ({ name, description }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('settings');
        renameServer(server.uuid, name, description)
            .then(() => setServer({ ...server, name, description }))
            .catch((error) => {
                console.error(error);
                addError({ key: 'settings', message: httpErrorToHuman(error) });
            })
            .then(() => setSubmitting(false));
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                name: server.name,
                description: server.description,
            }}
            validationSchema={object().shape({
                name: string().required().min(1),
                description: string().nullable(),
            })}
        >
            <RenameServerBox />
        </Formik>
    );
};
