"use client";

import { useEffect, useRef, useState } from "react";
import { Video, VideoOff, Mic, MicOff, Wifi, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { RTC_URL } from "@/utils/config";
import Toast from "./Toast";
import { useTheme } from "@/context/ThemeContext";

interface VideoCallProps {
  roomId: string;
  isCreator: boolean; 
}

export function VideoCall({roomId, isCreator }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [rtcSocket, setRtcSocket] = useState<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [isRemoteUserConnected, setIsRemoteUserConnected] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const localAudioContextRef = useRef<AudioContext | null>(null);
  const remoteAudioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const{theme} = useTheme();
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const rtcUrl = process.env.NEXT_PUBLIC_RTC_URL;
  const CAMERA_KEY = `camera-${roomId}`;
  const MIC_KEY = `mic-${roomId}`;
  const [isCameraOn, setIsCameraOn] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CAMERA_KEY);
      return saved ? JSON.parse(saved) : false; 
    }
    return false;
  });

  const [isMicOn, setIsMicOn] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MIC_KEY);
      return saved ? JSON.parse(saved) : false; 
    }
    return false;
  });

  useEffect(() => {
    const rtc = new WebSocket(rtcUrl ?? RTC_URL);
    setRtcSocket(rtc);

    rtc.onopen = () => {
      rtc.send(JSON.stringify({ type: "join_room", roomId }));
    };

    rtc.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "error") {
        showErrorToast(msg.message || "Connection error occurred");
        setConnectionStatus('error');
        return;
      }
      if (!peerRef.current) return;

      switch (msg.type) {
        case "rtc:offer":
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(msg.data));
          const answer = await peerRef.current.createAnswer();
          await peerRef.current.setLocalDescription(answer);
          rtc.send(JSON.stringify({ type: "rtc:answer", roomId, data: answer }));
          setIsRemoteUserConnected(true);
          setConnectionStatus('connected');
          break;

        case "rtc:answer":
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(msg.data));
          setIsRemoteUserConnected(true);
          setConnectionStatus('connected');
          break;

        case "rtc:candidate":
          await peerRef.current.addIceCandidate(new RTCIceCandidate(msg.data));
          break;
          
        case "user_disconnected":
          handleRemoteUserDisconnected();
          if (isCreator) {
            showToastMessage("Other user has left the call");
          }
          break;
          
          case "connection_status":
            setConnectionStatus(msg.status);
            break;
          }
        };

    rtc.onclose = () => {
      console.log("RTC WebSocket closed");
      handleRemoteUserDisconnected();
    };

    rtc.onerror = () => {
      console.error("RTC WebSocket error");
      handleRemoteUserDisconnected();
    };

    return () => rtc.close();
  }, [roomId]);

  useEffect(() => {
    if (!rtcSocket) return;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        rtcSocket.send(JSON.stringify({
          type: "rtc:candidate",
          roomId,
          data: event.candidate,
        }));
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams.length > 0) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsRemoteUserConnected(true);
        
      
        setupRemoteAudioAnalysis(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        handleRemoteUserDisconnected();
      }
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      const savedCameraSetting = isCameraOn;
      const savedMicSetting = isMicOn;
      stream.getVideoTracks().forEach((track) => (track.enabled = savedCameraSetting));
      stream.getAudioTracks().forEach((track) => (track.enabled = savedMicSetting));
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

     
      setupLocalAudioAnalysis(stream);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        rtcSocket.send(JSON.stringify({ type: "rtc:offer", roomId, data: offer }));
      });
    }).catch((err) => {
      console.error("Media error:", err);
    });

    return () => {
      pc.close();
      cleanupAudioAnalysis();
    };
  }, [rtcSocket]);
  
  const handleRemoteUserDisconnected = () => {
    setIsRemoteUserConnected(false);
    setIsRemoteSpeaking(false);
    setConnectionStatus('connecting'); 
  
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;

      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx?.fillRect(0, 0, 1, 1);
      const emptyStream = canvas.captureStream();
      remoteVideoRef.current.srcObject = emptyStream;
    
      
      setTimeout(() => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
      }, 100);
    }

    if (remoteAudioContextRef.current) {
      remoteAudioContextRef.current.close();
      remoteAudioContextRef.current = null;
    }
    remoteAnalyserRef.current = null;
  };

  const setupLocalAudioAnalysis = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      localAudioContextRef.current = audioContext;
      localAnalyserRef.current = analyser;
      
      monitorAudioLevel(analyser, setIsLocalSpeaking);
    } catch (error) {
      console.error("Error setting up local audio analysis:", error);
    }
  };

  const setupRemoteAudioAnalysis = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      remoteAudioContextRef.current = audioContext;
      remoteAnalyserRef.current = analyser;
      
      monitorAudioLevel(analyser, setIsRemoteSpeaking);
    } catch (error) {
      console.error("Error setting up remote audio analysis:", error);
    }
  };

  const monitorAudioLevel = (analyser: AnalyserNode, setSpeaking: (speaking: boolean) => void) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      

      const average = dataArray.reduce((a, b) => a + b) / bufferLength;

      const threshold = 10;
      setSpeaking(average > threshold);
      
      requestAnimationFrame(checkAudioLevel);
    };
    
    checkAudioLevel();
  };

  const cleanupAudioAnalysis = () => {
    if (localAudioContextRef.current) {
      localAudioContextRef.current.close();
      localAudioContextRef.current = null;
    }
    if (remoteAudioContextRef.current) {
      remoteAudioContextRef.current.close();
      remoteAudioContextRef.current = null;
    }
    localAnalyserRef.current = null;
    remoteAnalyserRef.current = null;
  };

  const toggleCamera = () => {
    if (!localStream) {
      showErrorToast("No camera access available");
      return;
    }
    const newState = !isCameraOn;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = newState;
    });
    setIsCameraOn(newState);
    localStorage.setItem(CAMERA_KEY, JSON.stringify(newState));
  };

  const toggleMic = () => {
    if (!localStream) {
      showErrorToast("No microphone access available");
      return;
    }
    const newState = !isMicOn;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = newState;
    });
    setIsMicOn(newState);
    localStorage.setItem(MIC_KEY, JSON.stringify(newState));
  };

  const showToastMessage = (message: string) => {
  setToastMessage(message);
  setShowToast(true);
  setTimeout(() => {
    setShowToast(false);
  }, 3000);
};

