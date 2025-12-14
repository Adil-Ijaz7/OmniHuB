import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Search, Loader2, User, Phone, AlertCircle, CheckCircle, Info } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EyeconLookup = () => {
  const { refreshUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Sanitize phone input
  const sanitizePhone = (input) => {
    return input.replace(/\D/g, '');
  };

  const lookup = async () => {
    const cleanPhone = sanitizePhone(phone);
    if (!cleanPhone) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(`${API}/tools/eyecon-lookup`, { phone: cleanPhone });
      const data = response.data;
      
      setResult(data);
      
      if (data.names && data.names.length > 0) {
        toast.success(`Found ${data.names.length} name(s)! (-${data.credits_used} credit)`);
      } else if (data.mode === "safe") {
        toast.info(`Safe mode: ${data.message || "No names found"}`);
      } else {
        toast.info("No names found for this number");
      }
      
      refreshUser();
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || "Lookup failed";
      toast.error(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      lookup();
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
        {/* Search Card */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="w-14 h-14 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-pink-400" />
            </div>
            <CardTitle>Phone to Name Lookup</CardTitle>
            <CardDescription>Enter a phone number to find associated names via Eyecon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+923001234567 or 03001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyPress={handleKeyPress}
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
              <p className="text-xs text-muted-foreground">
                Include country code for best results (e.g., +92 for Pakistan)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Results
            </CardTitle>
            <CardDescription>
              {result?.query ? `Query: ${result.query}` : "Names found for this number"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Searching Eyecon database...</p>
              </div>
            ) : result ? (
              <div className="space-y-4" data-testid="eyecon-results">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {result.mode === "live" ? (
                    <Badge className="bg-green-500/20 text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Live Mode
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Safe Mode
                    </Badge>
                  )}
                  {result.status_code && (
                    <Badge variant="outline">
                      Status: {result.status_code}
                    </Badge>
                  )}
                  {result.headers_configured !== undefined && (
                    <Badge variant="outline" className={result.headers_configured ? "text-green-400" : "text-yellow-400"}>
                      Headers: {result.headers_configured ? "Configured" : "Not Set"}
                    </Badge>
                  )}
                </div>

                {/* Names List */}
                {result.names && result.names.length > 0 ? (
                  <div className="space-y-3">
                    {result.names.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-lg" data-testid={`eyecon-name-${index}`}>
                            {typeof item === 'string' ? item : (item.name || item.displayName || JSON.stringify(item))}
                          </p>
                          {item.source && (
                            <p className="text-sm text-muted-foreground">Source: {item.source}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium text-foreground">No Names Found</p>
                    <p className="text-sm text-muted-foreground">
                      {result.message || "No names associated with this number"}
                    </p>
                  </div>
                )}

                {/* Message if present */}
                {result.message && result.names?.length === 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                    <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                )}

                {/* Debug info for development */}
                {result.raw_data && (
                  <details className="mt-4">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      View Raw Response
                    </summary>
                    <pre className="mt-2 p-3 rounded-lg bg-muted/50 text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.raw_data, null, 2)}
                    </pre>
                  </details>
                )}

                {result.raw_response && (
                  <details className="mt-4">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      View Raw Response Text
                    </summary>
                    <pre className="mt-2 p-3 rounded-lg bg-muted/50 text-xs overflow-auto max-h-40">
                      {result.raw_response}
                    </pre>
                  </details>
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
