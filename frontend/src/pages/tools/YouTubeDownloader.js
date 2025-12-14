import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Youtube, Download, Loader2, ExternalLink } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const YouTubeDownloader = () => {
  const { refreshUser } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const fetchVideo = async () => {
    if (!url) {
      toast.error("Please enter a YouTube URL");
      return;
    }
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/tools/youtube-download`, { url });
      setResult(response.data);
      toast.success(`Video found! (-${response.data.credits_used} credits)`);
      refreshUser();
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to fetch video";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="youtube-downloader-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">YouTube Downloader</h1>
          <p className="text-muted-foreground">Download videos from YouTube</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          3 credits/download
        </Badge>
      </div>

      <Card className="border-border/50 max-w-2xl">
        <CardHeader>
          <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center mb-4">
            <Youtube className="w-7 h-7 text-red-400" />
          </div>
          <CardTitle>Enter YouTube URL</CardTitle>
          <CardDescription>Paste the video URL to get download links</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Video URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                data-testid="youtube-url-input"
                className="bg-muted/50 flex-1"
              />
              <Button onClick={fetchVideo} disabled={loading} data-testid="fetch-video-btn">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {result && (
            <div className="mt-6 space-y-4">
              <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="w-40 h-24 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate" data-testid="video-title">
                    {result.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{result.author}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Download Options</Label>
                {result.download_links?.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    data-testid={`download-link-${link.quality}`}
                  >
                    <span className="font-medium">{link.quality}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default YouTubeDownloader;
