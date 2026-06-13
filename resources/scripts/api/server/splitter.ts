import http from '@/api/http';

export interface ServerSplit {
    uuid: string;
    name: string;
    memory: number;
    cpu: number;
    disk: number;
    status: string | null;
    allocation: string;
}

export interface SplitterResponse {
    success: boolean;
    allowed_splits: number;
    current_splits: number;
    children: ServerSplit[];
    parent_resources: {
        memory: number;
        cpu: number;
        disk: number;
    };
}

export const getServerSplits = async (uuid: string): Promise<SplitterResponse> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/splitter`);
    return data;
};

export const createServerSplit = async (
    uuid: string,
    params: { name: string; memory: number; cpu: number; disk: number }
): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/splitter`, params);
};

export const deleteServerSplit = async (uuid: string, childUuid: string): Promise<void> => {
    await http.delete(`/api/client/servers/${uuid}/splitter/${childUuid}`);
};
