import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { NavLink, useLocation } from 'react-router-dom';
import { encodePathSegments, hashToPath } from '@/helpers';

interface Props {
    renderLeft?: JSX.Element;
    withinFileEditor?: boolean;
    isNewFile?: boolean;
}

export default ({ renderLeft, withinFileEditor, isNewFile }: Props) => {
    const [file, setFile] = useState<string | null>(null);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { hash } = useLocation();

    useEffect(() => {
        const path = hashToPath(hash);

        if (withinFileEditor && !isNewFile) {
            const name = path.split('/').pop() || null;
            setFile(name);
        }
    }, [withinFileEditor, isNewFile, hash]);

    const breadcrumbs = (): { name: string; path?: string }[] =>
        directory
            .split('/')
            .filter((directory) => !!directory)
            .map((directory, index, dirs) => {
                if (!withinFileEditor && index === dirs.length - 1) {
                    return { name: directory };
                }

                return { name: directory, path: `/${dirs.slice(0, index + 1).join('/')}` };
            });

    return (
        <div className="flex flex-grow-0 items-center text-sm text-neutral-500 overflow-x-hidden font-medium font-mono">
            {renderLeft || <div className="w-4" />}
            <span className="mx-2 text-neutral-600">/</span>
            <span className="px-1 text-neutral-400">home</span>
            <span className="mx-2 text-neutral-600">/</span>
            <NavLink to={`/server/${id}/files`} className="px-1 text-neutral-300 no-underline hover:text-white transition-colors">
                container
            </NavLink>
            <span className="mx-2 text-neutral-600">/</span>
            {breadcrumbs().map((crumb, index) =>
                crumb.path ? (
                    <React.Fragment key={index}>
                        <NavLink
                            to={`/server/${id}/files#${encodePathSegments(crumb.path)}`}
                            className="px-1 text-neutral-300 no-underline hover:text-white transition-colors"
                        >
                            {crumb.name}
                        </NavLink>
                        <span className="mx-2 text-neutral-600">/</span>
                    </React.Fragment>
                ) : (
                    <span key={index} className="px-1 text-white">
                        {crumb.name}
                    </span>
                )
            )}
            {file && (
                <React.Fragment>
                    <span className="px-1 text-white">{file}</span>
                </React.Fragment>
            )}
        </div>
    );
};
