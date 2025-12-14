import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { Coins, Loader2, Plus, Minus } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminCredits = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState("add");
  const [loading, setLoading] = useState(false);
  const [creditLogs, setCreditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchCreditLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`);
      setUsers(response.data.filter((u) => u.role !== "admin"));
    } catch (error) {
      toast.error("Failed to load users");
    }
  };

  const fetchCreditLogs = async () => {
    try {
      const response = await axios.get(`${API}/admin/credit-logs?limit=20`);
      setCreditLogs(response.data);
    } catch (error) {
      toast.error("Failed to load credit logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  const updateCredits = async () => {
    if (!selectedUser || !amount || !reason) {
      toast.error("Please fill all fields");
      return;
    }

    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const finalAmount = action === "add" ? numAmount : -numAmount;
      await axios.post(`${API}/admin/credits`, {
        user_id: selectedUser,
        amount: finalAmount,
        reason,
      });
      toast.success(`Credits ${action === "add" ? "added" : "deducted"} successfully`);
      setAmount("");
      setReason("");
      setSelectedUser("");
      fetchUsers();
      fetchCreditLogs();
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to update credits";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const selectedUserData = users.find((u) => u.id === selectedUser);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-credits-page">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Manage Credits</h1>
        <p className="text-muted-foreground">Assign or deduct credits from users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Form */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
              <Coins className="w-7 h-7 text-primary" />
            </div>
            <CardTitle>Update Credits</CardTitle>
            <CardDescription>Add or deduct credits from a user's account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger data-testid="user-select">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.credits} credits
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUserData && (
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-3xl font-mono font-bold text-primary">
                  {selectedUserData.credits.toLocaleString()}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Action</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={action === "add" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setAction("add")}
                  data-testid="add-credits-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Credits
                </Button>
                <Button
                  type="button"
                  variant={action === "deduct" ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={() => setAction("deduct")}
                  data-testid="deduct-credits-btn"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Deduct Credits
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                data-testid="amount-input"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Reason for credit update..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                data-testid="reason-input"
                className="bg-muted/50"
              />
            </div>

            <Button
              onClick={updateCredits}
              disabled={loading}
              className="w-full"
              variant={action === "deduct" ? "destructive" : "default"}
              data-testid="submit-credits-btn"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : action === "add" ? (
                <Plus className="w-4 h-4 mr-2" />
              ) : (
                <Minus className="w-4 h-4 mr-2" />
              )}
              {action === "add" ? "Add" : "Deduct"} Credits
            </Button>
          </CardContent>
        </Card>

        {/* Credit Logs */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Credit History</CardTitle>
            <CardDescription>Recent credit transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLogs ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : creditLogs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Coins className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No credit transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {creditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    data-testid={`credit-log-${log.id}`}
                  >
                    <div>
                      <p className="font-medium text-sm">{log.user_email}</p>
                      <p className="text-xs text-muted-foreground">{log.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-mono font-bold ${
                          log.amount > 0 ? "text-green-400" : "text-destructive"
                        }`}
                      >
                        {log.amount > 0 ? "+" : ""}
                        {log.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Balance: {log.balance_after}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCredits;
