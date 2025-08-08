"use client";

import { useEffect, useRef, useState } from "react";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import { RTC_URL } from "@/config";

interface VideoCallProps {
  roomId: string;
}

export function VideoCall({ roomId }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [rtcSocket, setRtcSocket] = useState<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false); 
  const [isMicOn, setIsMicOn] = useState(false);
  

  const [isRemoteUserConnected, setIsRemoteUserConnected] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  

  const localAudioContextRef = useRef<AudioContext | null>(null);
  const remoteAudioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const rtc = new WebSocket( process.env.NEXT_PUBLIC_RTC_URL ?? RTC_URL);
    setRtcSocket(rtc);

    rtc.onopen = () => {
      rtc.send(JSON.stringify({ type: "join_room", roomId }));
    };

    rtc.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (!peerRef.current) return;

      switch (msg.type) {
        case "rtc:offer":
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(msg.data));
          const answer = await peerRef.current.createAnswer();
          await peerRef.current.setLocalDescription(answer);
          rtc.send(JSON.stringify({ type: "rtc:answer", roomId, data: answer }));
          setIsRemoteUserConnected(true);
          break;

        case "rtc:answer":
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(msg.data));
          setIsRemoteUserConnected(true);
          break;

        case "rtc:candidate":
          await peerRef.current.addIceCandidate(new RTCIceCandidate(msg.data));
          break;

        case "user_disconnected":
          handleRemoteUserDisconnected();
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
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        handleRemoteUserDisconnected();
      }
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      stream.getVideoTracks().forEach((track) => (track.enabled = false));
      stream.getAudioTracks().forEach((track) => (track.enabled = false));

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
    
   
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
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
    if (!localStream) return;
    const newState = !isCameraOn;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = newState;
    });
    setIsCameraOn(newState);
  };

  const toggleMic = () => {
    if (!localStream) return;
    const newState = !isMicOn;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = newState;
    });
    setIsMicOn(newState);
  };

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        className="fixed top-4 left-4 z-50 cursor-move"
      >
        <div className="flex flex-col items-center">
          <div className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
            isLocalSpeaking && isMicOn ? 'ring-4 ring-green-400 shadow-lg shadow-green-400/50' : 'ring-2 ring-white'
          }`}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-32 h-24 bg-black"
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
          <span className="text-xs text-white mt-1 flex items-center gap-1">
            You
            {isLocalSpeaking && isMicOn && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </span>
        </div>
      </motion.div>

      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        className="fixed top-4 right-4 z-50 cursor-move"
      >
        <div className="flex flex-col items-center">
          <div className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
            isRemoteSpeaking && isRemoteUserConnected ? 'ring-4 ring-green-400 shadow-lg shadow-green-400/50' : 'ring-2 ring-white'
          }`}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-32 h-24 bg-black"
            />
            {!isRemoteUserConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span className="text-xs text-gray-400">Waiting...</span>
                </div>
              </div>
            )}
          </div>
          <span className="text-xs text-white mt-1 flex items-center gap-1">
            {isRemoteUserConnected ? 'Other user' : 'Connecting...'}
            {isRemoteSpeaking && isRemoteUserConnected && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </span>
        </div>
      </motion.div>

      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button
          onClick={toggleMic}
          className={`p-2 rounded transition-colors ${
            isMicOn 
              ? 'bg-gray-800 hover:bg-gray-700 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title="Toggle Mic"
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          onClick={toggleCamera}
          className={`p-2 rounded transition-colors ${
            isCameraOn 
              ? 'bg-gray-800 hover:bg-gray-700 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title="Toggle Camera"
        >
          {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
      </div>
    </>
  );
}