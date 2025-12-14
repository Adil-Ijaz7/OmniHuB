import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { History, Loader2, CheckCircle, XCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const UsageHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/user/usage-history`);
      setLogs(response.data);
    } catch (error) {
      toast.error("Failed to load usage history");
    } finally {
      setLoading(false);
    }
  };

  const getToolColor = (tool) => {
    const colors = {
      live_tv: "bg-blue-500/20 text-blue-400",
      tamasha_otp: "bg-purple-500/20 text-purple-400",
      temp_email: "bg-green-500/20 text-green-400",
      youtube_download: "bg-red-500/20 text-red-400",
      image_enhance: "bg-yellow-500/20 text-yellow-400",
      phone_lookup: "bg-cyan-500/20 text-cyan-400",
      eyecon_lookup: "bg-pink-500/20 text-pink-400",
    };
    return colors[tool] || "bg-muted text-muted-foreground";
  };

  const formatToolName = (tool) => {
    return tool
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="usage-history-page">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Usage History</h1>
        <p className="text-muted-foreground">View your tool usage and credit deductions</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>{logs.length} usage records</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No usage history yet</p>
              <p className="text-sm">Start using tools to see your activity here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  data-testid={`usage-log-${log.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Badge className={getToolColor(log.tool)}>{formatToolName(log.tool)}</Badge>
                    <div>
                      {log.details && (
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {log.details}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-mono font-bold text-destructive">
                        -{log.credits_used}
                      </p>
                      <p className="text-xs text-muted-foreground">credits</p>
                    </div>
                    {log.status === "success" ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageHistory;
