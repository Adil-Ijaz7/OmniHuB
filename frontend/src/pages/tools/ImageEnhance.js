import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { ImageIcon, Sparkles, Loader2, Download } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ImageEnhance = () => {
  const { refreshUser } = useAuth();
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const enhanceImage = async () => {
    if (!imageUrl) {
      toast.error("Please enter an image URL");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/tools/image-enhance`, { image_url: imageUrl });
      setResult(response.data);
      toast.success(`Image processed! (-${response.data.credits_used} credits)`);
      refreshUser();
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to enhance image";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="image-enhance-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Image Enhancement</h1>
          <p className="text-muted-foreground">Enhance and upscale your images</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          2 credits/image
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <div className="w-14 h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4">
              <ImageIcon className="w-7 h-7 text-yellow-400" />
            </div>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>Enter the URL of the image you want to enhance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                data-testid="image-url-input"
                className="bg-muted/50"
              />
            </div>
            <Button
              onClick={enhanceImage}
              disabled={loading}
              className="w-full"
              data-testid="enhance-btn"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Enhance Image
            </Button>

            {imageUrl && (
              <div className="mt-4">
                <Label>Preview</Label>
                <div className="mt-2 rounded-lg overflow-hidden bg-muted/50">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-auto"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Enhanced Result
            </CardTitle>
            <CardDescription>Your enhanced image will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden bg-muted/50">
                  <img
                    src={result.enhanced_url}
                    alt="Enhanced"
                    className="w-full h-auto"
                    data-testid="enhanced-image"
                  />
                </div>
                <p className="text-sm text-muted-foreground">{result.message}</p>
                <Button variant="outline" className="w-full" asChild>
                  <a href={result.enhanced_url} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download Enhanced Image
                  </a>
                </Button>
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No enhanced image yet</p>
                <p className="text-sm">Enter an image URL and click enhance</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageEnhance;
