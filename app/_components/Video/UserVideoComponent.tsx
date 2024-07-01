import React, { useEffect, useState } from 'react';
import OpenViduVideoComponent from './OvVideo';
import styles from './Video.module.css';

interface Props {
    streamManager: any;
}

const UserVideoComponent: React.FC<Props> = ({ streamManager }) => {
    const getNicknameTag = () => {
        return JSON.parse(streamManager.stream.connection.data).clientData;
    };

    return (
        <div className={styles.streamcomponent} >
            <OpenViduVideoComponent streamManager={streamManager} />
            <div className={styles.nicknameContainer}><span>{getNicknameTag()}</span></div>
        </div>
    );
};

export default UserVideoComponent;
