import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled, { createGlobalStyle, keyframes } from 'styled-components/macro';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

const animateBackground = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

const GlobalStyle = createGlobalStyle`
    body {
        background: linear-gradient(-45deg, #09090e, #1a1525, #2d1b36, #161224);
        background-size: 400% 400%;
        animation: ${animateBackground} 15s ease infinite;
    }
    
    #app {
        ${tw`min-h-screen flex items-center justify-center`}
    }

    /* Customize input fields across auth */
    input {
        background-color: rgba(0, 0, 0, 0.4) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        color: white !important;
        border-radius: 0.75rem !important;
        transition: all 0.3s ease-in-out;
    }
    
    input:focus {
        border-color: rgba(245, 158, 11, 0.5) !important; /* amber-500/50 */
        box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.5) !important;
        outline: none !important;
    }
    
    input::placeholder {
        color: #737373 !important; /* neutral-500 */
    }
    
    .grecaptcha-badge {
        display: none !important;
    }
`;

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const Container = styled.div`
    ${tw`w-full mx-auto p-4 sm:p-6`}
    max-width: 480px;
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <>
        <GlobalStyle />
        <Container>
            <FlashMessageRender css={tw`mb-4 px-1`} />
            <Form {...props} ref={ref}>
                <div className="w-full bg-[#050505]/40 backdrop-blur-2xl border border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] rounded-[2.5rem] p-8 md:p-10 flex flex-col relative overflow-hidden">
                    {/* Decoración de brillo superior */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                    
                    <div className="select-none mb-8 text-center">
                        <h1 className="text-5xl font-header font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 tracking-wider drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 transition-transform duration-500 cursor-default">
                            LumenCraft
                        </h1>
                        {title && <h2 className="text-xs uppercase tracking-widest text-neutral-400 font-bold mt-4">{title}</h2>}
                    </div>
                    <div className="w-full flex flex-col">
                        {props.children}
                    </div>
                </div>
            </Form>
            <p className="text-center text-neutral-500 text-xs mt-6 opacity-70 hover:opacity-100 transition-opacity">
                &copy; 2026&nbsp;
                <a
                    rel={'noopener nofollow noreferrer'}
                    href={'https://lumencraft.lat'}
                    target={'_blank'}
                    className="no-underline text-neutral-400 hover:text-amber-400 font-bold transition-colors"
                >
                    TeamLumencraft
                </a>
            </p>
        </Container>
    </>
));
