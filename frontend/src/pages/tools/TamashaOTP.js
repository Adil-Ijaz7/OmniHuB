import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Smartphone, Send, CheckCircle, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TamashaOTP = () => {
  const { refreshUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("send"); // send, verify
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const sendOTP = async () => {
    if (!phone) {
      toast.error("Please enter phone number");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/tools/tamasha-otp`, {
        phone,
        action: "send",
      });
      setResult(response.data);
      setStep("verify");
      toast.success(`OTP sent! (-${response.data.credits_used} credits)`);
      refreshUser();
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to send OTP";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      toast.error("Please enter OTP");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/tools/tamasha-otp`, {
        phone,
        action: "verify",
        otp,
      });
      setResult(response.data);
      toast.success("OTP verified successfully!");
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to verify OTP";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhone("");
    setOtp("");
    setStep("send");
    setResult(null);
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="tamasha-otp-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Tamasha OTP</h1>
          <p className="text-muted-foreground">Activate Tamasha with OTP verification</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          2 credits/activation
        </Badge>
      </div>

      <div className="max-w-xl">
        <Card className="border-border/50">
          <CardHeader>
            <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
              <Smartphone className="w-7 h-7 text-purple-400" />
            </div>
            <CardTitle>
              {step === "send" ? "Send OTP" : "Verify OTP"}
            </CardTitle>
            <CardDescription>
              {step === "send"
                ? "Enter your phone number to receive OTP"
                : "Enter the OTP sent to your phone"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "send" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+923001234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    data-testid="phone-input"
                    className="bg-muted/50"
                  />
                </div>
                <Button
                  onClick={sendOTP}
                  disabled={loading}
                  className="w-full"
                  data-testid="send-otp-btn"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send OTP
                </Button>
              </>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">OTP sent to:</p>
                  <p className="font-mono font-bold">{phone}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    data-testid="otp-input"
                    className="bg-muted/50 text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={reset}
                    className="flex-1"
                    data-testid="reset-btn"
                  >
                    Change Number
                  </Button>
                  <Button
                    onClick={verifyOTP}
                    disabled={loading}
                    className="flex-1"
                    data-testid="verify-otp-btn"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Verify
                  </Button>
                </div>
              </>
            )}

            {result && result.success && step === "verify" && (
              <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/50">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-bold">Verification Successful</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{result.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TamashaOTP;
