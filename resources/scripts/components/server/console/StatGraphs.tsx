import React, { useEffect, useRef } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { Line } from 'react-chartjs-2';
import { useChart, useChartTickLabel } from '@/components/server/console/chart';
import { hexToRgba } from '@/lib/helpers';
import { bytesToString } from '@/lib/formatters';
import { CloudDownloadIcon, CloudUploadIcon } from '@heroicons/react/solid';
import { theme } from 'twin.macro';
import ChartBlock from '@/components/server/console/ChartBlock';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory } from '@fortawesome/free-solid-svg-icons';

export default () => {
    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const previous = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });

    const cpu = useChartTickLabel('Carga de CPU', limits.cpu, '%', 2);
    const memory = useChartTickLabel('Memoria', limits.memory, 'MiB');
    const network = useChart('Red', {
        sets: 2,
        options: {
            scales: {
                y: {
                    ticks: {
                        callback(value) {
                            return bytesToString(typeof value === 'string' ? parseInt(value, 10) : value);
                        },
                    },
                },
            },
        },
        callback(opts, index) {
            return {
                ...opts,
                label: !index ? 'Red Entrada' : 'Red Salida',
                borderColor: !index ? theme('colors.primary.400') : theme('colors.primary.700'),
                backgroundColor: hexToRgba(!index ? theme('colors.primary.600') : theme('colors.primary.900'), 0.2),
            };
        },
    });

    useEffect(() => {
        if (status === 'offline') {
            cpu.clear();
            memory.clear();
            network.clear();
        }
    }, [status]);

    useWebsocketEvent(SocketEvent.STATS, (data: string) => {
        let values: any = {};
        try {
            values = JSON.parse(data);
        } catch (e) {
            return;
        }
        cpu.push(values.cpu_absolute);
        memory.push(Math.floor(values.memory_bytes / 1024 / 1024));
        network.push([
            previous.current.tx < 0 ? 0 : Math.max(0, values.network.tx_bytes - previous.current.tx),
            previous.current.rx < 0 ? 0 : Math.max(0, values.network.rx_bytes - previous.current.rx),
        ]);

        previous.current = { tx: values.network.tx_bytes, rx: values.network.rx_bytes };
    });

    return (
        <>
            <ChartBlock 
                title={'Carga de CPU'}
                legend={
                    <Tooltip arrow content={'CPU Usage'}>
                        <FontAwesomeIcon icon={faMicrochip} className="text-primary-500 w-4 h-4" />
                    </Tooltip>
                }
            >
                <Line {...cpu.props} />
            </ChartBlock>
            <ChartBlock 
                title={'Memoria'}
                legend={
                    <Tooltip arrow content={'Memory Usage'}>
                        <FontAwesomeIcon icon={faMemory} className="text-primary-500 w-4 h-4" />
                    </Tooltip>
                }
            >
                <Line {...memory.props} />
            </ChartBlock>
            <ChartBlock
                title={'Red'}
                legend={
                    <>
                        <Tooltip arrow content={'Entrada'}>
                            <CloudDownloadIcon className={'mr-2 w-4 h-4 text-primary-400'} />
                        </Tooltip>
                        <Tooltip arrow content={'Salida'}>
                            <CloudUploadIcon className={'w-4 h-4 text-primary-700'} />
                        </Tooltip>
                    </>
                }
            >
                <Line {...network.props} />
            </ChartBlock>
        </>
    );
};
