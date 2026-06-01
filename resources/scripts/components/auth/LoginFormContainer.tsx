import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const Container = styled.div`
    ${breakpoint('sm')`
        ${tw`w-4/5 mx-auto`}
    `};

    ${breakpoint('md')`
        ${tw`p-10`}
    `};

    ${breakpoint('lg')`
        ${tw`w-3/5`}
    `};

    ${breakpoint('xl')`
        ${tw`w-full`}
        max-width: 700px;
    `};
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <Container>
        {title && <h2 css={tw`text-3xl text-center text-neutral-100 font-medium py-4`}>{title}</h2>}
        <FlashMessageRender css={tw`mb-2 px-1`} />
        <Form {...props} ref={ref}>
            <div className="md:flex w-full bg-[#050505]/70 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8 mx-1 items-center">
                <div className="flex-none select-none mb-8 md:mb-0 md:w-64 self-center text-center">
                    <h1 className="text-4xl md:text-5xl font-header font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 tracking-wider drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                        LumenCraft
                    </h1>
                </div>
                <div className="flex-1 md:border-l border-white/10 md:pl-8">{props.children}</div>
            </div>
        </Form>
        <p css={tw`text-center text-neutral-500 text-xs mt-4`}>
            &copy; 2026&nbsp;
            <a
                rel={'noopener nofollow noreferrer'}
                href={'https://lumencraft.lat'}
                target={'_blank'}
                css={tw`no-underline text-neutral-500 hover:text-neutral-300 font-bold`}
            >
                TeamLumencraft
            </a>
        </p>
    </Container>
));
