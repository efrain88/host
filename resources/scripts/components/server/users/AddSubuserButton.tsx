import React, { useState } from 'react';
import EditSubuserModal from '@/components/server/users/EditSubuserModal';
import { Button } from '@/components/elements/button/index';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';

export default () => {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <EditSubuserModal visible={visible} onModalDismissed={() => setVisible(false)} />
            <Button 
                onClick={() => setVisible(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.3)] border-0 px-6 py-2 transition-all font-bold"
            >
                <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                Añadir Usuario
            </Button>
        </>
    );
};
