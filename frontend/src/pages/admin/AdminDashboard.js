import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { toast } from "sonner";
import { Shield, Users, Coins, FileText, Loader2, TrendingUp } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCreditsAssigned: 0,
    recentLogs: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, logsRes, creditLogsRes] = await Promise.all([
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/admin/usage-logs?limit=5`),
        axios.get(`${API}/admin/credit-logs?limit=100`),
      ]);

      const users = usersRes.data;
      const totalCredits = creditLogsRes.data
        .filter((log) => log.amount > 0)
        .reduce((sum, log) => sum + log.amount, 0);

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.is_active).length,
        totalCreditsAssigned: totalCredits,
        recentLogs: logsRes.data,
      });
    } catch (error) {
      toast.error("Failed to load admin stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="admin-dashboard">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, credits, and view system activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <p className="text-4xl font-mono font-bold text-foreground">{stats.totalUsers}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Users</p>
                <p className="text-4xl font-mono font-bold text-green-400">{stats.activeUsers}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Credits Assigned</p>
                <p className="text-4xl font-mono font-bold text-primary">
                  {stats.totalCreditsAssigned.toLocaleString()}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                <Coins className="w-7 h-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recent Activity</p>
                <p className="text-4xl font-mono font-bold text-accent">{stats.recentLogs.length}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center">
                <FileText className="w-7 h-7 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Tool Usage
          </CardTitle>
          <CardDescription>Latest activity across all users</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {stats.recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{log.user_email}</p>
                    <p className="text-sm text-muted-foreground">
                      {log.tool.replace(/_/g, " ")} • {log.details}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-destructive">-{log.credits_used}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
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

export default AdminDashboard;
