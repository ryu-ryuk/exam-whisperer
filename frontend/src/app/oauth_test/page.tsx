import { GoogleOAuthProvider } from "@react-oauth/google";

export default function OAuthTestPage() {
    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
            <div className="flex h-screen items-center justify-center">
                <h1 className="text-2xl font-bold">OAuth Test Page</h1>
            </div>
        </GoogleOAuthProvider>
    );
}
