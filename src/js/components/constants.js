export const hostInfo = {
    name: null,
    id: null,
    peer: null,
    conn: null,
};

export const state = {
    pendingConnection: null,
    noRemoteIdNotice: true,
};

export const peerOptions = {
    config: {
        iceServers: [
            {
                urls: 'stun:stun.l.google.com:19302'
            },
            {
                urls: 'turn:turn.islabre.fyi:5349',
                username: 'webrtc-turn',
                credential: 'webrtc-turn',
            },
        ],
        sdpSemantics: 'unified-plan',
    },
};

export const systemName = 'System';