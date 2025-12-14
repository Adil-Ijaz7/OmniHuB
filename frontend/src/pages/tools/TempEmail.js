import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Mail, RefreshCw, Copy, Inbox, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TempEmail = () => {
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingMail, setCheckingMail] = useState(false);

  const generateEmail = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/tools/temp-email`, {
        action: "generate",
      });
      setEmail(response.data.email);
      setMessages([]);
      toast.success(`Email generated! (-${response.data.credits_used} credit)`);
      refreshUser();
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to generate email";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const checkInbox = async () => {
    if (!email) return;
    setCheckingMail(true);
    try {
      const response = await axios.post(`${API}/tools/temp-email`, {
        action: "check",
        email,
      });
      setMessages(response.data.messages || []);
      if (response.data.messages?.length === 0) {
        toast.info("No new messages");
      } else {
        toast.success(`Found ${response.data.messages.length} message(s)`);
      }
    } catch (error) {
      toast.error("Failed to check inbox");
    } finally {
      setCheckingMail(false);
    }
  };

  const copyEmail = () => {
    if (email) {
      navigator.clipboard.writeText(email);
      toast.success("Email copied to clipboard");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="temp-email-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Temporary Email</h1>
          <p className="text-muted-foreground">Generate disposable email addresses</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          1 credit/email
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Generator */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
              <Mail className="w-7 h-7 text-green-400" />
            </div>
            <CardTitle>Your Temporary Email</CardTitle>
            <CardDescription>Use this email for sign-ups and verifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {email ? (
              <>
                <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
                  <span className="font-mono text-lg break-all" data-testid="generated-email">
                    {email}
                  </span>
                  <Button variant="ghost" size="icon" onClick={copyEmail} data-testid="copy-email-btn">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={generateEmail}
                    disabled={loading}
                    className="flex-1"
                    data-testid="new-email-btn"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    New Email
                  </Button>
                  <Button
                    onClick={checkInbox}
                    disabled={checkingMail}
                    className="flex-1"
                    data-testid="check-inbox-btn"
                  >
                    {checkingMail ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Inbox className="w-4 h-4 mr-2" />
                    )}
                    Check Inbox
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={generateEmail}
                disabled={loading}
                className="w-full"
                data-testid="generate-email-btn"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Generate Email
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Inbox */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="w-5 h-5" />
              Inbox
            </CardTitle>
            <CardDescription>
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Click "Check Inbox" to refresh</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    data-testid={`message-${index}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm truncate">{msg.from}</span>
                      <span className="text-xs text-muted-foreground">{msg.date}</span>
                    </div>
                    <p className="text-sm text-foreground truncate">{msg.subject}</p>
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

export default TempEmail;
