"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser, selectUserError, selectUserLoading } from "@redux/slices/userSlice";

export default function Home() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [panel, setPanel] = useState("login");
    const [logoLoaded, setLogoLoaded] = useState(false);
    const [loginLoaded, setLoginLoaded] = useState(false);

    const dispatch = useDispatch();
    const router = useRouter();
    const isloading = useSelector(selectUserLoading);
    const error = useSelector(selectUserError);

    useEffect(() => {
        setLogoLoaded(true);
        setLoginLoaded(true);
        if (typeof window !== "undefined" && localStorage.getItem("auth_token")) {
            router.push("/dashboard");
        }
    }, []);

    const handleSignIn = async () => {
        const result = await dispatch(loginUser({ email, password }));
        if (!result.error) {
            router.push("/dashboard");
        }
    };

    const handleSignUp = async () => {
        const result = await dispatch(
            registerUser({
                email,
                password,
                password_confirmation: password,
                display_name: name,
            })
        );
        if (!result.error) {
            router.push("/dashboard");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-zinc-900">
            {/* Login Panel */}
            {panel === "login" && (
                <div>
                    <form className="w-[300px] bg-panel rounded-md shadow-lg p-8 flex flex-col justify-between">
                        <div className="flex items-center gap-x-2 mx-auto mb-4">
                            <Image
                                src="/images/logo/lp-logo.svg"
                                alt="Life Panel Logo"
                                className={`h-14 transform transition-transform duration-700 ${
                                    logoLoaded ? "translate-x-0" : "translate-y-[105px]"
                                }`}
                                width={80}
                                height={80}
                            />
                        </div>
                        <div
                            className={`transform transition-opacity duration-700 delay-300 ${
                                loginLoaded ? "opacity-100" : "opacity-0"
                            }`}
                        >
                            <div className="mb-4">
                                <input
                                    id="email"
                                    type="text"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="text-sm shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div className="mb-4">
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="text-sm shadow border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                {error && (
                                    <p className="text-red-500 text-xs italic">{error}</p>
                                )}
                            </div>
                            <div className="flex gap-x-2 mb-2">
                                {isloading ? (
                                    <button
                                        type="button"
                                        className="flex-grow bg-zinc-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    >
                                        Please Wait...
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSignIn}
                                        className="flex-grow bg-primary hover:bg-orange-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    >
                                        Sign In
                                    </button>
                                )}
                            </div>
                            <a
                                onClick={() => setPanel("signup")}
                                className="text-sm text-text gap-1 mt-4 hover:text-textorange cursor-pointer flex justify-center items-center w-full"
                            >
                                <p>Need an account?</p>
                                <span className="underline">Sign up</span>
                            </a>
                        </div>
                    </form>
                </div>
            )}
            {/* Sign Up Panel */}
            {panel === "signup" && (
                <div>
                    <form className="w-[300px] bg-panel rounded-md shadow-lg p-8 flex flex-col justify-between">
                        <div className="flex items-center gap-x-2 mx-auto mb-2">
                            <Image
                                src="/images/logo/lp-logo.svg"
                                alt="Life Panel Logo"
                                className="h-14"
                                width={80}
                                height={80}
                            />
                        </div>
                        <p className="text-sm text-center mb-4">Complete the form below</p>
                        <div>
                            <div className="mb-4">
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="text-sm shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div className="mb-4">
                                <input
                                    id="email"
                                    type="text"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="text-sm shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div className="mb-4">
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Password (min 8 chars)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="text-sm shadow border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                {error && (
                                    <p className="text-red-500 text-xs italic">{error}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-x-2 mb-2">
                            <button
                                type="button"
                                onClick={handleSignUp}
                                className="flex-grow bg-primary hover:bg-orange-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Create Account
                            </button>
                        </div>
                    </form>
                    <a
                        onClick={() => setPanel("login")}
                        className="text-sm mt-4 text-white hover:text-textorange cursor-pointer flex justify-center items-center w-full"
                    >
                        Go Back
                    </a>
                </div>
            )}
        </div>
    );
}
