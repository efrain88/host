import React, { useEffect, useState } from 'react';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { httpErrorToHuman } from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Can from '@/components/elements/Can';
import Button from '@/components/elements/Button';
import Select from '@/components/elements/Select';
import modes from '@/modes';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import { FileObject } from '@/api/server/files/loadDirectory';
import { join } from 'pathe';
import CodemirrorEditor from '@/components/elements/CodemirrorEditor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode } from '@fortawesome/free-solid-svg-icons';

interface Props {
    file: FileObject | null;
}

export default ({ file }: Props) => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('');
    const [mode, setMode] = useState('text/plain');

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { addError, clearFlashes } = useFlash();

    let fetchFileContent: null | (() => Promise<string>) = null;

    useEffect(() => {
        if (!file) return;

        setError('');
        setLoading(true);
        setContent('');
        
        const path = join(directory, file.name);
        getFileContents(uuid, path)
            .then((text) => setContent(text))
            .catch((error) => {
                console.error(error);
                setError(httpErrorToHuman(error));
            })
            .then(() => setLoading(false));
    }, [file?.key, uuid, directory]);

    const save = () => {
        if (!fetchFileContent || !file) return;

        setLoading(true);
        clearFlashes('files:view');
        
        fetchFileContent()
            .then((text) => saveFileContents(uuid, join(directory, file.name), text))
            .then(() => addError({ message: 'Archivo guardado correctamente.', key: 'files:view', type: 'success' }))
            .catch((error) => {
                console.error(error);
                addError({ message: httpErrorToHuman(error), key: 'files:view', type: 'error' });
            })
            .then(() => setLoading(false));
    };

    if (!file) {
        return (
            <div className="w-full h-full bg-[#050505] rounded-xl border border-white/5 flex flex-col items-center justify-center text-neutral-500 shadow-inner">
                <FontAwesomeIcon icon={faCode} className="text-6xl mb-4 text-neutral-800" />
                <p className="font-medium text-lg">Seleccione un archivo para editar</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full bg-[#050505] rounded-xl border border-white/5 flex flex-col items-center justify-center text-red-500 shadow-inner p-8 text-center">
                <p className="font-bold text-xl mb-2">Error cargando archivo</p>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-[#050505] rounded-xl border border-white/5 flex flex-col shadow-inner relative overflow-hidden">
            <SpinnerOverlay visible={loading} />
            
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-white/5">
                <div className="text-sm font-bold text-neutral-300">
                    Editando: <span className="text-white">{file.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <Select value={mode} onChange={(e) => setMode(e.currentTarget.value)} className="w-48 !h-8 !py-0 !text-xs">
                        {modes.map((m) => (
                            <option key={`${m.name}_${m.mime}`} value={m.mime}>
                                {m.name}
                            </option>
                        ))}
                    </Select>
                    
                    <Can action={'file.update'}>
                        <Button size="small" onClick={() => save()}>
                            Guardar
                        </Button>
                    </Can>
                </div>
            </div>

            <div className="flex-1 relative">
                <CodemirrorEditor
                    mode={mode}
                    filename={file.name}
                    onModeChanged={setMode}
                    initialContent={content}
                    fetchContent={(value) => {
                        fetchFileContent = value;
                    }}
                    onContentSaved={() => save()}
                />
            </div>
        </div>
    );
};
