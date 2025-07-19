"use client";

import { useEffect, useRef, useState } from "react";

export function VideoCall({ roomName, token }: { roomName: string; token: string }) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [rtcSocket, setRtcSocket] = useState<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

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

  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
      <video ref={localVideoRef} autoPlay muted className="w-32 h-24 rounded shadow-md border border-white" />
      <video ref={remoteVideoRef} autoPlay className="w-32 h-24 rounded shadow-md border border-white" />
    </div>
  );
}
