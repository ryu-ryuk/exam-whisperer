"use client";
import { GoogleLogin } from '@react-oauth/google';

export default function OAuthButton() {
    return (
        <GoogleLogin
        onSuccess={credentialResponse => {
            const access_token = credentialResponse.credential;
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: access_token }),
            })
            // Need to save it
        }}
        onError={() => {
            console.log('Login Failed');
        }}
    />
    );
}
