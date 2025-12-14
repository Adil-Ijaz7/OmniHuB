import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Hls from "hls.js";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { toast } from "sonner";
import { Tv, Play, Loader2, AlertCircle, Volume2, VolumeX, Maximize, RefreshCw } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Category colors
const categoryColors = {
  News: "bg-red-500/20 text-red-400",
  Entertainment: "bg-purple-500/20 text-purple-400",
  Sports: "bg-green-500/20 text-green-400",
  Religious: "bg-yellow-500/20 text-yellow-400",
  Kids: "bg-pink-500/20 text-pink-400",
};

const LiveTV = () => {
  const { refreshUser } = useAuth();
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [streamError, setStreamError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Fetch channels on mount
  useEffect(() => {
    fetchChannels();
    
    // Cleanup HLS on unmount
    return () => {
      destroyHls();
    };
  }, []);

  // Filter channels by category
  useEffect(() => {
    if (activeCategory === "All") {
      setFilteredChannels(channels);
    } else {
      setFilteredChannels(channels.filter(ch => ch.category === activeCategory));
    }
  }, [channels, activeCategory]);

  // Initialize HLS when stream URL changes
  useEffect(() => {
    if (streamUrl && videoRef.current) {
      initializeHls(streamUrl);
    }
    
    return () => {
      destroyHls();
    };
  }, [streamUrl]);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const initializeHls = useCallback((url) => {
    const video = videoRef.current;
    if (!video) return;

    // Destroy existing instance
    destroyHls();
    setStreamError(null);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      
      hlsRef.current = hls;

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log("HLS: Media attached");
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log("HLS: Manifest parsed, levels:", data.levels.length);
        video.play().catch(err => {
          console.warn("Autoplay blocked:", err);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", data.type, data.details);
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("HLS: Network error, attempting recovery...");
              setStreamError("Network error - attempting to recover...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("HLS: Media error, attempting recovery...");
              setStreamError("Media error - attempting to recover...");
              hls.recoverMediaError();
              break;
            default:
              console.error("HLS: Fatal error, cannot recover");
              setStreamError("Stream unavailable. Please try another channel.");
              destroyHls();
              break;
          }
        }
      });

      hls.loadSource(url);
      hls.attachMedia(video);
      
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = url;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(err => console.warn("Autoplay blocked:", err));
      });
    } else {
      setStreamError("HLS is not supported in this browser");
    }
  }, [destroyHls]);

  const fetchChannels = async () => {
    try {
      const response = await axios.get(`${API}/tools/live-tv/channels`);
      setChannels(response.data.channels || []);
      setFilteredChannels(response.data.channels || []);
    } catch (error) {
      toast.error("Failed to load channels");
      console.error("Fetch channels error:", error);
    } finally {
      setLoadingChannels(false);
    }
  };

  const playChannel = async (channel) => {
    if (loading) return;
    
    setLoading(true);
    setSelectedChannel(channel);
    setStreamError(null);
    setStreamUrl(null);
    
    try {
      const response = await axios.get(`${API}/tools/live-tv/stream/${channel.id}`);
      setStreamUrl(response.data.stream_url);
      toast.success(`Playing ${channel.name} (-${response.data.credits_used} credit)`);
      refreshUser();
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to load stream";
      toast.error(message);
      setStreamError(message);
      setSelectedChannel(null);
    } finally {
      setLoading(false);
    }
  };

  const retryStream = () => {
    if (selectedChannel) {
      playChannel(selectedChannel);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // Get unique categories
  const categories = ["All", ...new Set(channels.map(ch => ch.category))];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="live-tv-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Live TV</h1>
          <p className="text-muted-foreground">Stream Jazz TV & Tamasha channels</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2 w-fit">
          1 credit/stream
        </Badge>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(category)}
            data-testid={`category-${category.toLowerCase()}`}
          >
            {category}
            {category !== "All" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({channels.filter(ch => ch.category === category).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-border/50">
            <div className="aspect-video bg-black relative">
              {selectedChannel ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    controls
                    playsInline
                    muted={isMuted}
                    data-testid="video-player"
                  />
                  
                  {/* Custom Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
                          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={retryStream} className="text-white hover:bg-white/20">
                          <RefreshCw className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
                          <Maximize className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Tv className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg">Select a channel to start streaming</p>
                  <p className="text-sm opacity-70">{channels.length} channels available</p>
                </div>
              )}
              
              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                  <p className="text-white">Loading stream...</p>
                </div>
              )}
              
              {/* Error Overlay */}
              {streamError && !loading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-4">
                  <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                  <p className="text-white mb-2">{streamError}</p>
                  <Button onClick={retryStream} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              )}
            </div>
            
            {/* Now Playing */}
            {selectedChannel && (
              <CardContent className="p-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedChannel.logo} 
                    alt={selectedChannel.name}
                    className="w-12 h-12 rounded-lg object-contain bg-muted p-1"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div>
                    <h3 className="text-lg font-bold">{selectedChannel.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={categoryColors[selectedChannel.category] || "bg-muted"}>
                        {selectedChannel.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{selectedChannel.provider}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Channel List */}
        <div>
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tv className="w-5 h-5" />
                Channels
              </CardTitle>
              <CardDescription>
                {filteredChannels.length} of {channels.length} channels
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {loadingChannels ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredChannels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Tv className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No channels in this category</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredChannels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => playChannel(channel)}
                        disabled={loading}
                        data-testid={`channel-${channel.id}`}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                          selectedChannel?.id === channel.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img 
                            src={channel.logo} 
                            alt={channel.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => { 
                              e.target.onerror = null;
                              e.target.src = ''; 
                              e.target.parentElement.innerHTML = '<span class="text-xs">TV</span>';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{channel.name}</p>
                          <p className={`text-xs ${selectedChannel?.id === channel.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {channel.category}
                          </p>
                        </div>
                        {selectedChannel?.id === channel.id ? (
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        ) : (
                          <Play className="w-4 h-4 opacity-50" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveTV;
