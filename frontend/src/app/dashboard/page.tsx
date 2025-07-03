"use client";

import { useState, useEffect } from "react";
import OAuthButton from "@/components/OAuthButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Sparkles } from "lucide-react";
import { BASE_URL } from "@/lib/api";

export default function DashboardPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [editing, setEditing] = useState(false);
    const [savedName, setSavedName] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
    const [canEnter, setCanEnter] = useState(false);

    useEffect(() => {
        // Load from localStorage if available
        const stored = localStorage.getItem("user_name");
        if (stored) setSavedName(stored);
    }, []);

    const validate = () => {
        const errs: { name?: string; email?: string; password?: string } = {};
        if (!name.trim()) errs.name = "Name is required.";
        if (!email.match(/^\S+@\S+\.\S+$/)) errs.email = "Valid email required.";
        if (password.length < 6) errs.password = "Password must be at least 6 characters.";
        setErrors(errs);
        setCanEnter(Object.keys(errs).length === 0);
    };

    useEffect(() => { validate(); }, [name, email, password]);

    // Add user registration API call
    async function registerUser({ name, email, password }: { name: string; email: string; password: string }) {
        const res = await fetch(`${BASE_URL}/user/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.detail || "Registration failed");
        }
        return res.json();
    }

    // Fetch user details (including config, topics, progress)
    async function fetchUserDetails(email: string) {
        const res = await fetch(`${BASE_URL}/user/${encodeURIComponent(email)}`);
        if (!res.ok) throw new Error("Failed to fetch user details");
        return res.json();
    }

    const handleSave = async () => {
        validate();
        if (!canEnter) return;
        try {
            await registerUser({ name, email, password });
            setSavedName(name);
            localStorage.setItem("username", name);
            localStorage.setItem("username", name);
            setEditing(false);
        } catch (e: any) {
            setErrors((prev) => ({ ...prev, email: e.message }));
        }
    };

    // Example usage:
    // useEffect(() => {
    //   if (email) {
    //     fetchUserDetails(email).then(setUserData).catch(console.error);
    //   }
    // }, [email]);

    return (
        <div className="min-h-screen bg-[#1e1e2e] flex flex-col items-center justify-center px-4 py-12">
            <Card className="w-full max-w-xl bg-[#313244] border-[#45475a] shadow-2xl rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="flex items-center gap-2 text-[#cba6f7] text-2xl font-bold">
                        <User className="w-7 h-7 text-[#a6e3a1]" />
                        Dashboard
                    </CardTitle>
                    <Sparkles className="w-6 h-6 text-[#f9e2af] animate-pulse" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        <div className="bg-[#45475a]/60 rounded-xl p-6 flex flex-col items-center">
                            <h2 className="text-lg text-[#cdd6f4] mb-2 font-semibold">Welcome{savedName ? `, ${savedName}` : "!"}</h2>
                            {editing ? (
                                <div className="flex flex-col gap-2 w-full max-w-xs">
                                    <input
                                        className="bg-[#1e1e2e] border border-[#cba6f7] rounded-lg px-4 py-2 text-[#cdd6f4] focus:outline-none focus:ring-2 focus:ring-[#cba6f7]"
                                        placeholder="Enter your name..."
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                    {errors.name && <span className="text-[#f38ba8] text-xs">{errors.name}</span>}
                                    <input
                                        className="bg-[#1e1e2e] border border-[#cba6f7] rounded-lg px-4 py-2 text-[#cdd6f4] focus:outline-none focus:ring-2 focus:ring-[#cba6f7]"
                                        placeholder="Enter your email..."
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        type="email"
                                    />
                                    {errors.email && <span className="text-[#f38ba8] text-xs">{errors.email}</span>}
                                    <input
                                        className="bg-[#1e1e2e] border border-[#cba6f7] rounded-lg px-4 py-2 text-[#cdd6f4] focus:outline-none focus:ring-2 focus:ring-[#cba6f7]"
                                        placeholder="Enter a password..."
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        type="password"
                                    />
                                    {errors.password && <span className="text-[#f38ba8] text-xs">{errors.password}</span>}
                                    <div className="flex gap-2">
                                        <Button className="bg-[#a6e3a1] text-[#1e1e2e] hover:bg-[#94e2d5]" onClick={handleSave} disabled={!canEnter}>
                                            Save
                                        </Button>
                                        <Button variant="outline" className="border-[#f38ba8] text-[#f38ba8] hover:bg-[#f38ba8]/10" onClick={() => setEditing(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button className="bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#b4befe]" onClick={() => setEditing(true)}>
                                    {savedName ? "Change Name" : "Set Name"}
                                </Button>
                            )}
                        </div>
                        <div className="bg-[#45475a]/60 rounded-xl p-6 flex flex-col items-center gap-3">
                            <h3 className="text-[#cdd6f4] text-base font-semibold mb-2">Sign in with Google</h3>
                            <OAuthButton />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="mt-8 text-[#a6adc8] text-xs opacity-70 text-center">
                zen &mdash; Whisper 2025
            </div>
            <div className="flex justify-center mt-8">
                <a href="/" className="group">
                    <Button className="relative px-8 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-[#cba6f7] via-[#a6e3a1] to-[#f9e2af] text-[#1e1e2e] shadow-lg overflow-hidden border-0 transition-all duration-300 group-hover:scale-105">
                        <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#cba6f7]/30 via-[#a6e3a1]/30 to-[#f9e2af]/30 blur-lg opacity-60 z-0" />
                        <span className="relative z-10">← Back to Home</span>
                    </Button>
                </a>
            </div>
        </div>
    );
}
