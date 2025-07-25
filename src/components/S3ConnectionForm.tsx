import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Cloud, Key, MapPin, Database } from "lucide-react";
import { S3Credentials } from "@/types/s3Types";
import { useToast } from "@/hooks/use-toast";

interface S3ConnectionFormProps {
  onConnect: (credentials: S3Credentials) => Promise<void>;
  loading: boolean;
}

export const S3ConnectionForm: React.FC<S3ConnectionFormProps> = ({
  onConnect,
  loading,
}) => {
  const [formData, setFormData] = useState<S3Credentials>({
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1",
    bucketName: "",
  });
  const [rememberCredentials, setRememberCredentials] = useState(false);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formData.accessKeyId ||
      !formData.secretAccessKey ||
      !formData.bucketName
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      await onConnect(formData);

      if (rememberCredentials) {
        localStorage.setItem("s3-credentials", JSON.stringify(formData));
      }

      toast({
        title: "Connection Successful",
        description: `Connected to bucket: ${formData.bucketName}`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Connection failed";
      setError(errorMessage);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof S3Credentials, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg pt-3">
      {/* <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Cloud className="h-12 w-12 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Connect to AWS S3</CardTitle>
        <CardDescription className="text-base">
          Enter your AWS credentials to access your S3 bucket
        </CardDescription>
      </CardHeader> */}

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6 mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="accessKeyId"
                className="flex items-center space-x-2"
              >
                <Key className="h-4 w-4" />
                <span>Access Key ID</span>
              </Label>
              <Input
                id="accessKeyId"
                type="text"
                value={formData.accessKeyId}
                onChange={(e) =>
                  handleInputChange("accessKeyId", e.target.value)
                }
                placeholder="AKIA..."
                required
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="secretAccessKey"
                className="flex items-center space-x-2"
              >
                <Key className="h-4 w-4" />
                <span>Secret Access Key</span>
              </Label>
              <Input
                id="secretAccessKey"
                type="password"
                value={formData.secretAccessKey}
                onChange={(e) =>
                  handleInputChange("secretAccessKey", e.target.value)
                }
                placeholder="Your secret key"
                required
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Region</span>
              </Label>
              <Input
                id="region"
                type="text"
                value={formData.region}
                onChange={(e) => handleInputChange("region", e.target.value)}
                placeholder="us-east-1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="bucketName"
                className="flex items-center space-x-2"
              >
                <Database className="h-4 w-4" />
                <span>Bucket Name</span>
              </Label>
              <Input
                id="bucketName"
                type="text"
                value={formData.bucketName}
                onChange={(e) =>
                  handleInputChange("bucketName", e.target.value)
                }
                placeholder="my-bucket-name"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberCredentials}
              onCheckedChange={(checked) =>
                setRememberCredentials(checked as boolean)
              }
            />
            <Label htmlFor="remember" className="text-sm">
              Remember credentials (stored locally)
            </Label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Cloud className="mr-2 h-4 w-4" />
                Connect to S3
              </>
            )}
          </Button>
        </form>{" "}
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              🚀 Setup Your S3 Bucket
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              Configure your S3 bucket for Chai Storage access:
            </p>

            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-gray-800 mb-2">
                  1. Configure CORS Policy
                </h5>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>• Go to your AWS S3 Console</p>
                  <p>• Select your bucket → Permissions tab</p>
                  <p>• Find Cross-origin resource sharing (CORS)</p>
                  <p>• Click Edit and paste the JSON below:</p>
                </div>
                <div className="mt-2 p-3 bg-white border border-gray-300 rounded text-xs font-mono overflow-x-auto">
                  <pre>{`[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": [
            "https://storage.chaicode.com",
            "http://localhost:*",
            "https://localhost:*",
            "*"
        ],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]`}</pre>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-800 mb-2">
                  2. Required IAM Permissions
                </h5>
                <p className="text-sm text-gray-700 mb-2">
                  Your AWS credentials need these S3 permissions:
                </p>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>• s3:GetObject</p>
                  <p>• s3:PutObject</p>
                  <p>• s3:ListBucket</p>
                  <p>• s3:DeleteObject</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">
              Security Notice
            </h4>
            <p className="text-sm text-yellow-700">
              Your AWS credentials are stored locally in your browser and never
              sent to any server. For security, use IAM users with minimal
              required permissions for S3 access only.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
