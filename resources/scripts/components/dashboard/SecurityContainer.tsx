import * as React from 'react';
import ContentBox from '@/components/elements/ContentBox';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import { breakpoint } from '@/theme';
import styled from 'styled-components/macro';
import MessageBox from '@/components/MessageBox';
import { useLocation } from 'react-router-dom';

const Container = styled.div`
    ${tw`flex flex-col gap-y-6 max-w-4xl`};
`;

export default () => {
    const { state } = useLocation<undefined | { twoFactorRedirect?: boolean }>();

    return (
        <PageContentBlock title={'Seguridad'}>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Seguridad</h1>
                <p className="text-sm text-neutral-400">Gestiona tu contraseña y la autenticación en dos pasos.</p>
            </div>

            {state?.twoFactorRedirect && (
                <MessageBox title={'2-Factor Required'} type={'error'}>
                    Tu cuenta debe tener la autenticación en dos pasos habilitada para continuar.
                </MessageBox>
            )}

            <Container>
                <div className="bg-[#0a0a0c] border border-white/5 rounded-xl shadow-2xl p-6">
                    <h2 className="text-base font-bold text-white mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Cambiar contraseña
                    </h2>
                    <UpdatePasswordForm />
                </div>

                <div className="bg-[#0a0a0c] border border-white/5 rounded-xl shadow-2xl p-6">
                    <h2 className="text-base font-bold text-white mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Autenticación en dos pasos
                    </h2>
                    <p className="text-sm text-neutral-400 mb-6">
                        La verificación en dos pasos añade una capa extra de seguridad exigiendo un código basado en el tiempo además de tu contraseña al iniciar sesión.
                    </p>
                    <ConfigureTwoFactorForm />
                </div>
            </Container>
        </PageContentBlock>
    );
};
