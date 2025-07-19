"use client";

import { useEffect, useRef, useState } from "react";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";

export function VideoCall({ roomName, token }: { roomName: string; token: string }) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [rtcSocket, setRtcSocket] = useState<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false); // OFF by default
  const [isMicOn, setIsMicOn] = useState(false);       // OFF by default

  useEffect(() => {
    const rtc = new WebSocket(`ws://localhost:8081?token=${token}`);
    setRtcSocket(rtc);

    rtc.onopen = () => {
      rtc.send(JSON.stringify({ type: "join_room", roomName }));
    };

    rtc.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (!peerRef.current) return;

      switch (msg.type) {
        case "rtc:offer":
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(msg.data));
          const answer = await peerRef.current.createAnswer();
          await peerRef.current.setLocalDescription(answer);
          rtc.send(JSON.stringify({ type: "rtc:answer", roomName, data: answer }));
          break;

        case "rtc:answer":
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(msg.data));
          break;

        case "rtc:candidate":
          await peerRef.current.addIceCandidate(new RTCIceCandidate(msg.data));
          break;
      }
    };

    return () => rtc.close();
  }, [roomName, token]);

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
          roomName,
          data: event.candidate,
        }));
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams.length > 0) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      stream.getVideoTracks().forEach((track) => (track.enabled = false));
      stream.getAudioTracks().forEach((track) => (track.enabled = false));

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        rtcSocket.send(JSON.stringify({ type: "rtc:offer", roomName, data: offer }));
      });
    }).catch((err) => {
      console.error("Media error:", err);
    });

    return () => {
      pc.close();
    };
  }, [rtcSocket]);

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
      {/* Draggable Local Video */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        className="fixed top-4 left-4 z-50 cursor-move"
      >
        <div className="flex flex-col items-center">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-32 h-24 rounded shadow-md border border-white bg-black"
          />
          <span className="text-xs text-white mt-1">You</span>
        </div>
      </motion.div>

      {/* Draggable Remote Video */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        className="fixed top-4 right-4 z-50 cursor-move"
      >
        <div className="flex flex-col items-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-32 h-24 rounded shadow-md border border-white bg-black"
          />
          <span className="text-xs text-white mt-1">Other user</span>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button
          onClick={toggleMic}
          className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-white"
          title="Toggle Mic"
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-400" />}
        </button>
        <button
          onClick={toggleCamera}
          className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-white"
          title="Toggle Camera"
        >
          {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-red-400" />}
        </button>
      </div>
    </>
  );
}
