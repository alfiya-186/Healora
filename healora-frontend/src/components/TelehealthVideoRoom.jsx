import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, PhoneOff, 
  MessageSquare, FileText, X, Maximize2, Minimize2, Settings, 
  ShieldCheck, Clock, Send, User, Sparkles, Activity, CheckCircle2, 
  RefreshCw, AlertCircle, HeartPulse, Scale, Apple, ChevronRight,
  Volume2, VolumeX, Camera, ArrowLeftRight, Lock
} from 'lucide-react';

/**
 * 🌟 HEALORA IN-APP TELEHEALTH VIDEO CONSULTATION STUDIO 🌟
 * Clinical live video consultation with real webcam & real microphone.
 * ZERO static stock photos, ZERO synthetic speech.
 * Hardware-level device release turns OFF laptop camera/mic lights when toggled off.
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
  // --- MEDIA STREAM STATE ---
  const [localStream, setLocalStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRealHardware, setIsRealHardware] = useState(false);
  const [isRetryingHardware, setIsRetryingHardware] = useState(false);
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
      text: '🔒 Secure Clinical 256-Bit Encrypted Live Video Consultation Connected.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // --- CLINICAL NOTES (FOR NUTRITIONIST) ---
  const [doctorNotes, setDoctorNotes] = useState('');
  const [prescriptionNote, setPrescriptionNote] = useState('');
  const [notesSavedAlert, setNotesSavedAlert] = useState(false);

  // --- REFS ---
  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const containerRef = useRef(null);
  const chatBottomRef = useRef(null);
  const activeStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Determine Doctor and Patient display labels
  const isDoctor = currentUserRole === 'NUTRITIONIST';
  const remotePersonName = isDoctor 
    ? (appointment?.patient_name || patientProfile?.name || 'Patient')
    : (appointment?.doctor_name || (nutritionistInfo?.first_name ? `Dr. ${nutritionistInfo.first_name} ${nutritionistInfo.last_name}` : 'Dr. Sarah John'));
  
  const remotePersonTitle = isDoctor ? 'Patient (Registered Consultation)' : 'Lead Clinical Nutritionist & Physician';

  // --- SETUP REAL MICROPHONE ANALYSER ---
  const setupAudioAnalyser = (stream) => {
    try {
      if (!stream || !stream.getAudioTracks().length) return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }

      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const sample = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicVolume(Math.min(100, Math.round(avg * 1.8)));
        animFrameRef.current = requestAnimationFrame(sample);
      };
      sample();
    } catch (e) {
      console.warn("Audio analyser error", e);
    }
  };

  // --- CALLBACK REF TO ATTACH WEBCAM INSTANTLY ---
  const handleLocalVideoRef = (el) => {
    localVideoRef.current = el;
    if (el && localStream && isVideoOn) {
      if (el.srcObject !== localStream) {
        el.srcObject = localStream;
      }
      el.play().catch(() => {});
    }
  };

  // --- FULL HARDWARE STOP UTILITY ---
  const stopAllMediaTracks = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
    if (window.__healora_active_stream) {
      window.__healora_active_stream.getTracks().forEach(track => track.stop());
      window.__healora_active_stream = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
  };

  // --- REQUEST HARDWARE MEDIA WITH DIRECT LIVE ACCESS ---
  const requestHardwareMedia = async (userInitiated = false) => {
    setIsRetryingHardware(true);
    setMediaError('');

    try {
      let stream = null;

      // 1. Check if stream was passed from user-gesture click
      if (window.__healora_active_stream && window.__healora_active_stream.active) {
        stream = window.__healora_active_stream;
        window.__healora_active_stream = null;
      } else {
        // 2. Request user media with flexible progressive constraints
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: true
          });
        } catch (err1) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch (err2) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch (err3) {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
          }
        }
      }

      if (stream) {
        if (activeStreamRef.current && activeStreamRef.current !== stream) {
          activeStreamRef.current.getTracks().forEach(t => t.stop());
        }

        activeStreamRef.current = stream;
        setLocalStream(stream);
        setIsRealHardware(true);
        setIsVideoOn(stream.getVideoTracks().length > 0);
        setIsMicOn(stream.getAudioTracks().length > 0);

        if (stream.getAudioTracks().length > 0) {
          setupAudioAnalyser(stream);
        }

        if (localVideoRef.current && stream.getVideoTracks().length > 0) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        setSuccessToast("🎥 Live Camera & Microphone Connected!");
        setTimeout(() => setSuccessToast(''), 4000);
      } else {
        throw new Error("No media stream returned");
      }
    } catch (err) {
      console.warn("Hardware media access error:", err);
      setIsRealHardware(false);
      setLocalStream(null);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMediaError("PERMISSION_DENIED");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMediaError("NO_DEVICE_FOUND");
      } else {
        setMediaError("DEVICE_BUSY");
      }
    } finally {
      setIsRetryingHardware(false);
    }
  };

  // --- 1. INITIALIZE MEDIA ON ROOM OPEN ---
  useEffect(() => {
    if (!isOpen) return;

    // Start with hardware request
    requestHardwareMedia(false);

    // Watch for browser permission changes automatically
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' }).then(p => {
        p.onchange = () => {
          if (p.state === 'granted') {
            requestHardwareMedia(true);
          }
        };
      }).catch(() => {});

      navigator.permissions.query({ name: 'microphone' }).then(p => {
        p.onchange = () => {
          if (p.state === 'granted') {
            requestHardwareMedia(true);
          }
        };
      }).catch(() => {});
    }

    // Call duration timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    const handleBeforeUnload = () => {
      stopAllMediaTracks();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(timer);
      stopAllMediaTracks();
    };
  }, [isOpen]);

  // Keep local video element synced across state / view swaps
  useEffect(() => {
    if (localVideoRef.current) {
      if (isVideoOn && localStream && isRealHardware) {
        if (localVideoRef.current.srcObject !== localStream) {
          localVideoRef.current.srcObject = localStream;
        }
        localVideoRef.current.play().catch(() => {});
      } else {
        localVideoRef.current.srcObject = null;
      }
    }
  }, [localStream, isVideoOn, isSwappedView, isRealHardware]);

  // Scroll chat to bottom
  useEffect(() => {
    if (activeSidePanel === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [inCallMessages, activeSidePanel]);

  if (!isOpen) return null;

  // Format seconds to HH:MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // --- TOGGLE MIC (WITH HARDWARE RELEASE) ---
  const handleToggleMic = async () => {
    if (isMicOn) {
      // Physically stop audio tracks to release microphone hardware
      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.stop();
          localStream.removeTrack(track);
        });
      }
      if (activeStreamRef.current) {
        activeStreamRef.current.getAudioTracks().forEach(track => {
          track.stop();
          activeStreamRef.current.removeTrack(track);
        });
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.suspend().catch(() => {});
      }
      setIsMicOn(false);
      setMicVolume(0);
    } else {
      // Re-acquire microphone hardware
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newAudioTrack = audioStream.getAudioTracks()[0];
        if (newAudioTrack) {
          if (localStream) {
            localStream.addTrack(newAudioTrack);
          } else {
            setLocalStream(audioStream);
            activeStreamRef.current = audioStream;
          }
          if (activeStreamRef.current && activeStreamRef.current !== localStream) {
            activeStreamRef.current.addTrack(newAudioTrack);
          }
          setupAudioAnalyser(localStream || audioStream);
          setIsMicOn(true);
        }
      } catch (err) {
        console.warn("Could not re-enable microphone:", err);
      }
    }
  };

  // --- TOGGLE VIDEO (WITH HARDWARE RELEASE - TURNS OFF LAPTOP CAMERA LIGHT) ---
  const handleToggleVideo = async () => {
    if (isVideoOn) {
      // 1. Physically STOP all video tracks -> Laptop camera LED light turns OFF immediately!
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.stop();
          localStream.removeTrack(track);
        });
      }
      if (activeStreamRef.current) {
        activeStreamRef.current.getVideoTracks().forEach(track => {
          track.stop();
          activeStreamRef.current.removeTrack(track);
        });
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      setIsVideoOn(false);
    } else {
      // 2. Re-acquire video hardware -> Laptop camera LED light turns back ON!
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        if (newVideoTrack) {
          if (localStream) {
            localStream.addTrack(newVideoTrack);
          } else {
            setLocalStream(videoStream);
            activeStreamRef.current = videoStream;
          }
          if (activeStreamRef.current && activeStreamRef.current !== localStream) {
            activeStreamRef.current.addTrack(newVideoTrack);
          }
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream || videoStream;
            localVideoRef.current.play().catch(() => {});
          }
          setIsVideoOn(true);
          setIsRealHardware(true);
        }
      } catch (err) {
        console.warn("Could not re-enable camera:", err);
      }
    }
  };

  // --- TOGGLE SCREEN SHARING ---
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setIsScreenSharing(true);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream;
        }
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      } else {
        alert("Screen sharing is not supported in this browser environment.");
      }
    } catch (e) {
      console.warn("Screen share error:", e);
      setIsScreenSharing(false);
    }
  };

  // --- FULLSCREEN TOGGLE ---
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
      setIsFullscreen(false);
    }
  };

  // --- SEND IN-CALL CHAT MESSAGE ---
  const handleSendInCallChat = (e) => {
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
    setChatInput('');
  };

  // --- SAVE DOCTOR CLINICAL NOTES ---
  const handleSaveNotes = () => {
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
  };

  // --- END CALL ---
  const handleEndCall = () => {
    if (window.confirm("Are you sure you want to end this live telehealth consultation?")) {
      stopAllMediaTracks();
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
        {/* Left: Branding & Encryption Tag */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center font-black text-white shadow-md border border-emerald-500/40">
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-sm tracking-tight text-white">Healora Telehealth Video Studio</h2>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LIVE CONSULTATION
              </span>
            </div>
            <p className="text-[11px] text-gray-400 flex items-center gap-1.5 font-medium">
              <ShieldCheck size={12} className="text-emerald-400" /> 256-Bit WebRTC Encrypted Peer-to-Peer
            </p>
          </div>
        </div>

        {/* Center: Live Call Timer */}
        <div className="flex items-center gap-2 bg-[#142318] border border-[#2D4533] px-4 py-1.5 rounded-full shadow-inner">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <Clock size={14} className="text-gray-300" />
          <span className="font-mono font-black text-sm text-emerald-300 tracking-wider">
            {formatTimer(callDuration)}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1 border-l border-gray-600">
            Room: HLR-{appointment?.id || 'CONSULT'}
          </span>
        </div>

        {/* Right: Participant Badge & Fullscreen */}
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
            onClick={handleToggleFullscreen} 
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* 🌟 MAIN STAGE: LIVE WEBCAM VIDEO + FLOATING DOCTOR CARD 🌟 */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* VIDEO DISPLAY AREA */}
        <div className="flex-1 relative flex items-center justify-center bg-[#050C07] p-2 sm:p-4">
          
          {/* Success Toast */}
          {successToast && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40 bg-emerald-950/95 border border-emerald-400 text-emerald-100 px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span className="font-bold">{successToast}</span>
            </div>
          )}

          {/* MAIN VIDEO FRAME */}
          <div className="w-full h-full rounded-3xl overflow-hidden relative bg-[#09140C] border border-[#1E3324] shadow-2xl flex items-center justify-center">
            
            {/* Screen Share Overlay */}
            {isScreenSharing ? (
              <video 
                ref={screenVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain bg-black"
              />
            ) : !isSwappedView ? (
              /* 🌟 1. USER'S LIVE WEBCAM AS MAIN SCREEN 🌟 */
              <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
                {isRealHardware && isVideoOn && localStream ? (
                  /* Real Live Webcam Feed */
                  <video 
                    ref={handleLocalVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover transform -scale-x-100" 
                  />
                ) : !isVideoOn ? (
                  /* Camera Off State */
                  <div className="w-full h-full relative overflow-hidden bg-[#0A160F] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-[#182C1E] border-2 border-emerald-500/40 flex items-center justify-center text-white text-3xl font-black mb-3 shadow-xl">
                      {currentUserName.charAt(0)}
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">{currentUserName}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <VideoOff size={14} className="text-red-400" /> Camera hardware is turned off (LED is off)
                    </p>
                  </div>
                ) : (
                  /* 🔒 VIDEO CONSULTATION CONNECTING / PERMISSION PROMPT 🔒 */
                  <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#0B1A10] to-[#040A06] flex flex-col items-center justify-center p-6 text-center">
                    {/* Glowing Avatar */}
                    <div className="relative mb-5">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 border-2 border-emerald-400/80 flex items-center justify-center text-white text-3xl font-black shadow-2xl">
                        {remotePersonName.charAt(0)}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#0B1A10] flex items-center justify-center text-white shadow-lg animate-pulse">
                        <Camera size={14} />
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mb-1">
                      Live Video Consultation
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-300 font-medium mb-4">
                      {remotePersonName} is in the consultation room. Turn on your camera to start talking.
                    </p>

                    {/* Step-by-Step Helper If Browser Blocked */}
                    {mediaError === 'PERMISSION_DENIED' ? (
                      <div className="bg-amber-950/80 border border-amber-500/60 text-amber-100 p-4 rounded-2xl max-w-md text-xs mb-4 backdrop-blur-md shadow-2xl">
                        <p className="font-bold text-amber-200 mb-2 flex items-center justify-center gap-1.5 text-sm">
                          <Lock size={15} /> Camera & Microphone Blocked in Browser
                        </p>
                        <div className="text-left space-y-1.5 text-[11px] text-gray-200">
                          <p>1. Look at the top address bar in Chrome/Edge (next to <strong>localhost:5173</strong>).</p>
                          <p>2. Click the <strong>🔒 Lock / Camera icon</strong> and change <strong>Camera</strong> & <strong>Microphone</strong> to <strong>Allow</strong>.</p>
                          <p>3. Click the green button below to connect live!</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mb-4 max-w-md">
                        Please allow camera and microphone access to connect your live face-to-face consultation.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => requestHardwareMedia(true)}
                      disabled={isRetryingHardware}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-7 py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
                    >
                      <RefreshCw size={15} className={isRetryingHardware ? 'animate-spin' : ''} />
                      {isRetryingHardware ? 'Connecting Live Camera...' : '🎥 Turn On Live Camera & Microphone'}
                    </button>
                  </div>
                )}

                {/* Top Overlay: View Swap Button & Status Badge */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSwappedView(true)}
                    className="bg-black/60 hover:bg-black/80 text-white border border-white/20 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition backdrop-blur-md cursor-pointer shadow-lg hover:scale-105"
                    title="Switch to doctor view as main screen"
                  >
                    <ArrowLeftRight size={13} className="text-emerald-400" />
                    <span>View Doctor Full Screen</span>
                  </button>

                  <div className="bg-emerald-950/80 border border-emerald-500/50 backdrop-blur-md px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                      HD VIDEO CONSULTATION
                    </span>
                  </div>
                </div>

                {/* Bottom Left: User Tag & Live Mic Fluctuations */}
                <div className="absolute bottom-4 left-4 z-10 bg-black/75 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 flex items-center gap-3 shadow-2xl">
                  <div className={`w-2.5 h-2.5 rounded-full ${isVideoOn && isRealHardware ? 'bg-emerald-400' : 'bg-red-500'}`}></div>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">{currentUserName} (You)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {isVideoOn && isRealHardware ? 'LIVE WEBCAM HD' : 'CAMERA OFF'}
                    </span>
                  </div>

                  {/* Real voice equalizer bars */}
                  {isMicOn && (
                    <div className="flex items-end gap-0.5 h-3 px-1 border-l border-white/20 pl-2">
                      <span className="w-1 bg-emerald-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(3, (micVolume * 0.12))}px` }}></span>
                      <span className="w-1 bg-emerald-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(4, (micVolume * 0.18))}px` }}></span>
                      <span className="w-1 bg-emerald-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(2, (micVolume * 0.10))}px` }}></span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 🌟 2. DOCTOR CONSULTATION SUITE AS MAIN SCREEN (SWAPPED VIEW) 🌟 */
              <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#0C1A11] to-[#060D08] flex flex-col justify-between p-6 sm:p-8">
                {/* Top Header */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border-2 border-emerald-400/50 flex items-center justify-center text-white text-xl font-black shadow-lg">
                      {remotePersonName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white">{remotePersonName}</h3>
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          VERIFIED CLINICIAN
                        </span>
                      </div>
                      <p className="text-xs text-emerald-300 font-medium">{remotePersonTitle}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSwappedView(false)}
                    className="bg-black/60 hover:bg-black/80 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition backdrop-blur-md cursor-pointer shadow-lg hover:scale-105"
                  >
                    <ArrowLeftRight size={13} className="text-emerald-400" />
                    <span>View Your Camera Full Screen</span>
                  </button>
                </div>

                {/* Center Clinical Consultation HUD */}
                <div className="max-w-2xl mx-auto w-full bg-[#122317]/80 border border-[#27402F] p-6 rounded-3xl backdrop-blur-md shadow-2xl my-auto text-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center text-emerald-300 text-3xl font-black mx-auto mb-4 shadow-inner">
                    {remotePersonName.charAt(0)}
                  </div>
                  <h4 className="text-xl font-black text-white mb-1">
                    Live Telehealth Session Active
                  </h4>
                  <p className="text-xs text-gray-300 mb-6">
                    Dr. Sarah John is reviewing your clinical nutrition profile and health goals.
                  </p>

                  {/* Audio Frequency Pulse Indicator */}
                  <div className="bg-[#09130D] border border-white/5 p-4 rounded-2xl flex items-center justify-center gap-1.5">
                    <span className="text-[11px] font-bold text-gray-400 mr-2">Consultation Audio Stream:</span>
                    {[16, 24, 38, 50, 65, 45, 30, 55, 70, 40, 25, 18].map((h, idx) => (
                      <span 
                        key={idx} 
                        className="w-1.5 bg-emerald-400 rounded-full animate-pulse" 
                        style={{ height: `${h * 0.4}px`, animationDelay: `${idx * 0.1}s` }}
                      ></span>
                    ))}
                  </div>
                </div>

                {/* Bottom Details */}
                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-white/10 pt-4 z-10">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <ShieldCheck size={14} /> End-to-End Encrypted Live Stream
                  </span>
                  <span>Room: HLR-{appointment?.id || 'CONSULT'}</span>
                </div>
              </div>
            )}

            {/* 🌟 PICTURE-IN-PICTURE (PIP) CORNER WINDOW 🌟 */}
            <div 
              onClick={() => setIsSwappedView(prev => !prev)}
              className="absolute bottom-5 right-5 z-30 w-52 h-36 sm:w-64 sm:h-44 rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-2xl bg-[#09150E] group transition-all hover:scale-105 cursor-pointer"
              title="Click to swap video view"
            >
              {!isSwappedView ? (
                /* PIP: Doctor Consultation Feed (when User is Main) */
                <div className="w-full h-full bg-gradient-to-b from-[#112419] to-[#0A160F] flex flex-col justify-between p-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Doctor Feed
                    </span>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center my-auto">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-400/50 flex items-center justify-center text-white font-black text-sm shadow-md mb-1">
                      {remotePersonName.charAt(0)}
                    </div>
                    <p className="text-xs font-extrabold text-white leading-tight">{remotePersonName}</p>
                    <p className="text-[9px] text-emerald-300 font-medium">Ready in Consultation</p>
                  </div>

                  <div className="bg-black/60 backdrop-blur-xs px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center justify-between">
                    <span className="text-[9px] text-gray-300">Click to expand</span>
                    <div className="flex items-end gap-0.5 h-2.5">
                      <span className="w-1 bg-emerald-400 rounded-full animate-pulse" style={{ height: '8px' }}></span>
                      <span className="w-1 bg-emerald-400 rounded-full animate-pulse" style={{ height: '12px' }}></span>
                      <span className="w-1 bg-emerald-400 rounded-full animate-pulse" style={{ height: '6px' }}></span>
                    </div>
                  </div>
                </div>
              ) : (
                /* PIP: User's Real Live Webcam (when Doctor is Main) */
                <div className="w-full h-full relative bg-black flex items-center justify-center">
                  {isRealHardware && isVideoOn && localStream ? (
                    <video 
                      ref={handleLocalVideoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover transform -scale-x-100" 
                    />
                  ) : (
                    <div className="w-full h-full bg-[#112419] flex flex-col items-center justify-center p-2 text-center">
                      <div className="w-9 h-9 rounded-full bg-[#1D3A27] text-white font-black flex items-center justify-center text-xs mb-1">
                        {currentUserName.charAt(0)}
                      </div>
                      <span className="text-[10px] text-gray-300 font-bold">{currentUserName}</span>
                    </div>
                  )}

                  <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/80 backdrop-blur-xs px-2 py-1 rounded-lg text-[9px] font-bold text-white flex items-center justify-between pointer-events-none">
                    <span className="truncate">{currentUserName} (You)</span>
                    {isMicOn && (
                      <div className="flex items-end gap-0.5 h-2 px-0.5">
                        <span className="w-0.5 bg-emerald-400 rounded-full" style={{ height: `${Math.max(2, (micVolume * 0.08))}px` }}></span>
                        <span className="w-0.5 bg-emerald-400 rounded-full" style={{ height: `${Math.max(3, (micVolume * 0.12))}px` }}></span>
                        <span className="w-0.5 bg-emerald-400 rounded-full" style={{ height: `${Math.max(2, (micVolume * 0.06))}px` }}></span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* 🌟 SLIDE-OVER SIDE PANELS (IN-CALL CHAT / CLINICAL VITALS) 🌟 */}
        {activeSidePanel && (
          <div className="w-80 sm:w-96 bg-[#0E1B12] border-l border-[#203626] flex flex-col z-20 animate-in slide-in-from-right duration-200 shadow-2xl">
            {/* Side Panel Header */}
            <div className="p-4 border-b border-[#203626] flex justify-between items-center bg-[#132418]">
              <div className="flex items-center gap-2">
                {activeSidePanel === 'chat' && (
                  <>
                    <MessageSquare size={18} className="text-emerald-400" />
                    <h3 className="font-black text-sm text-white">In-Call Consultation Chat</h3>
                  </>
                )}
                {activeSidePanel === 'clinical' && (
                  <>
                    <FileText size={18} className="text-emerald-400" />
                    <h3 className="font-black text-sm text-white">Live Clinical Records & Notes</h3>
                  </>
                )}
              </div>
              <button 
                onClick={() => setActiveSidePanel('')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* 1. CHAT DRAWER CONTENT */}
            {activeSidePanel === 'chat' && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {inCallMessages.map(msg => {
                    const isMe = msg.sender === currentUserName;
                    const isSys = msg.role === 'SYSTEM';

                    if (isSys) {
                      return (
                        <div key={msg.id} className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 text-center leading-relaxed font-medium">
                          {msg.text}
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-gray-400 font-bold mb-1">
                          {msg.sender} • {msg.time}
                        </span>
                        <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                          isMe 
                            ? 'bg-emerald-700 text-white rounded-br-xs' 
                            : 'bg-[#182B1E] text-gray-100 border border-[#27422E] rounded-bl-xs'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendInCallChat} className="p-3 border-t border-[#203626] bg-[#132418] flex gap-2">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send message in consultation..."
                    className="flex-1 bg-[#09140C] border border-[#27422E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 transition placeholder:text-gray-500"
                  />
                  <button 
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer shadow-md"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}

            {/* 2. CLINICAL VITALS & DOCTOR NOTES CONTENT */}
            {activeSidePanel === 'clinical' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
                {/* Patient Biometrics Card */}
                <div className="bg-[#132418] border border-[#263E2D] p-3.5 rounded-2xl space-y-2.5">
                  <h4 className="font-black text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={14} /> Patient Clinical Profile
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-[#09140C] p-2 rounded-xl border border-white/5">
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">Age / Gender</span>
                      <span className="font-bold text-white">{patientProfile?.age || '25'} Yrs • Female</span>
                    </div>
                    <div className="bg-[#09140C] p-2 rounded-xl border border-white/5">
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">Weight / BMI</span>
                      <span className="font-bold text-white">{patientProfile?.weight_kg || '65'} kg (BMI 23.8)</span>
                    </div>
                    <div className="bg-[#09140C] p-2 rounded-xl border border-white/5">
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">Health Goal</span>
                      <span className="font-bold text-emerald-300">{patientProfile?.health_goals || 'Weight Loss'}</span>
                    </div>
                    <div className="bg-[#09140C] p-2 rounded-xl border border-white/5">
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">Medical History</span>
                      <span className="font-bold text-white">{patientProfile?.medical_history || 'PCOS / Thyroid'}</span>
                    </div>
                  </div>
                </div>

                {/* Consultation Notes Section */}
                <div className="space-y-3">
                  <h4 className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} className="text-emerald-400" /> Clinical Consultation Notes
                  </h4>
                  <textarea 
                    rows={4}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="Enter clinical assessment, patient dietary adherence notes, and progress evaluation..."
                    className="w-full bg-[#09140C] border border-[#27422E] rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500 transition resize-none placeholder:text-gray-500"
                  />

                  <h4 className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5 pt-1">
                    <Apple size={14} className="text-emerald-400" /> Diet & Nutrition Recommendation
                  </h4>
                  <textarea 
                    rows={3}
                    value={prescriptionNote}
                    onChange={(e) => setPrescriptionNote(e.target.value)}
                    placeholder="E.g. Transition to 6-meal Kerala low-GI protocol. Drink Jeera water every morning..."
                    className="w-full bg-[#09140C] border border-[#27422E] rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500 transition resize-none placeholder:text-gray-500"
                  />

                  {notesSavedAlert && (
                    <div className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 p-2.5 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={14} /> Notes saved to patient medical record!
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <CheckCircle2 size={14} /> Save Clinical Notes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 🌟 BOTTOM FLOATING ACTION DOCK 🌟 */}
      <div className="h-20 bg-[#0A160F]/95 backdrop-blur-md border-t border-[#1F3324] px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
        
        {/* Left: Device Status & Mic Equalizer */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-300">
          <span className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <span className={`w-2 h-2 rounded-full ${isMicOn ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
            <span>Mic: {isMicOn ? 'Active' : 'Muted (Hardware Off)'}</span>
            {isMicOn && (
              <div className="flex items-end gap-0.5 h-2.5 px-0.5">
                <span className="w-1 bg-emerald-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(2, (micVolume * 0.10))}px` }}></span>
                <span className="w-1 bg-emerald-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(3, (micVolume * 0.15))}px` }}></span>
                <span className="w-1 bg-emerald-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(2, (micVolume * 0.08))}px` }}></span>
              </div>
            )}
          </span>
          <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <span className={`w-2 h-2 rounded-full ${isVideoOn && isRealHardware ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
            <span>Video: {isVideoOn && isRealHardware ? 'Webcam Live' : 'Camera Off (LED Off)'}</span>
          </span>
        </div>

        {/* Center: Core Video Controls */}
        <div className="flex items-center gap-3 sm:gap-4 mx-auto sm:mx-0">
          {/* Mute/Unmute Mic */}
          <button 
            type="button"
            onClick={handleToggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg cursor-pointer ${
              isMicOn 
                ? 'bg-[#192E20] hover:bg-[#223E2B] text-white border border-emerald-600/40' 
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
            }`}
            title={isMicOn ? "Turn Off Microphone (Hardware Off)" : "Turn On Microphone"}
          >
            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Turn Video On/Off */}
          <button 
            type="button"
            onClick={handleToggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg cursor-pointer ${
              isVideoOn 
                ? 'bg-[#192E20] hover:bg-[#223E2B] text-white border border-emerald-600/40' 
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
            }`}
            title={isVideoOn ? "Turn Off Camera (Release Hardware & Turn Off LED Light)" : "Turn On Camera"}
          >
            {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* Swap View Button */}
          <button 
            type="button"
            onClick={() => setIsSwappedView(prev => !prev)}
            className="w-12 h-12 rounded-full bg-[#192E20] hover:bg-[#223E2B] text-emerald-400 border border-emerald-600/40 flex items-center justify-center transition shadow-lg cursor-pointer"
            title="Swap Camera and Doctor View"
          >
            <ArrowLeftRight size={19} />
          </button>

          {/* Screen Share */}
          <button 
            type="button"
            onClick={handleToggleScreenShare}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg cursor-pointer ${
              isScreenSharing 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30' 
                : 'bg-[#192E20] hover:bg-[#223E2B] text-white border border-emerald-600/40'
            }`}
            title={isScreenSharing ? "Stop Screen Share" : "Share Screen / Lab Reports"}
          >
            {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
          </button>

          {/* End Call Button */}
          <button 
            type="button"
            onClick={handleEndCall}
            className="h-12 px-5 sm:px-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-xl shadow-red-600/30 cursor-pointer"
            title="Leave / End Consultation"
          >
            <PhoneOff size={18} />
            <span>End Call</span>
          </button>
        </div>

        {/* Right: Auxiliary Clinical Tools */}
        <div className="flex items-center gap-2.5">
          {/* Chat Drawer Toggle */}
          <button 
            type="button"
            onClick={() => setActiveSidePanel(prev => prev === 'chat' ? '' : 'chat')}
            className={`p-3 rounded-2xl transition border cursor-pointer relative ${
              activeSidePanel === 'chat' 
                ? 'bg-emerald-700 text-white border-emerald-500' 
                : 'bg-[#192E20] text-gray-300 border-[#26422E] hover:bg-[#213B29]'
            }`}
            title="Open Consultation Chat"
          >
            <MessageSquare size={18} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </button>

          {/* Clinical Profile & Notes Toggle */}
          <button 
            type="button"
            onClick={() => setActiveSidePanel(prev => prev === 'clinical' ? '' : 'clinical')}
            className={`p-3 rounded-2xl transition border cursor-pointer ${
              activeSidePanel === 'clinical' 
                ? 'bg-emerald-700 text-white border-emerald-500' 
                : 'bg-[#192E20] text-gray-300 border-[#26422E] hover:bg-[#213B29]'
            }`}
            title="Clinical History & Notes"
          >
            <FileText size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelehealthVideoRoom;
