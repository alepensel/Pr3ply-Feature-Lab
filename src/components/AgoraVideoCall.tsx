import { useEffect, useRef, useState, useCallback } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, VideoIcon, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface AgoraVideoCallProps {
  channelName: string;
  displayName: string;
  onLeave: () => void;
  sessionId: string;
}

const AgoraVideoCall = ({ channelName, displayName, onLeave, sessionId }: AgoraVideoCallProps) => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const [localTracks, setLocalTracks] = useState<{
    audio: IMicrophoneAudioTrack | null;
    video: ICameraVideoTrack | null;
  }>({ audio: null, video: null });
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleUserPublished = useCallback(async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
    const client = clientRef.current;
    if (!client) return;
    await client.subscribe(user, mediaType);
    if (mediaType === "audio") {
      user.audioTrack?.play();
    }
    setRemoteUsers((prev) => {
      const exists = prev.find((u) => u.uid === user.uid);
      if (exists) return prev.map((u) => (u.uid === user.uid ? user : u));
      return [...prev, user];
    });
  }, []);

  const handleUserUnpublished = useCallback((user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
    if (mediaType === "video") {
      setRemoteUsers((prev) => prev.map((u) => (u.uid === user.uid ? user : u)));
    }
  }, []);

  const handleUserLeft = useCallback((user: IAgoraRTCRemoteUser) => {
    setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
  }, []);

  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;

    const init = async () => {
      client.on("user-published", handleUserPublished);
      client.on("user-unpublished", handleUserUnpublished);
      client.on("user-left", handleUserLeft);

      const { data, error } = await supabase.functions.invoke("agora-token", {
        body: { sessionId },
      });
      if (error || !data?.token) {
        throw new Error(error?.message || "Failed to get Agora token");
      }
      await client.join(data.appId, data.channelName, data.token, data.uid);

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks({ audio: audioTrack, video: videoTrack });

      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      await client.publish([audioTrack, videoTrack]);
      setJoined(true);
    };

    init().catch(console.error);

    return () => {
      const cleanup = async () => {
        localTracks.audio?.close();
        localTracks.video?.close();
        if (client.connectionState === "CONNECTED") {
          await client.leave();
        }
        client.removeAllListeners();
      };
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);

  // Play local video when ref or track changes
  useEffect(() => {
    if (localVideoRef.current && localTracks.video && !isVideoOff) {
      localTracks.video.play(localVideoRef.current);
    }
  }, [localTracks.video, isVideoOff]);

  const toggleMute = async () => {
    if (localTracks.audio) {
      await localTracks.audio.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localTracks.video) {
      await localTracks.video.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const leave = async () => {
    localTracks.audio?.close();
    localTracks.video?.close();
    const client = clientRef.current;
    if (client && client.connectionState === "CONNECTED") {
      await client.leave();
    }
    setJoined(false);
    setRemoteUsers([]);
    onLeave();
  };

  const totalUsers = 1 + remoteUsers.length;
  const gridCols =
    totalUsers <= 1 ? "grid-cols-1" :
    totalUsers <= 2 ? "grid-cols-2" :
    totalUsers <= 4 ? "grid-cols-2" :
    "grid-cols-3";

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black">
      {/* Video grid */}
      <div className={cn("flex-1 grid gap-1 p-1 min-h-0", gridCols)}>
        {/* Local video */}
        <div className="relative bg-muted/20 rounded-lg overflow-hidden">
          <div ref={localVideoRef} className="absolute inset-0 w-full h-full" />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
              <span className="text-muted-foreground font-medium">{displayName}</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {displayName} (You)
          </div>
        </div>

        {/* Remote videos */}
        {remoteUsers.map((user) => (
          <RemoteVideoPlayer key={user.uid} user={user} />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 py-3 bg-black/90">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button
          variant={isVideoOff ? "destructive" : "secondary"}
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={toggleVideo}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
        </Button>
        <Button
          variant="destructive"
          className="rounded-full px-6 h-12 font-semibold"
          onClick={leave}
        >
          Leave
        </Button>
      </div>
    </div>
  );
};

const RemoteVideoPlayer = ({ user }: { user: IAgoraRTCRemoteUser }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && user.videoTrack) {
      user.videoTrack.play(ref.current);
    }
    return () => {
      user.videoTrack?.stop();
    };
  }, [user.videoTrack]);

  return (
    <div className="relative bg-muted/20 rounded-lg overflow-hidden">
      <div ref={ref} className="absolute inset-0 w-full h-full" />
      {!user.videoTrack && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
          <span className="text-muted-foreground font-medium">User {user.uid}</span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        User {user.uid}
      </div>
    </div>
  );
};

export default AgoraVideoCall;
