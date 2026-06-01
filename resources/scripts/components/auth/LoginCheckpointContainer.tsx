import React, { useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import loginCheckpoint from '@/api/auth/loginCheckpoint';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { ActionCreator } from 'easy-peasy';
import { StaticContext } from 'react-router';
import { useFormikContext, withFormik } from 'formik';
import useFlash from '@/plugins/useFlash';
import { FlashStore } from '@/state/flashes';
import Field from '@/components/elements/Field';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';

interface Values {
    code: string;
    recoveryCode: '';
}

type OwnProps = RouteComponentProps<Record<string, string | undefined>, StaticContext, { token?: string }>;

type Props = OwnProps & {
    clearAndAddHttpError: ActionCreator<FlashStore['clearAndAddHttpError']['payload']>;
};

const LoginCheckpointContainer = () => {
    const { isSubmitting, setFieldValue } = useFormikContext<Values>();
    const [isMissingDevice, setIsMissingDevice] = useState(false);

    return (
        <LoginFormContainer title={'Verificación de Seguridad'} css={tw`w-full flex`}>
            <div className="mt-6">
                <Field
                    name={isMissingDevice ? 'recoveryCode' : 'code'}
                    title={isMissingDevice ? 'Código de Recuperación' : 'Código de Autenticación'}
                    description={
                        isMissingDevice
                            ? 'Ingresa uno de los códigos de recuperación generados cuando configuraste la autenticación en 2 pasos para continuar.'
                            : 'Ingresa el código generado por tu aplicación de autenticación.'
                    }
                    type={'text'}
                    autoComplete={'one-time-code'}
                    autoFocus
                />
            </div>
            <div className="mt-8">
                <Button
                    size={'xlarge'}
                    type={'submit'}
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    className="w-full justify-center bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 border-none shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] transition-all duration-300"
                >
                    Continuar
                </Button>
            </div>
            <div className="mt-6 text-center">
                <span
                    onClick={() => {
                        setFieldValue('code', '');
                        setFieldValue('recoveryCode', '');
                        setIsMissingDevice((s) => !s);
                    }}
                    className="cursor-pointer text-xs text-neutral-400 tracking-wide uppercase no-underline hover:text-yellow-400 transition-colors"
                >
                    {!isMissingDevice ? 'He perdido mi dispositivo' : 'Tengo mi dispositivo'}
                </span>
            </div>
            <div className="mt-6 text-center">
                <Link
                    to={'/auth/login'}
                    className="text-xs text-neutral-400 tracking-wide uppercase no-underline hover:text-yellow-400 transition-colors"
                >
                    Volver al Inicio
                </Link>
            </div>
        </LoginFormContainer>
    );
};

const EnhancedForm = withFormik<Props, Values>({
    handleSubmit: ({ code, recoveryCode }, { setSubmitting, props: { clearAndAddHttpError, location } }) => {
        loginCheckpoint(location.state?.token || '', code, recoveryCode)
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }

                setSubmitting(false);
            })
            .catch((error) => {
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    },

    mapPropsToValues: () => ({
        code: '',
        recoveryCode: '',
    }),
})(LoginCheckpointContainer);

export default ({ history, location, ...props }: OwnProps) => {
    const { clearAndAddHttpError } = useFlash();

    if (!location.state?.token) {
        history.replace('/auth/login');

        return null;
    }

    return (
        <EnhancedForm clearAndAddHttpError={clearAndAddHttpError} history={history} location={location} {...props} />
    );
};
