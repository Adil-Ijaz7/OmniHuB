import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Phone, Search, Loader2, User, MapPin, CreditCard, Hash, Eye, EyeOff } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Mask sensitive data
const maskCNIC = (cnic) => {
  if (!cnic) return "N/A";
  const str = String(cnic);
  if (str.length >= 8) {
    return str.slice(0, 5) + "****" + str.slice(-4);
  }
  return str;
};

const maskAddress = (address) => {
  if (!address) return "N/A";
  const str = String(address);
  if (str.length > 20) {
    return str.slice(0, 20) + "...";
  }
  return str;
};

const PhoneLookup = () => {
  const { refreshUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showSensitive, setShowSensitive] = useState(false);

  // Sanitize phone input - strip non-numeric
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
      const response = await axios.post(`${API}/tools/phone-lookup`, { phone: cleanPhone });
      const data = response.data;
      
      setResult(data);
      
      if (data.success && data.results && data.results.length > 0) {
        toast.success(`Found ${data.results_count} record(s)! (-${data.credits_used} credit)`);
      } else {
        toast.info(`No records found for ${data.query}`);
      }
      refreshUser();
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.error || "Lookup failed";
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

  // Get the first result from results array
  const record = result?.results?.[0] || null;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="phone-lookup-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Phone Lookup</h1>
          <p className="text-muted-foreground">Search phone numbers in the database</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          1 credit/lookup
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Card */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
              <Phone className="w-7 h-7 text-cyan-400" />
            </div>
            <CardTitle>Search Phone Number</CardTitle>
            <CardDescription>Enter a Pakistani mobile number (e.g., 03001234567 or 923001234567)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="03001234567 or +92 300-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyPress={handleKeyPress}
                  data-testid="phone-input"
                  className="bg-muted/50 flex-1"
                />
                <Button onClick={lookup} disabled={loading} data-testid="lookup-btn">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Formats accepted: 03001234567, 923001234567, +92 300-1234567
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Results
              </CardTitle>
              {record && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSensitive(!showSensitive)}
                  data-testid="toggle-sensitive-btn"
                >
                  {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span className="ml-1 text-xs">{showSensitive ? "Hide" : "Show"} Full</span>
                </Button>
              )}
            </div>
            <CardDescription>
              {result?.query ? `Query: ${result.query}` : "Phone number information"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Searching database...</p>
              </div>
            ) : record ? (
              <div className="space-y-4" data-testid="lookup-results">
                {/* Name */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
                    <p className="font-bold text-lg" data-testid="result-name">{record.name || "N/A"}</p>
                  </div>
                </div>

                {/* Mobile */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Mobile</p>
                    <p className="font-medium font-mono" data-testid="result-mobile">{record.mobile || "N/A"}</p>
                  </div>
                </div>

                {/* CNIC */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">CNIC</p>
                    <p className="font-medium font-mono" data-testid="result-cnic">
                      {showSensitive ? (record.cnic || "N/A") : maskCNIC(record.cnic)}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Address</p>
                    <p className="font-medium text-sm" data-testid="result-address">
                      {showSensitive ? (record.address || "N/A") : maskAddress(record.address)}
                    </p>
                  </div>
                </div>

                {/* Additional fields if present */}
                {Object.entries(record)
                  .filter(([key]) => !['name', 'mobile', 'cnic', 'address'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center flex-shrink-0">
                        <Hash className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{key}</p>
                        <p className="font-medium">{String(value) || "N/A"}</p>
                      </div>
                    </div>
                  ))}

                {/* Results count badge */}
                {result.results_count > 1 && (
                  <div className="text-center pt-2">
                    <Badge variant="outline">
                      Showing 1 of {result.results_count} records
                    </Badge>
                  </div>
                )}
              </div>
            ) : result && !result.success ? (
              <div className="py-12 text-center">
                <Phone className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-foreground">No Record Found</p>
                <p className="text-sm text-muted-foreground">No data found for {result.query}</p>
              </div>
            ) : result && result.success && result.results?.length === 0 ? (
              <div className="py-12 text-center">
                <Phone className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-foreground">No Record Found</p>
                <p className="text-sm text-muted-foreground">No data found for {result.query}</p>
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <Phone className="w-16 h-16 mx-auto mb-4 opacity-50" />
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

export default PhoneLookup;
