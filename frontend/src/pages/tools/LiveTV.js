import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Tv, Play, Loader2 } from "lucide-react";
import Hls from "hls.js";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LiveTV = () => {
  const { refreshUser } = useAuth();
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    fetchChannels();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (streamUrl && videoRef.current) {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current.play().catch(() => {});
        });
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = streamUrl;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [streamUrl]);

  const fetchChannels = async () => {
    try {
      const response = await axios.get(`${API}/tools/live-tv/channels`);
      setChannels(response.data.channels);
    } catch (error) {
      toast.error("Failed to load channels");
    } finally {
      setLoadingChannels(false);
    }
  };

  const playChannel = async (channel) => {
    setLoading(true);
    setSelectedChannel(channel);
    try {
      const response = await axios.get(`${API}/tools/live-tv/stream/${channel.id}`);
      setStreamUrl(response.data.stream_url);
      toast.success(`Playing ${channel.name} (-${response.data.credits_used} credit)`);
      refreshUser();
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to load stream";
      toast.error(message);
      setSelectedChannel(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="live-tv-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Live TV</h1>
          <p className="text-muted-foreground">Stream live TV channels</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          1 credit/stream
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-border/50">
            <div className="aspect-video bg-black relative">
              {selectedChannel ? (
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  data-testid="video-player"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Tv className="w-16 h-16 mb-4 opacity-50" />
                  <p>Select a channel to start streaming</p>
                </div>
              )}
              {loading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
              )}
            </div>
            {selectedChannel && (
              <CardContent className="p-4">
                <h3 className="text-lg font-bold">{selectedChannel.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedChannel.category}</p>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Channel List */}
        <div>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Channels</CardTitle>
              <CardDescription>Select a channel to watch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingChannels ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                channels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant={selectedChannel?.id === channel.id ? "default" : "ghost"}
                    className="w-full justify-start gap-3"
                    onClick={() => playChannel(channel)}
                    disabled={loading}
                    data-testid={`channel-${channel.id}`}
                  >
                    <Play className="w-4 h-4" />
                    <span className="flex-1 text-left">{channel.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {channel.category}
                    </Badge>
                  </Button>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveTV;