const showErrorToast = (error: string) => {
  showToastMessage(`Error: ${error}`);
};

return (
  <>
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-row gap-4 flex-wrap justify-center">
      {/* Local Video */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        className="cursor-move"
      >
        <div className="flex flex-col items-center">
          <div
            className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
              isLocalSpeaking && isMicOn
                ? "ring-4 ring-green-400 shadow-lg shadow-green-400/50"
                : ""
            }`}
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-25 h-18 bg-black object-cover"
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#a8a5ff]">
                <VideoOff className="w-6 h-6 text-black" />
              </div>
            )}
          </div>
          <span className={`text-md mt-1 flex items-center gap-1 ${
            theme === 'light' ? 'text-black' : 'text-white'
            }`}>
              You
            {isLocalSpeaking && isMicOn && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </span>
        </div>
      </motion.div>

      {/* Remote Video */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        className="cursor-move"
      >
        <div className="flex flex-col items-center">
          <div
            className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
              isRemoteSpeaking && isRemoteUserConnected
                ? "ring-4 ring-green-400 shadow-lg shadow-green-400/50"
                : ""
            }`}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-25 h-18 bg-black object-cover"
            />
            {!isRemoteUserConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#a8a5ff]">
                <VideoOff className="w-6 h-6 text-black" />
              </div>
            )}
          </div>
          <span className={`text-md mt-1 flex items-center gap-1 ${
            theme === 'light' ? 'text-black' : 'text-white'
            }`}>
              {isRemoteUserConnected ? "Other user" : "Connecting"}
              {isRemoteSpeaking && isRemoteUserConnected && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              )}
          </span>
        </div>
      </motion.div>
    </div>
    
    <div className="fixed top-3 right-30 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
        connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
        connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
        connectionStatus === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
        'bg-gray-500/20 text-gray-400 border border-gray-500/30'
      }`}>
        {connectionStatus === 'connected' && <Wifi className="w-4 h-4" />}
        {connectionStatus === 'connecting' && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {(connectionStatus === 'error' || connectionStatus === 'disconnected') && <WifiOff className="w-4 h-4" />}
    
        <span>
          {connectionStatus === 'connected' && 'Connected'}
          {connectionStatus === 'connecting' && 'Connecting...'}
          {connectionStatus === 'error' && 'Connection Error'}
          {connectionStatus === 'disconnected' && 'Disconnected'}
        </span>
      </div>
    </div>

    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      <button
        onClick={toggleMic}
        className={`p-1.5 rounded transition-colors cursor-pointer bg-[#a8a5ff] hover:bg-[#7d78ff] text-black`}
        title="Toggle Mic"
      >
        {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
      </button>
      <button
        onClick={toggleCamera}
        className={`p-1.5 rounded transition-colors cursor-pointer bg-[#a8a5ff] hover:bg-[#7d78ff] text-black`}
        title="Toggle Camera"
      >
        {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
      </button>
      {showToast && (
        <Toast 
          message={toastMessage}
          duration={3000}
        />
      )}

    </div>
  </>
);

}