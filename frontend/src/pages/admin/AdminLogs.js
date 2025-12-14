import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { toast } from "sonner";
import { FileText, Loader2, CheckCircle, XCircle, Coins, History } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminLogs = () => {
  const [usageLogs, setUsageLogs] = useState([]);
  const [creditLogs, setCreditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const [usageRes, creditRes] = await Promise.all([
        axios.get(`${API}/admin/usage-logs?limit=100`),
        axios.get(`${API}/admin/credit-logs?limit=100`),
      ]);
      setUsageLogs(usageRes.data);
      setCreditLogs(creditRes.data);
    } catch (error) {
      toast.error("Failed to load logs");
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

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-logs-page">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">System Logs</h1>
        <p className="text-muted-foreground">View all usage and credit transaction logs</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="usage" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="usage" data-testid="usage-logs-tab">
              <History className="w-4 h-4 mr-2" />
              Usage Logs ({usageLogs.length})
            </TabsTrigger>
            <TabsTrigger value="credits" data-testid="credit-logs-tab">
              <Coins className="w-4 h-4 mr-2" />
              Credit Logs ({creditLogs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="mt-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Usage History
                </CardTitle>
                <CardDescription>All tool usage across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {usageLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No usage logs</p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {usageLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                        data-testid={`usage-log-${log.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <Badge className={getToolColor(log.tool)}>
                            {log.tool.replace(/_/g, " ")}
                          </Badge>
                          <div>
                            <p className="font-medium">{log.user_email}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {log.details}
                            </p>
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
          </TabsContent>

          <TabsContent value="credits" className="mt-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Credit Transactions
                </CardTitle>
                <CardDescription>All credit assignments and deductions</CardDescription>
              </CardHeader>
              <CardContent>
                {creditLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No credit logs</p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {creditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                        data-testid={`credit-log-${log.id}`}
                      >
                        <div>
                          <p className="font-medium">{log.user_email}</p>
                          <p className="text-sm text-muted-foreground">{log.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-mono font-bold text-xl ${
                              log.amount > 0 ? "text-green-400" : "text-destructive"
                            }`}
                          >
                            {log.amount > 0 ? "+" : ""}
                            {log.amount}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Balance: {log.balance_after}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminLogs;
