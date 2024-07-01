import React, { Component, createRef, RefObject } from 'react';

interface Props {
    streamManager: any;
}

export default class OpenViduVideoComponent extends Component<Props> {
    videoRef: RefObject<HTMLVideoElement>;

    constructor(props: Props) {
        super(props);
        this.videoRef = createRef();
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.streamManager !== this.props.streamManager && this.videoRef.current) {
            this.props.streamManager.addVideoElement(this.videoRef.current);
        }
    }

    componentDidMount() {
        if (this.videoRef.current) {
            this.props.streamManager.addVideoElement(this.videoRef.current);
        }
    }

    render() {
        return <video autoPlay={true} ref={this.videoRef} />;
    }
}
