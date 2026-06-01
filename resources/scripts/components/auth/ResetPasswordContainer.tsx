import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import performPasswordReset from '@/api/auth/performPasswordReset';
import { httpErrorToHuman } from '@/api/http';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { Formik, FormikHelpers } from 'formik';
import { object, ref, string } from 'yup';
import Field from '@/components/elements/Field';
import Input from '@/components/elements/Input';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';

interface Values {
    password: string;
    passwordConfirmation: string;
}

export default ({ match, location }: RouteComponentProps<{ token: string }>) => {
    const [email, setEmail] = useState('');

    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const parsed = new URLSearchParams(location.search);
    if (email.length === 0 && parsed.get('email')) {
        setEmail(parsed.get('email') || '');
    }

    const submit = ({ password, passwordConfirmation }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();
        performPasswordReset(email, { token: match.params.token, password, passwordConfirmation })
            .then(() => {
                // @ts-expect-error this is valid
                window.location = '/';
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                password: '',
                passwordConfirmation: '',
            }}
            validationSchema={object().shape({
                password: string()
                    .required('Se requiere una nueva contraseña.')
                    .min(8, 'Tu nueva contraseña debe tener al menos 8 caracteres.'),
                passwordConfirmation: string()
                    .required('Tu nueva contraseña no coincide.')
                    // @ts-expect-error this is valid
                    .oneOf([ref('password'), null], 'Tu nueva contraseña no coincide.'),
            })}
        >
            {({ isSubmitting }) => (
                <LoginFormContainer title={'Restablecer Contraseña'} css={tw`w-full flex`}>
                    <div>
                        <label>Correo Electrónico</label>
                        <Input value={email} disabled className="bg-[#0a0a0c]/80 text-white" />
                    </div>
                    <div className="mt-6">
                        <Field
                            label={'Nueva Contraseña'}
                            name={'password'}
                            type={'password'}
                            description={'Las contraseñas deben tener al menos 8 caracteres.'}
                        />
                    </div>
                    <div className="mt-6">
                        <Field label={'Confirmar Nueva Contraseña'} name={'passwordConfirmation'} type={'password'} />
                    </div>
                    <div className="mt-8">
                        <Button
                            size={'xlarge'}
                            type={'submit'}
                            disabled={isSubmitting}
                            isLoading={isSubmitting}
                            className="w-full justify-center bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 border-none shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] transition-all duration-300"
                        >
                            Restablecer Contraseña
                        </Button>
                    </div>
                    <div className="mt-6 text-center">
                        <Link
                            to={'/auth/login'}
                            className="text-xs text-neutral-400 tracking-wide no-underline uppercase hover:text-yellow-400 transition-colors"
                        >
                            Volver al Inicio
                        </Link>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
};
