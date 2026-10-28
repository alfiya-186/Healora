import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, PhoneOff, 
  MessageSquare, FileText, X, Maximize2, Minimize2, 
  ShieldCheck, Clock, Send, User, Sparkles, Activity, CheckCircle2, 
  RefreshCw, AlertCircle, HeartPulse, Scale, Apple, ChevronRight,
  Volume2, VolumeX, Camera, ArrowLeftRight, Lock
} from 'lucide-react';
import { secureFetch } from '../utils/apiClient.js';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' }
  ]
};

/**
 * 🌟 HEALORA GENUINE TWO-WAY WEBRTC TELEHEALTH CONSULTATION STUDIO 🌟
 * - Full WebRTC RTCPeerConnection with STUN ICE servers.
 * - HTTP REST signalling via Django backend (/api/telehealth/signal/<appointment_id>/).
 * - Real live camera and audio streaming in BOTH directions.
 * - Accurate connection statuses: WAITING_FOR_PEER, CONNECTING, CONNECTED, DISCONNECTED.
 * - Hardware mute/unmute and track release.
 * - Live bidirectional in-call text chat.
 * - Clinical consultation notes persisted to PostgreSQL.
 */
const TelehealthVideoRoom = ({
  isOpen,
  onClose,
  appointment,
  currentUserRole = 'PATIENT',
  currentUserName = 'User',
  patientProfile = {},
  nutritionistInfo = {},
  onSaveNotes = null
}) => {
  // --- MEDIA STREAMS & WEBRTC STATE ---
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('INITIALIZING'); // 'INITIALIZING' | 'WAITING_FOR_PEER' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'FAILED'
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [micVolume, setMicVolume] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSwappedView, setIsSwappedView] = useState(false);

  // --- DRAWER & PANELS ---
  const [activeSidePanel, setActiveSidePanel] = useState(''); // '' | 'chat' | 'clinical'
  const [inCallMessages, setInCallMessages] = useState([
    {
      id: 1,
      sender: 'System',
      role: 'SYSTEM',
      text: '🔒 Live Clinical Consultation initialized. Waiting for participants to join...',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // --- CLINICAL NOTES (FOR NUTRITIONIST) ---
  const [doctorNotes, setDoctorNotes] = useState('');
  const [prescriptionNote, setPrescriptionNote] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSavedAlert, setNotesSavedAlert] = useState(false);

  // --- REAL-TIME WEBRTC DIAGNOSTICS & METRICS ---
  const [diagLogs, setDiagLogs] = useState([]);
  const [diagMetrics, setDiagMetrics] = useState({
    localAudio: 'initializing',
    localVideo: 'initializing',
    signalingState: 'stable',
    connectionState: 'new',
    iceConnectionState: 'new',
    iceGatheringState: 'new',
    remoteAudioTrack: 'none',
    remoteVideoTrack: 'none',
    videoReadyState: -1,
    videoDims: '0x0',
    videoPlaying: false,
    signalsSent: 0,
    signalsRcvd: 0,
    candidatesSent: 0,
    candidatesRcvd: 0,
    lastError: null
  });

  const addDiagLog = (msg, extra = '') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const fullMsg = `[${time}] ${msg}${extra ? ' ' + (typeof extra === 'object' ? JSON.stringify(extra) : extra) : ''}`;
    console.log(`%c[HEALORA_DIAGNOSTIC] ${fullMsg}`, 'color: #34d399; font-weight: bold;');
    setDiagLogs(prev => [...prev.slice(-60), fullMsg]);
  };

  // --- REFS ---
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remoteMediaStreamRef = useRef(null);
  const screenVideoRef = useRef(null);
  const containerRef = useRef(null);
  const chatBottomRef = useRef(null);
  const pcRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const lastSignalIdRef = useRef(0);
  const iceCandidatesQueueRef = useRef([]);
  const offerTimeoutRef = useRef(null);
  const hasHandshakedRef = useRef(false);
  const hasPresentedRef = useRef(false);
  const hasAnsweredRef = useRef(false);
  const signalsSentCountRef = useRef(0);
  const signalsRcvdCountRef = useRef(0);
  const candidatesSentCountRef = useRef(0);
  const candidatesRcvdCountRef = useRef(0);
  const originalVideoTrackRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const wsRef = useRef(null);
  const isWsConnectedRef = useRef(false);
  const isProcessingOfferRef = useRef(false);

  const isDoctor = currentUserRole === 'NUTRITIONIST';
  const remotePersonName = isDoctor 
    ? (appointment?.patient_name || patientProfile?.name || 'Patient')
    : (appointment?.doctor_name || (nutritionistInfo?.first_name ? `Dr. ${nutritionistInfo.first_name} ${nutritionistInfo.last_name}` : 'Dr. Sarah John'));
  const remotePersonTitle = isDoctor ? 'Patient (Scheduled Consultation)' : 'Lead Clinical Nutritionist & Physician';

  // --- MICROPHONE ANALYSER ---
  const setupAudioAnalyser = (stream) => {
    try {
      if (!stream || !stream.getAudioTracks().length) return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }

      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const sample = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setMicVolume(Math.min(100, Math.round(avg * 1.8)));
        animFrameRef.current = requestAnimationFrame(sample);
      };
      sample();
    } catch (e) {}
  };

  // --- REAL-TIME WEBSOCKET & HTTP FALLBACK SIGNALLING ---
  const sendSignal = async (type, payload) => {
    if (!appointment?.id) return;
    signalsSentCountRef.current += 1;
    if (type === 'candidate') candidatesSentCountRef.current += 1;

    // 1. Send via real-time WebSocket if open (sub-millisecond latency)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type,
          payload,
          senderName: currentUserName,
          role: currentUserRole
        }));
        addDiagLog(`⚡ [WS] Sent signal [${type}]`);
        return;
      } catch (wsErr) {
        addDiagLog(`⚠️ WS send error: ${wsErr.message}, attempting HTTP fallback`);
      }
    }

    // 2. Resilient fallback via HTTP REST
    try {
      addDiagLog(`📤 [HTTP] SENDING signal [${type}] to room #${appointment.id}`);
      const res = await secureFetch(`/api/telehealth/signal/${appointment.id}/`, {
        method: 'POST',
        body: JSON.stringify({ type, payload })
      });
      if (res.ok) {
        const data = await res.json();
        addDiagLog(`✅ [HTTP] SENT signal [${type}] (id: #${data.signal_id})`);
      } else {
        addDiagLog(`❌ [HTTP] SEND FAILED [${type}]: HTTP ${res.status}`);
      }
    } catch (err) {
      addDiagLog(`❌ [HTTP] SEND ERROR [${type}]: ${err.message}`);
    }
  };

  // --- CONNECT REAL-TIME WEBSOCKET BACKED BY REDIS & CHANNELS ---
  const setupWebSocket = () => {
    if (!appointment?.id) return;
    try {
      const rawBase = import.meta.env.VITE_API_BASE_URL || 'https://healora-backend-ru0c.onrender.com';
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = rawBase.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const wsUrl = `${wsProto}//${wsHost}/ws/telehealth/${appointment.id}/`;

      addDiagLog(`🔌 Connecting real-time WebSocket: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        isWsConnectedRef.current = true;
        addDiagLog("⚡ Real-time WebSocket signaling connected to Redis channel group!");
        // Announce presence immediately across the WebSocket
        sendSignal('join', { role: currentUserRole, name: currentUserName });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type) {
            signalsRcvdCountRef.current += 1;
            addDiagLog(`📥 [WS] RCVD signal [${data.type}] from ${data.sender_name || 'peer'}`);
            handleIncomingSignal(data.type, data.payload, data.sender_name);
          }
        } catch (e) {
          addDiagLog(`⚠️ WS JSON parse error: ${e.message}`);
        }
      };

      ws.onerror = (e) => {
        addDiagLog("⚠️ WebSocket connection notice, HTTP polling serves as active backup");
        isWsConnectedRef.current = false;
      };

      ws.onclose = () => {
        addDiagLog("🔌 WebSocket connection closed");
        isWsConnectedRef.current = false;
      };

      wsRef.current = ws;
    } catch (err) {
      addDiagLog(`⚠️ WebSocket initialization error: ${err.message}`);
      isWsConnectedRef.current = false;
    }
  };

  // --- CREATE WEBRTC PEER CONNECTION ---
  const createPeerConnection = (stream) => {
    if (pcRef.current) {
      try {
        addDiagLog("Closing existing RTCPeerConnection before recreating");
        pcRef.current.close();
      } catch (e) {}
      pcRef.current = null;
    }

    addDiagLog("Creating new RTCPeerConnection with STUN configuration");
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to peer connection
    if (stream) {
      localStreamRef.current = stream;
      stream.getTracks().forEach(track => {
        try {
          addDiagLog(`Adding local track to PC: kind=${track.kind}, id=${track.id}, readyState=${track.readyState}`);
          pc.addTrack(track, stream);
        } catch (e) {
          addDiagLog(`Error adding local track: ${e.message}`);
        }
      });
    }

    // Handle incoming remote media tracks
    pc.ontrack = (event) => {
      addDiagLog(`🎬 pc.ontrack fired: kind=${event.track.kind}, id=${event.track.id}, muted=${event.track.muted}`);
      if (!remoteMediaStreamRef.current) {
        remoteMediaStreamRef.current = new MediaStream();
      }
      if (!remoteMediaStreamRef.current.getTracks().some(t => t.id === event.track.id)) {
        remoteMediaStreamRef.current.addTrack(event.track);
      }
      const stream = remoteMediaStreamRef.current;
      setRemoteStream(new MediaStream(stream.getTracks()));
      setConnectionStatus('CONNECTED');

      if (event.track.kind === 'video') {
        setHasRemoteVideo(true);
        event.track.onunmute = () => {
          addDiagLog("🌟 Video track onunmute: frames flowing!");
          setHasRemoteVideo(true);
          attachRemoteMedia();
        };
        event.track.onended = () => {
          addDiagLog("Remote video track ended");
          setHasRemoteVideo(false);
          attachRemoteMedia();
        };
      }

      attachRemoteMedia();
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candType = event.candidate.type || (event.candidate.candidate?.includes('typ srflx') ? 'srflx' : 'host');
        addDiagLog(`🧊 Generated local ICE candidate (${candType}): ${event.candidate.candidate?.slice(0, 45)}...`);
        const cand = event.candidate.toJSON ? event.candidate.toJSON() : {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        };
        sendSignal('candidate', cand);
      } else {
        addDiagLog("🧊 Local ICE candidate gathering complete (null candidate)");
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      addDiagLog(`⚡ pc.connectionState changed: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        setConnectionStatus('CONNECTED');
      } else if (pc.connectionState === 'connecting') {
        if (!remoteMediaStreamRef.current || remoteMediaStreamRef.current.getTracks().length === 0) {
          setConnectionStatus('CONNECTING');
        }
      } else if (pc.connectionState === 'disconnected') {
        setConnectionStatus('DISCONNECTED');
      } else if (pc.connectionState === 'failed') {
        setConnectionStatus('FAILED');
      }
    };

    pc.oniceconnectionstatechange = () => {
      addDiagLog(`❄️ pc.iceConnectionState changed: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionStatus('CONNECTED');
      }
    };

    pc.onsignalingstatechange = () => {
      addDiagLog(`📶 pc.signalingState changed: ${pc.signalingState}`);
    };

    pcRef.current = pc;
    return pc;
  };

  // --- SYNTHETIC AVATAR VIDEO TRACK FALLBACK (FOR CONCURRENT LOCAL TESTING OR NO CAM) ---
  const createVirtualVideoTrack = (name) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      let frame = 0;
      const render = () => {
        frame++;
        ctx.fillStyle = '#0F1A13';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle pulsing ring
        const pulse = Math.sin(frame * 0.08) * 8;
        ctx.beginPath();
        ctx.arc(320, 200, 75 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(69, 106, 80, 0.4)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Avatar circle
        ctx.beginPath();
        ctx.arc(320, 200, 70, 0, Math.PI * 2);
        ctx.fillStyle = '#1D3B27';
        ctx.fill();
        ctx.strokeStyle = '#456A50';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Initial
        ctx.fillStyle = '#A3E635';
        ctx.font = 'bold 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((name || 'U').charAt(0).toUpperCase(), 320, 202);

        // Name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(name || 'Participant', 320, 310);

        // Subtitle
        ctx.fillStyle = '#94A3B8';
        ctx.font = '14px sans-serif';
        ctx.fillText('Live Audio Stream • Camera Reserved/Standby', 320, 340);
      };

      render();
      const interval = setInterval(render, 100);
      const stream = canvas.captureStream ? canvas.captureStream(10) : null;
      if (stream) {
        const track = stream.getVideoTracks()[0];
        if (track) {
          const originalStop = track.stop.bind(track);
          track.stop = () => {
            clearInterval(interval);
            originalStop();
          };
          return track;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // --- SILENT AUDIO TRACK FALLBACK (WHEN MIC DENIED OR RESERVED) ---
  const createSilentAudioTrack = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const dst = ctx.createMediaStreamDestination();
      osc.connect(dst);
      osc.start();
      const track = dst.stream.getAudioTracks()[0];
      if (track) {
        track.enabled = false;
        return track;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // --- RECONNECT FUNCTION FOR PEER CONNECTION RECOVERY ---
  const handleReconnect = async () => {
    setConnectionStatus('CONNECTING');
    setHasRemoteVideo(false);
    remoteMediaStreamRef.current = null;
    hasHandshakedRef.current = false;
    hasAnsweredRef.current = false;
    hasPresentedRef.current = false;
    lastSignalIdRef.current = 0;
    roomOpenedAtRef.current = Date.now() - 3000;
    const stream = localStreamRef.current || localStream;
    const pc = createPeerConnection(stream);
    await sendSignal('join', { role: currentUserRole, name: currentUserName });
    if (isDoctor) {
      setTimeout(() => {
        createAndSendOffer(pc);
      }, 500);
    }
  };

  // --- RETRY CAMERA & MIC PERMISSIONS (E.G. ON MOBILE AFTER UNBLOCKING) ---
  const handleRetryPermissions = async () => {
    try {
      setMediaError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsVideoOn(true);
      setIsMicOn(true);
      originalVideoTrackRef.current = stream.getVideoTracks()[0];

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      setupAudioAnalyser(stream);

      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        const newVideoTrack = stream.getVideoTracks()[0];
        const newAudioTrack = stream.getAudioTracks()[0];

        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender && newVideoTrack) {
          videoSender.replaceTrack(newVideoTrack);
        } else if (newVideoTrack) {
          pcRef.current.addTrack(newVideoTrack, stream);
        }

        const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
        if (audioSender && newAudioTrack) {
          audioSender.replaceTrack(newAudioTrack);
        } else if (newAudioTrack) {
          pcRef.current.addTrack(newAudioTrack, stream);
        }
      }
      setSuccessToast("🎥 Camera & Microphone Connected!");
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      console.warn("Retry permission failed:", err);
      if (err.name === 'NotAllowedError') {
        setMediaError('PERMISSION_DENIED');
      } else {
        setMediaError('DEVICE_ERROR');
      }
    }
  };

  // --- INITIATE OFFER (CALLED BY DOCTOR WHEN BOTH ARE IN ROOM) ---
  const createAndSendOffer = async (pc) => {
    try {
      if (!pc || pc.signalingState === 'closed') return;
      if (hasHandshakedRef.current) {
        addDiagLog("ℹ️ Handshake already in progress, skipping duplicate offer.");
        return;
      }
      hasHandshakedRef.current = true;
      setConnectionStatus('CONNECTING');
      addDiagLog("🤝 Initiating WebRTC handshake: creating SDP offer...");
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      addDiagLog(`📝 Local description set (offer). Signaling state: ${pc.signalingState}`);
      await sendSignal('offer', offer);
      addDiagLog("🌟 Sent offer description to peer via backend signal");

      if (offerTimeoutRef.current) clearTimeout(offerTimeoutRef.current);
      offerTimeoutRef.current = setTimeout(() => {
        if (pcRef.current && pcRef.current.connectionState !== 'connected') {
          addDiagLog("⚠️ Handshake pending for 12s without connection; unlocking offer for re-negotiation.");
          hasHandshakedRef.current = false;
        }
      }, 12000);
    } catch (err) {
      addDiagLog(`❌ Offer creation failed: ${err.message}`);
      hasHandshakedRef.current = false;
    }
  };

  // --- POLL SIGNALS FROM OTHER PARTICIPANT (HTTP FALLBACK) ---
  const pollSignals = async () => {
    // When real-time WebSocket is connected, pause HTTP polling to eliminate duplicate collisions
    if (isWsConnectedRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    if (!isOpen || !appointment?.id) return;
    try {
      const res = await secureFetch(`/api/telehealth/signal/${appointment.id}/?since_id=${lastSignalIdRef.current}`);
      if (!res.ok) {
        addDiagLog(`⚠️ Signal poll HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      const signals = data.signals || [];
      if (signals.length > 0) {
        lastSignalIdRef.current = data.latest_id;
        for (const sig of signals) {
          signalsRcvdCountRef.current += 1;
          addDiagLog(`📥 [HTTP] RCVD signal #${sig.id} [${sig.signal_type}] from ${sig.sender_name || 'peer'}`);
          await handleIncomingSignal(sig.signal_type, sig.payload, sig.sender_name);
        }
      }
    } catch (err) {
      addDiagLog(`⚠️ Signal poll error: ${err.message}`);
    }
  };

  // --- PROCESS INCOMING WEBRTC SIGNAL ---
  const handleIncomingSignal = async (type, payload, senderName) => {
    if (type === 'join') {
      addDiagLog(`👋 Peer announced presence in room: ${senderName || 'Peer'}`);
      if (isDoctor) {
        let activePc = pcRef.current;
        if (activePc && activePc.connectionState === 'connected') {
          addDiagLog("Already connected to peer, skipping redundant offer.");
          return;
        }
        if (hasHandshakedRef.current) {
          addDiagLog("Offer already in progress, skipping duplicate offer.");
          return;
        }
        if (!activePc || activePc.signalingState !== 'stable' || activePc.connectionState === 'failed' || activePc.connectionState === 'disconnected') {
          activePc = createPeerConnection(localStreamRef.current || localStream);
        }
        createAndSendOffer(activePc);
      } else {
        if (!hasPresentedRef.current) {
          hasPresentedRef.current = true;
          addDiagLog("Answering peer presence with 'present' signal");
          sendSignal('present', { role: currentUserRole, name: currentUserName });
        }
      }
    } else if (type === 'present') {
      addDiagLog(`👋 Peer presented presence: ${senderName || 'Peer'}`);
      if (isDoctor) {
        let activePc = pcRef.current;
        if (activePc && activePc.connectionState === 'connected') {
          addDiagLog("Already connected, skipping redundant offer on present.");
          return;
        }
        if (hasHandshakedRef.current) {
          addDiagLog("Offer already in progress, skipping duplicate offer on present.");
          return;
        }
        if (!activePc || activePc.signalingState !== 'stable' || activePc.connectionState === 'failed' || activePc.connectionState === 'disconnected') {
          activePc = createPeerConnection(localStreamRef.current || localStream);
        }
        createAndSendOffer(activePc);
      }
    } else if (type === 'offer') {
      try {
        const activePc = pcRef.current;
        if (!activePc) {
          addDiagLog("❌ Cannot handle offer: activePc is null");
          return;
        }
        if (activePc.connectionState === 'connected') {
          addDiagLog("Already connected, ignoring extra offer.");
          return;
        }
        if (isProcessingOfferRef.current) {
          addDiagLog("⏳ Offer processing already in progress, skipping duplicate offer.");
          return;
        }
        if (activePc.signalingState !== 'stable') {
          addDiagLog(`⚠️ Ignoring extra offer because signalingState is: ${activePc.signalingState}`);
          return;
        }
        if (hasAnsweredRef.current) {
          addDiagLog("Already answered offer, skipping duplicate offer.");
          return;
        }

        isProcessingOfferRef.current = true;
        hasAnsweredRef.current = true;
        addDiagLog("🤝 Processing valid SDP offer from peer...");
        setConnectionStatus('CONNECTING');
        await activePc.setRemoteDescription(new RTCSessionDescription(payload));
        addDiagLog(`📝 Remote description set (offer). Signaling state: ${activePc.signalingState}`);

        if (activePc.signalingState === 'have-remote-offer') {
          const answer = await activePc.createAnswer();
          await activePc.setLocalDescription(answer);
          addDiagLog(`📝 Local description set (answer). Signaling state: ${activePc.signalingState}`);
          await sendSignal('answer', answer);
          addDiagLog("🌟 Created & sent single valid answer to peer");
        }

        // Flush candidate queue AFTER local answer description is set
        if (iceCandidatesQueueRef.current.length > 0) {
          addDiagLog(`Flushing ${iceCandidatesQueueRef.current.length} queued ICE candidates`);
          while (iceCandidatesQueueRef.current.length > 0) {
            const cand = iceCandidatesQueueRef.current.shift();
            try {
              await activePc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              addDiagLog(`Queued candidate add warning: ${e.message}`);
            }
          }
        }
      } catch (err) {
        addDiagLog(`❌ Error handling offer: ${err.message}`);
      } finally {
        isProcessingOfferRef.current = false;
      }
    } else if (type === 'answer') {
      try {
        addDiagLog("🤝 Processing SDP answer from patient/peer...");
        hasHandshakedRef.current = true;
        const activePc = pcRef.current;
        if (activePc && activePc.signalingState === 'have-local-offer') {
          await activePc.setRemoteDescription(new RTCSessionDescription(payload));
          addDiagLog(`📝 Remote description set (answer). Signaling state: ${activePc.signalingState}`);
          setConnectionStatus('CONNECTED');
          // Flush candidate queue
          if (iceCandidatesQueueRef.current.length > 0) {
            addDiagLog(`Flushing ${iceCandidatesQueueRef.current.length} queued ICE candidates`);
            while (iceCandidatesQueueRef.current.length > 0) {
              const cand = iceCandidatesQueueRef.current.shift();
              await activePc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => {
                addDiagLog(`Queued candidate add warning: ${e.message}`);
              });
            }
          }
        } else {
          addDiagLog(`⚠️ Ignoring answer: peerConnection signalingState is '${activePc?.signalingState}'`);
        }
      } catch (err) {
        addDiagLog(`❌ Error handling answer: ${err.message}`);
      }
    } else if (type === 'candidate') {
      try {
        if (payload && payload.candidate) {
          candidatesRcvdCountRef.current += 1;
          const activePc = pcRef.current;
          if (!activePc || !activePc.remoteDescription || !activePc.remoteDescription.type) {
            iceCandidatesQueueRef.current.push(payload);
            addDiagLog(`Queued remote ICE candidate (waiting for remote description). Queue size: ${iceCandidatesQueueRef.current.length}`);
          } else {
            await activePc.addIceCandidate(new RTCIceCandidate(payload));
            addDiagLog(`❄️ Added remote ICE candidate: ${payload.candidate?.slice(0, 35)}...`);
          }
        }
      } catch (err) {
        addDiagLog(`❌ Error adding remote candidate: ${err.message}`);
      }
    } else if (type === 'leave') {
      addDiagLog("👋 Peer left consultation room");
      setRemoteStream(null);
      setConnectionStatus('DISCONNECTED');
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    } else if (type === 'chat') {
      setInCallMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: senderName || remotePersonName,
          role: isDoctor ? 'PATIENT' : 'NUTRITIONIST',
          text: payload.text || '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // --- INITIALIZE ROOM & MEDIA ---
  useEffect(() => {
    if (!isOpen) return;

    let localMediaStream = null;

    const startConsultation = async () => {
      try {
        setMediaError('');
        addDiagLog(`🚀 Starting consultation studio: room #${appointment?.id}, role=${currentUserRole}, user=${currentUserName}`);

        // 1. Establish baseline signal id so we ignore historical signals from earlier sessions
        try {
          addDiagLog(`Syncing baseline signal ID from room #${appointment?.id}...`);
          const initRes = await secureFetch(`/api/telehealth/signal/${appointment.id}/?since_id=0`);
          if (initRes.ok) {
            const initData = await initRes.json();
            lastSignalIdRef.current = initData.latest_id || 0;
            addDiagLog(`✅ Baseline signal ID established: #${lastSignalIdRef.current}`);
          }
        } catch (initErr) {
          addDiagLog(`⚠️ Baseline sync warning: ${initErr.message}`);
        }

        // 2. Request local media devices
        let stream = null;
        try {
          addDiagLog("Requesting local camera and microphone via getUserMedia...");
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: true
          });
          const vTrack = stream.getVideoTracks()[0];
          const aTrack = stream.getAudioTracks()[0];
          addDiagLog(`🎥 Local media acquired successfully: video=${vTrack?.label || 'camera'} (${vTrack?.readyState}), audio=${aTrack?.label || 'mic'} (${aTrack?.readyState})`);
        } catch (mediaErr) {
          addDiagLog(`❌ Local camera/audio capture failed: ${mediaErr.name} - ${mediaErr.message}`);
          if (mediaErr.name === 'NotAllowedError') {
            setMediaError('PERMISSION_DENIED');
          } else {
            setMediaError('DEVICE_ERROR');
          }
          try {
            addDiagLog("Attempting audio-only fallback...");
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream = audioStream;
            setIsVideoOn(false);
            addDiagLog("🎤 Audio-only stream acquired");
          } catch (audioErr) {
            addDiagLog(`❌ Audio access also failed: ${audioErr.message}. Generating virtual fallback stream.`);
            const tracks = [];
            const vTrack = createVirtualVideoTrack(currentUserName);
            if (vTrack) tracks.push(vTrack);
            const aTrack = createSilentAudioTrack();
            if (aTrack) tracks.push(aTrack);
            stream = new MediaStream(tracks);
            setIsVideoOn(false);
            setIsMicOn(false);
          }
        }

        localMediaStream = stream;
        setLocalStream(stream);
        originalVideoTrackRef.current = stream.getVideoTracks()[0];

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        setupAudioAnalyser(stream);

        // 3. Setup WebRTC peer connection
        const pc = createPeerConnection(stream);
        setConnectionStatus('WAITING_FOR_PEER');

        // 4. Initialize real-time WebSocket connection (with automatic HTTP fallback)
        setupWebSocket();

        // 5. Fallback polling timer (only active if WebSocket is disconnected)
        pollingTimerRef.current = setInterval(pollSignals, 1500);
        setSuccessToast("🎥 Telehealth Studio Ready");
        setTimeout(() => setSuccessToast(''), 3000);

      } catch (err) {
        addDiagLog(`❌ WebRTC startup fatal error: ${err.message}`);
        setConnectionStatus('FAILED');
      }
    };

    startConsultation();

    // Call duration timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      if (offerTimeoutRef.current) clearTimeout(offerTimeoutRef.current);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
        wsRef.current = null;
      }
      if (pcRef.current) {
        addDiagLog("Closing RTCPeerConnection on cleanup");
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localMediaStream) {
        localMediaStream.getTracks().forEach(t => t.stop());
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isOpen]);

  // --- PERIODIC WEBRTC HEALTH INSPECTOR (RUNS EVERY SECOND) ---
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const pc = pcRef.current;
      const vEl = remoteVideoRef.current;
      const lStream = localStreamRef.current || localStream;
      const rStream = remoteMediaStreamRef.current;

      const vTrack = rStream?.getVideoTracks().find(t => t.readyState === 'live');
      const aTrack = rStream?.getAudioTracks().find(t => t.readyState === 'live');

      setDiagMetrics({
        localAudio: lStream?.getAudioTracks()[0] ? `${lStream.getAudioTracks()[0].readyState} (enabled: ${lStream.getAudioTracks()[0].enabled})` : 'none',
        localVideo: lStream?.getVideoTracks()[0] ? `${lStream.getVideoTracks()[0].readyState} (enabled: ${lStream.getVideoTracks()[0].enabled})` : 'none',
        signalingState: pc?.signalingState || 'none',
        connectionState: pc?.connectionState || 'none',
        iceConnectionState: pc?.iceConnectionState || 'none',
        iceGatheringState: pc?.iceGatheringState || 'none',
        remoteAudioTrack: aTrack ? `${aTrack.readyState} (muted: ${aTrack.muted})` : 'none',
        remoteVideoTrack: vTrack ? `${vTrack.readyState} (muted: ${vTrack.muted})` : 'none',
        videoReadyState: vEl ? vEl.readyState : -1,
        videoDims: vEl && vEl.videoWidth ? `${vEl.videoWidth}x${vEl.videoHeight}` : '0x0',
        videoPlaying: vEl ? (!vEl.paused && !vEl.ended) : false,
        videoCurrentTime: vEl ? Number(vEl.currentTime.toFixed(1)) : 0,
        signalsSent: signalsSentCountRef.current,
        signalsRcvd: signalsRcvdCountRef.current,
        candidatesSent: candidatesSentCountRef.current,
        candidatesRcvd: candidatesRcvdCountRef.current
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, localStream]);

  // --- ATTACH REMOTE MEDIA TO DEDICATED VIDEO & AUDIO ELEMENTS ---
  const attachRemoteMedia = () => {
    const stream = remoteMediaStreamRef.current;
    if (!stream) {
      addDiagLog("attachRemoteMedia: stream is null");
      return;
    }

    // Attach stream to remote <video>
    const vTrack = stream.getVideoTracks().find(t => t.readyState === 'live');
    if (vTrack) {
      setHasRemoteVideo(true);
      setConnectionStatus('CONNECTED');
      if (remoteVideoRef.current) {
        if (remoteVideoRef.current.srcObject !== stream) {
          addDiagLog(`📺 Binding live remote stream (${vTrack.id}) to <video> element`);
          remoteVideoRef.current.muted = true;
          remoteVideoRef.current.srcObject = stream;
        }
        remoteVideoRef.current.muted = true;
        const playPromise = remoteVideoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            addDiagLog(`⚠️ Remote video play rejected: ${e.message}`);
          });
        }
      } else {
        addDiagLog("📺 Live video track ready, remoteVideoRef pending mount");
      }
    } else {
      setHasRemoteVideo(false);
    }

    // Attach stream to remote <audio>
    const aTrack = stream.getAudioTracks().find(t => t.readyState === 'live');
    if (remoteAudioRef.current && aTrack) {
      if (remoteAudioRef.current.srcObject !== stream) {
        addDiagLog(`🔊 Binding live remote audio (${aTrack.id}) to <audio> element`);
        remoteAudioRef.current.srcObject = stream;
      }
      const playPromise = remoteAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          addDiagLog(`⚠️ Remote audio play rejected: ${e.message}`);
        });
      }
    }
  };

  // Dedicated callback refs ensuring immediate video and audio playback
  const handleLocalVideoRef = (el) => {
    localVideoRef.current = el;
    if (el && localStream) {
      if (el.srcObject !== localStream) el.srcObject = localStream;
      el.play().catch(() => {});
    }
  };

  const handleRemoteVideoRef = (el) => {
    remoteVideoRef.current = el;
    if (el) {
      el.muted = true;
      attachRemoteMedia();
    }
  };

  const handleRemoteAudioRef = (el) => {
    remoteAudioRef.current = el;
    if (el) {
      attachRemoteMedia();
    }
  };

  // Keep local video attached when re-rendering
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, isVideoOn, isSwappedView]);

  // Keep remote media attached when re-rendering
  useEffect(() => {
    attachRemoteMedia();
  }, [remoteStream, hasRemoteVideo, isSwappedView]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeSidePanel === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [inCallMessages, activeSidePanel]);

  if (!isOpen) return null;

  // Format timer
  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // --- TOGGLE MIC ---
  const handleToggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  // --- TOGGLE VIDEO (SHUTS OFF HARDWARE SENSOR & LED LIGHT) ---
  const handleToggleVideo = async () => {
    if (isVideoOn) {
      // User turning camera off: stop track to physically turn off camera hardware light!
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
        }
      }
      setIsVideoOn(false);
      // Replace with virtual track in peer connection senders
      if (pcRef.current) {
        const vTrack = createVirtualVideoTrack(currentUserName);
        const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender && vTrack) {
          sender.replaceTrack(vTrack);
        }
      }
    } else {
      // User turning camera on: re-acquire physical camera hardware
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (newVideoTrack && localStream) {
          const oldTrack = localStream.getVideoTracks()[0];
          if (oldTrack) localStream.removeTrack(oldTrack);
          localStream.addTrack(newVideoTrack);
          originalVideoTrackRef.current = newVideoTrack;
          localStreamRef.current = localStream;

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(() => {});
          }

          if (pcRef.current) {
            const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(newVideoTrack);
            }
          }
        }
        setIsVideoOn(true);
      } catch (err) {
        console.warn("Failed to re-enable camera:", err);
      }
    }
  };

  // --- TOGGLE SCREEN SHARING ---
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert back to camera
      if (pcRef.current && originalVideoTrackRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(originalVideoTrackRef.current);
      }
      setIsScreenSharing(false);
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        setIsScreenSharing(true);

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream;
        }

        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          if (pcRef.current && originalVideoTrackRef.current) {
            const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(originalVideoTrackRef.current);
          }
          setIsScreenSharing(false);
        };
      }
    } catch (e) {
      setIsScreenSharing(false);
    }
  };

  // --- SEND CHAT MESSAGE ---
  const handleSendInCallChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: currentUserName,
      role: currentUserRole,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setInCallMessages(prev => [...prev, newMsg]);
    const textToSend = chatInput.trim();
    setChatInput('');

    // Broadcast across WebRTC signalling to peer
    await sendSignal('chat', { text: textToSend });
  };

  // --- SAVE DOCTOR CLINICAL NOTES TO BACKEND ---
  const handleSaveNotes = async () => {
    setNotesSaving(true);
    try {
      if (appointment?.id) {
        await secureFetch(`/api/telehealth/notes/${appointment.id}/`, {
          method: 'POST',
          body: JSON.stringify({ doctorNotes, prescriptionNote })
        });
      }
      if (onSaveNotes) {
        onSaveNotes({
          appointment_id: appointment?.id,
          doctorNotes,
          prescriptionNote,
          timestamp: new Date().toISOString()
        });
      }
      setNotesSavedAlert(true);
      setTimeout(() => setNotesSavedAlert(false), 3000);
    } catch (err) {
      alert("Failed to save clinical notes to server.");
    } finally {
      setNotesSaving(false);
    }
  };

  // --- END CALL ---
  const handleEndCall = () => {
    if (window.confirm("Are you sure you want to end this live telehealth consultation?")) {
      sendSignal('leave', {});
      if (localStream) localStream.getTracks().forEach(t => t.stop());
      if (pcRef.current) pcRef.current.close();
      onClose();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[120] bg-[#07110A] text-white flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-300"
    >
      {/* 🌟 TOP STUDIO HEADER 🌟 */}
      <div className="h-16 bg-[#0E1A12]/95 backdrop-blur-md border-b border-[#233829] px-5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center font-black text-white shadow-md border border-emerald-500/40">
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-sm tracking-tight text-white">Healora Telehealth Video Studio</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                connectionStatus === 'CONNECTED' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : connectionStatus === 'CONNECTING'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span> 
                {connectionStatus === 'CONNECTED' ? 'LIVE P2P WEBRTC' : connectionStatus}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 flex items-center gap-1.5 font-medium">
              <ShieldCheck size={12} className="text-emerald-400" /> End-to-End Encrypted WebRTC Session
            </p>
          </div>
        </div>

        {/* Center: Live Call Timer */}
        <div className="flex items-center gap-2 bg-[#142318] border border-[#2D4533] px-4 py-1.5 rounded-full shadow-inner">
          <span className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-red-500 animate-ping' : 'bg-gray-400'}`}></span>
          <Clock size={14} className="text-gray-300" />
          <span className="font-mono font-black text-sm text-emerald-300 tracking-wider">
            {formatTimer(callDuration)}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1 border-l border-gray-600">
            Room #{appointment?.id || 'CONSULT'}
          </span>
        </div>

        {/* Right: Remote Participant Info */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-right">
            <div>
              <p className="text-xs font-bold text-white leading-tight">{remotePersonName}</p>
              <p className="text-[10px] text-emerald-400 font-semibold">{remotePersonTitle}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1C3323] border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-300">
              {remotePersonName.charAt(0)}
            </div>
          </div>

          <button 
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
              else document.exitFullscreen();
              setIsFullscreen(!isFullscreen);
            }} 
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* 🌟 MAIN STAGE: REMOTE LIVE VIDEO + LOCAL PREVIEW PIP 🌟 */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* VIDEO DISPLAY AREA */}
        <div className="flex-1 relative flex items-center justify-center bg-[#050C07] p-2 sm:p-4">
          
          {successToast && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40 bg-emerald-950/95 border border-emerald-400 text-emerald-100 px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-2xl backdrop-blur-md animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span className="font-bold">{successToast}</span>
            </div>
          )}

          {mediaError === 'PERMISSION_DENIED' && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg bg-red-950/95 border-2 border-red-500 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-600/30 border border-red-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock size={16} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs sm:text-sm font-black text-red-200">Camera / Microphone Access Blocked</h4>
                  <p className="text-[11px] text-red-100/90 mt-1 leading-relaxed">
                    Your browser blocked camera or mic permission. To unblock:
                  </p>
                  <ol className="text-[11px] text-amber-200 list-decimal pl-4 mt-1 space-y-0.5">
                    <li>Tap the <strong>lock 🔒 or tune icon</strong> in your browser address bar</li>
                    <li>Toggle <strong>Camera</strong> and <strong>Microphone</strong> to <strong>Allow</strong></li>
                  </ol>
                  <div className="mt-3 flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={handleRetryPermissions}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
                    >
                      <RefreshCw size={12} /> Allow & Retry Camera
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setMediaError('')}
                      className="text-gray-400 hover:text-white px-2 py-1 text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(connectionStatus === 'FAILED' || connectionStatus === 'DISCONNECTED') && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md bg-amber-950/95 border-2 border-amber-500 text-white p-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={18} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-200">
                    {connectionStatus === 'DISCONNECTED' ? 'Call In Standby / Peer Disconnected' : 'Handshake Timeout'}
                  </p>
                  <p className="text-[10px] text-amber-300/80">
                    {connectionStatus === 'DISCONNECTED' ? 'Tap Reconnect to re-join and refresh video streams.' : 'Other participant took long to join or denied permissions.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReconnect}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs shrink-0 cursor-pointer shadow flex items-center gap-1"
              >
                <RefreshCw size={12} /> Reconnect
              </button>
            </div>
          )}

          {/* MAIN STAGE (SHOWS REMOTE LIVE VIDEO OR WAITING SCREEN) */}
          <div className="w-full h-full rounded-3xl overflow-hidden relative bg-[#09140C] border border-[#1E3324] shadow-2xl flex items-center justify-center">
            
            {/* Screen Share Overlay */}
            {isScreenSharing ? (
              <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain bg-black" />
            ) : remoteStream || connectionStatus === 'CONNECTED' ? (
              /* 🌟 GENUINE REMOTE LIVE WEBRTC VIDEO STREAM 🌟 */
              <div className="w-full h-full relative flex items-center justify-center">
                <audio ref={handleRemoteAudioRef} autoPlay playsInline className="hidden" />
                <video 
                  ref={handleRemoteVideoRef} 
                  autoPlay 
                  playsInline 
                  muted={true}
                  onPlaying={() => {
                    addDiagLog("📺 Remote <video> onPlaying event fired: live frames decoding!");
                    setHasRemoteVideo(true);
                  }}
                  onCanPlay={() => {
                    addDiagLog("📺 Remote <video> onCanPlay event fired");
                    setHasRemoteVideo(true);
                  }}
                  onLoadedData={() => {
                    addDiagLog("📺 Remote <video> onLoadedData event fired");
                    setHasRemoteVideo(true);
                  }}
                  onLoadedMetadata={(e) => {
                    addDiagLog(`📺 Remote <video> onLoadedMetadata: dimensions=${e.target.videoWidth}x${e.target.videoHeight}`);
                    e.target.muted = true;
                    e.target.play().catch(err => {
                      addDiagLog(`⚠️ Remote <video> play rejected onLoadedMetadata: ${err.message}`);
                    });
                    setHasRemoteVideo(true);
                  }}
                  className="w-full h-full object-cover"
                />
                {!hasRemoteVideo && (!remoteMediaStreamRef.current?.getVideoTracks()?.some(t => t.readyState === 'live')) && (
                  <div className="absolute inset-0 z-10 overflow-hidden bg-gradient-to-b from-[#0B1A10] to-[#040A06] flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                    <div className="relative mb-5">
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 border-4 border-emerald-400/80 flex items-center justify-center text-white text-4xl font-black shadow-2xl">
                        {remotePersonName.charAt(0)}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-[#0B1A10] flex items-center justify-center text-white shadow-lg animate-pulse">
                        <Mic size={16} />
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight mb-1">
                      {remotePersonName}
                    </h3>
                    <p className="text-xs text-emerald-300 font-semibold mb-3">
                      {remotePersonTitle}
                    </p>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3.5 py-1.5 rounded-full inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Audio Consultation Active (Camera Off)
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* WAITING FOR REMOTE PEER OR CONNECTING */
              <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#0B1A10] to-[#040A06] flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-5">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-emerald-700 to-teal-900 border-2 border-emerald-400/80 flex items-center justify-center text-white text-3xl font-black shadow-2xl">
                    {remotePersonName.charAt(0)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 border-2 border-[#0B1A10] flex items-center justify-center text-white shadow-lg animate-spin">
                    <RefreshCw size={14} />
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mb-1">
                  {connectionStatus === 'CONNECTING' ? 'Establishing P2P WebRTC Connection...' : `Waiting for ${remotePersonName}...`}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-300 font-medium mb-4 max-w-md">
                  {connectionStatus === 'CONNECTING' 
                    ? 'Exchanging ICE candidates and establishing live media pipeline...'
                    : `${remotePersonName} has been assigned to Room #${appointment?.id}. Both streams will connect automatically once online.`}
                </p>

                {mediaError === 'PERMISSION_DENIED' && (
                  <div className="bg-red-950/80 border border-red-500/60 text-red-100 p-4 rounded-2xl max-w-md text-xs mb-4">
                    <p className="font-bold mb-1 flex items-center justify-center gap-1.5">
                      <Lock size={14}/> Camera & Microphone Access Denied
                    </p>
                    <p className="text-[11px] text-gray-300">Please click the camera/lock icon in your browser address bar and set permissions to Allow.</p>
                  </div>
                )}
              </div>
            )}

            {/* 🌟 PICTURE-IN-PICTURE (PIP): LOCAL WEBCAM PREVIEW 🌟 */}
            <div className="absolute bottom-5 right-5 z-20 w-44 sm:w-56 h-32 sm:h-40 rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/50 bg-black flex items-center justify-center group">
              {isVideoOn && localStream && localStream.getVideoTracks().some(t => t.enabled && t.readyState === 'live') ? (
                <video 
                  ref={handleLocalVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  onLoadedMetadata={(e) => e.target.play().catch(() => {})}
                  className="w-full h-full object-cover transform -scale-x-100" 
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 text-xs p-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#1C3323] border border-emerald-500/40 flex items-center justify-center text-sm font-bold text-emerald-300 mb-1">
                    {currentUserName.charAt(0)}
                  </div>
                  <span className="text-[11px] font-bold text-gray-300">{isVideoOn ? 'Camera Reserved' : 'Camera Off'}</span>
                  <span className="text-[9px] text-emerald-400 mt-0.5">Microphone Active</span>
                </div>
              )}
              <div className="absolute bottom-1.5 left-2 bg-black/70 px-2 py-0.5 rounded-md text-[10px] font-bold text-white">
                You ({currentUserName})
              </div>
            </div>

            {/* Top Tag: Connection State (clickable to open diagnostics) */}
            <button
              type="button"
              onClick={() => setActiveSidePanel(prev => prev === 'diagnostics' ? '' : 'diagnostics')}
              className="absolute top-4 left-4 z-10 bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 cursor-pointer transition shadow-lg"
              title="Click to view live WebRTC Diagnostics"
            >
              <span className={`w-2 h-2 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`}></span>
              <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-widest font-bold">
                {connectionStatus === 'CONNECTED' ? 'Two-Way Audio & Video Live' : connectionStatus}
              </span>
              <span className="text-[9px] bg-white/10 hover:bg-white/20 text-emerald-200 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                <Activity size={10} /> Diag
              </span>
            </button>
          </div>
        </div>

        {/* 🌟 SIDE PANEL: LIVE IN-CALL CHAT, CLINICAL NOTES & WEBRTC DIAGNOSTICS 🌟 */}
        {activeSidePanel && (
          <div className="w-80 sm:w-96 bg-[#0B170F] border-l border-[#1F3325] flex flex-col z-20 shrink-0">
            {/* Panel Header */}
            <div className="h-14 border-b border-[#1F3325] px-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                {activeSidePanel === 'chat' && <><MessageSquare size={16} /><span>In-Call Real-Time Chat</span></>}
                {activeSidePanel === 'clinical' && <><FileText size={16} /><span>Doctor Consultation Notes</span></>}
                {activeSidePanel === 'diagnostics' && <><Activity size={16} className="text-amber-400" /><span className="text-amber-300 font-bold">WebRTC Diagnostics (Live)</span></>}
              </div>
              <button 
                type="button"
                onClick={() => setActiveSidePanel('')}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Panel Body: Chat */}
            {activeSidePanel === 'chat' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {inCallMessages.map(msg => (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${msg.role === 'SYSTEM' ? 'items-center' : msg.sender === currentUserName ? 'items-end' : 'items-start'}`}
                    >
                      {msg.role === 'SYSTEM' ? (
                        <div className="bg-[#14261B] text-gray-300 text-[10px] px-3 py-1 rounded-full border border-[#27402F]">
                          {msg.text}
                        </div>
                      ) : (
                        <div className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-md ${
                          msg.sender === currentUserName 
                            ? 'bg-emerald-700 text-white rounded-br-xs' 
                            : 'bg-[#182C1F] text-gray-200 border border-[#27402F] rounded-bl-xs'
                        }`}>
                          <div className="flex justify-between items-center gap-2 text-[10px] text-emerald-200 mb-1 font-bold">
                            <span>{msg.sender}</span>
                            <span className="text-gray-400">{msg.time}</span>
                          </div>
                          <p>{msg.text}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                <form onSubmit={handleSendInCallChat} className="p-3 border-t border-[#1F3325] flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Type in-call message..."
                    className="flex-1 bg-[#132218] border border-[#27402F] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  <button 
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl transition cursor-pointer"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}

            {/* Panel Body: Clinical Notes (Doctor only) */}
            {activeSidePanel === 'clinical' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-300 mb-1 uppercase tracking-wider">
                      Clinical Findings & Vitals
                    </label>
                    <textarea 
                      rows={5}
                      value={doctorNotes}
                      onChange={e => setDoctorNotes(e.target.value)}
                      placeholder="Record observation, BP, blood glucose, metabolic progress..."
                      className="w-full bg-[#132218] border border-[#27402F] rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-300 mb-1 uppercase tracking-wider">
                      Prescription & Action Protocol
                    </label>
                    <textarea 
                      rows={4}
                      value={prescriptionNote}
                      onChange={e => setPrescriptionNote(e.target.value)}
                      placeholder="Prescribe Kerala diet adjustments, hydration target, supplements..."
                      className="w-full bg-[#132218] border border-[#27402F] rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  {notesSavedAlert && (
                    <div className="bg-emerald-900/80 border border-emerald-400 text-emerald-100 text-xs p-2.5 rounded-xl mb-2 flex items-center gap-2">
                      <CheckCircle2 size={16} /> Saved to patient permanent health record!
                    </div>
                  )}
                  <button 
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={notesSaving}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    {notesSaving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {notesSaving ? 'Saving to Database...' : 'Save Notes to PostgreSQL'}
                  </button>
                </div>
              </div>
            )}

            {/* Panel Body: Real-Time WebRTC Diagnostics */}
            {activeSidePanel === 'diagnostics' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar flex flex-col justify-between text-xs">
                <div className="space-y-3">
                  {/* Copy Report Button */}
                  <button 
                    type="button"
                    onClick={() => {
                      const reportData = {
                        app: "Healora Telehealth WebRTC",
                        timestamp: new Date().toISOString(),
                        room: appointment?.id,
                        currentUser: { role: currentUserRole, name: currentUserName },
                        metrics: diagMetrics,
                        recentLogs: diagLogs
                      };
                      const reportText = JSON.stringify(reportData, null, 2);
                      navigator.clipboard.writeText(reportText).then(() => {
                        setSuccessToast("📋 Diagnostic report copied to clipboard!");
                        setTimeout(() => setSuccessToast(''), 3000);
                      }).catch(() => {
                        prompt("Copy Diagnostic Report JSON:", reportText);
                      });
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                  >
                    <FileText size={14} /> Copy Diagnostic Report (JSON)
                  </button>

                  {/* Summary Metric Badges */}
                  <div className="bg-[#132218] border border-[#27402F] rounded-2xl p-3 space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between items-center text-gray-300 border-b border-white/5 pb-1.5">
                      <span>Room / Role</span>
                      <span className="text-emerald-400 font-bold">#{appointment?.id} • {currentUserRole}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300 border-b border-white/5 pb-1.5">
                      <span>Peer Connection</span>
                      <span className={`font-bold ${diagMetrics.connectionState === 'connected' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {diagMetrics.connectionState}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300 border-b border-white/5 pb-1.5">
                      <span>ICE Connection</span>
                      <span className={`font-bold ${diagMetrics.iceConnectionState === 'connected' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {diagMetrics.iceConnectionState}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300 border-b border-white/5 pb-1.5">
                      <span>Signaling State</span>
                      <span className="text-gray-300">{diagMetrics.signalingState}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300 border-b border-white/5 pb-1.5">
                      <span>Local Media</span>
                      <span className="text-gray-200">
                        {diagMetrics.localVideo !== 'none' ? '🎥 live' : '❌ off'} • {diagMetrics.localAudio !== 'none' ? '🎤 live' : '❌ off'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300 border-b border-white/5 pb-1.5">
                      <span>Remote Video Track</span>
                      <span className={diagMetrics.remoteVideoTrack !== 'none' ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                        {diagMetrics.remoteVideoTrack}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300 border-b border-white/5 pb-1.5">
                      <span>Remote Video Element</span>
                      <span className="text-gray-200">ready: {diagMetrics.videoReadyState} • dims: {diagMetrics.videoDims}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300 pt-0.5">
                      <span>Signals / Candidates</span>
                      <span className="text-gray-200">Sent: {diagMetrics.signalsSent} | Rcvd: {diagMetrics.signalsRcvd} | ICE: {diagMetrics.candidatesRcvd}</span>
                    </div>
                  </div>

                  {/* Live Event Log Box */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Real-Time Event Stream ({diagLogs.length})
                    </span>
                    <div className="bg-[#060D08] border border-[#1E3324] rounded-xl p-2.5 h-64 overflow-y-auto font-mono text-[10px] space-y-1 custom-scrollbar text-emerald-300/90 select-text">
                      {diagLogs.length === 0 ? (
                        <p className="text-gray-500 italic">No events logged yet...</p>
                      ) : (
                        diagLogs.map((log, idx) => (
                          <div key={idx} className="leading-tight border-b border-white/5 pb-1">
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🌟 BOTTOM CONTROL DOCK 🌟 */}
      <div className="h-20 bg-[#0A160F] border-t border-[#1F3325] px-6 flex items-center justify-between z-20 shrink-0">
        
        {/* Left: Device indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#122317] border border-[#27402F] px-3 py-1.5 rounded-xl text-xs">
            {isMicOn ? <Mic size={14} className="text-emerald-400" /> : <MicOff size={14} className="text-red-400" />}
            <span className="text-[11px] font-medium text-gray-300">{isMicOn ? 'Mic Active' : 'Muted'}</span>
            {isMicOn && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ opacity: Math.max(0.3, micVolume / 100) }}></span>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-[#122317] border border-[#27402F] px-3 py-1.5 rounded-xl text-xs">
            {isVideoOn ? <Video size={14} className="text-emerald-400" /> : <VideoOff size={14} className="text-red-400" />}
            <span className="text-[11px] font-medium text-gray-300">{isVideoOn ? 'Cam Active' : 'Cam Off'}</span>
          </div>
        </div>

        {/* Center: Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Mic Button */}
          <button 
            type="button"
            onClick={handleToggleMic}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer shadow-lg ${
              isMicOn ? 'bg-[#182F20] hover:bg-[#203D2A] text-white border border-[#2D543A]' : 'bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700'
            }`}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Camera Button */}
          <button 
            type="button"
            onClick={handleToggleVideo}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer shadow-lg ${
              isVideoOn ? 'bg-[#182F20] hover:bg-[#203D2A] text-white border border-[#2D543A]' : 'bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700'
            }`}
            title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
          >
            {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* Screen Share Button */}
          <button 
            type="button"
            onClick={handleToggleScreenShare}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer shadow-lg ${
              isScreenSharing ? 'bg-amber-600 text-white' : 'bg-[#182F20] hover:bg-[#203D2A] text-white border border-[#2D543A]'
            }`}
            title="Share Screen"
          >
            {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
          </button>

          {/* End Call Button */}
          <button 
            type="button"
            onClick={handleEndCall}
            className="w-14 h-12 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition cursor-pointer shadow-xl shadow-red-600/30 font-bold gap-1 ml-2"
            title="Leave & End Consultation"
          >
            <PhoneOff size={20} />
          </button>
        </div>

        {/* Right: Drawer toggles */}
        <div className="flex items-center gap-2">
          {/* Diagnostics Button */}
          <button 
            type="button"
            onClick={() => setActiveSidePanel(prev => prev === 'diagnostics' ? '' : 'diagnostics')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSidePanel === 'diagnostics' ? 'bg-amber-600 text-white' : 'bg-[#122317] hover:bg-[#182F20] text-amber-300 border border-amber-600/40'
            }`}
            title="Open WebRTC Diagnostics Panel"
          >
            <Activity size={16} />
            <span className="hidden sm:inline">Diagnostics</span>
          </button>

          {/* Chat Toggle */}
          <button 
            type="button"
            onClick={() => setActiveSidePanel(prev => prev === 'chat' ? '' : 'chat')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSidePanel === 'chat' ? 'bg-emerald-600 text-white' : 'bg-[#122317] hover:bg-[#182F20] text-gray-300 border border-[#27402F]'
            }`}
          >
            <MessageSquare size={16} />
            <span className="hidden sm:inline">In-Call Chat</span>
          </button>

          {/* Doctor Clinical Notes Toggle (Nutritionist only) */}
          {isDoctor && (
            <button 
              type="button"
              onClick={() => setActiveSidePanel(prev => prev === 'clinical' ? '' : 'clinical')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeSidePanel === 'clinical' ? 'bg-emerald-600 text-white' : 'bg-[#122317] hover:bg-[#182F20] text-gray-300 border border-[#27402F]'
              }`}
            >
              <FileText size={16} />
              <span className="hidden sm:inline">Clinical Notes</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelehealthVideoRoom;
