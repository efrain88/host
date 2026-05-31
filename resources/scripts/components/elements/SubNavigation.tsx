import styled from 'styled-components/macro';
import tw from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full flex flex-col mt-4`};

    & > div {
        ${tw`flex flex-col w-full px-4 gap-y-1`};

        & > a,
        & > div {
            ${tw`flex items-center py-2.5 px-4 text-neutral-400 no-underline transition-all duration-200 rounded-xl font-medium text-sm`};

            &:hover {
                ${tw`text-neutral-100 bg-white/5`};
            }

            &:active,
            &.active {
                ${tw`text-primary-400 bg-primary-500/10`};
            }
            
            svg {
                ${tw`mr-3 text-lg opacity-80`};
            }
        }
    }
`;

export default SubNavigation;
