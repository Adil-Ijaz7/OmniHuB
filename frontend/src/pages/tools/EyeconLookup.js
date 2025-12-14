import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Search, Loader2, User, Phone } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EyeconLookup = () => {
  const { refreshUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const lookup = async () => {
    if (!phone) {
      toast.error("Please enter a phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/tools/eyecon-lookup`, { phone });
      setResult(response.data);
      toast.success(`Lookup complete! (-${response.data.credits_used} credit)`);
      refreshUser();
    } catch (error) {
      const message = error.response?.data?.detail || "Lookup failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="eyecon-lookup-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Eyecon Lookup</h1>
          <p className="text-muted-foreground">Find names associated with phone numbers</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          1 credit/lookup
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <div className="w-14 h-14 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-pink-400" />
            </div>
            <CardTitle>Phone to Name Lookup</CardTitle>
            <CardDescription>Enter a phone number to find associated names</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+923001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  data-testid="eyecon-phone-input"
                  className="bg-muted/50 flex-1"
                />
                <Button onClick={lookup} disabled={loading} data-testid="eyecon-lookup-btn">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Include country code for international numbers (e.g., +92 for Pakistan)
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Results
            </CardTitle>
            <CardDescription>Names found for this number</CardDescription>
          </CardHeader>
          <CardContent>
            {result?.data ? (
              <div className="space-y-3" data-testid="eyecon-results">
                {Array.isArray(result.data) ? (
                  result.data.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{item.name || item}</p>
                        {item.source && (
                          <p className="text-sm text-muted-foreground">{item.source}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : typeof result.data === "object" ? (
                  Object.entries(result.data).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">{key}</p>
                        <p className="font-bold">{String(value)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No results yet</p>
                <p className="text-sm">Enter a phone number to search</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EyeconLookup;
