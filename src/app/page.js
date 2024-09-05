"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { initializeApp } from "firebase/app";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../src/app/firebase/config";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
} from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function Home() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [panel, setPanel] = useState("login");

    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push("/dashboard");
            }
        });

        return () => unsubscribe();
    }, []);

    const addUserData = async () => {
        try {
            if (!auth.currentUser) {
                console.error("User is not authenticated");
                return;
            }

            const userDocRef = doc(db, "userData", auth.currentUser.uid);

            await setDoc(userDocRef, {});

            console.log("UUID added successfully");
        } catch (e) {
            console.error("Error adding UUID: ", e);
        }
    };
    const handleSignUp = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;

            // Update user profile with name
            await updateProfile(auth.currentUser, {
                displayName: name,
            });
            addUserData();
            // Signed up successfully
        } catch (error) {
            setError(error.message);
        }
    };

    const handleSignIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Signed in successfully
        } catch (error) {
            setError(error.message);
        }
    };

    const handleForgotPassword = async () => {
        try {
            await sendPasswordResetEmail(auth, email);
            // Password reset email sent
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-bg">
            {/* Login Panel*/}
            {panel === "login" && (
                <div>
                    <form className="w-[300px] bg-panel rounded-2xl shadow-lg p-8 flex flex-col justify-between">
                        <div className="flex items-center gap-x-2 mx-auto mb-4">
                            <Image
                                src="/images/logo/lp-logo.svg"
                                alt="Life Panel Logo"
                                className="h-8"
                                width={40}
                                height={40}
                            />
                            <p className="text-center text-lg text-text font-semibold">
                                Life Panel
                            </p>
                        </div>
                        <div>
                            <div className="mb-4">
                                <label
                                    className="block text-gray-700 text-sm font-bold mb-2"
                                    for="email"
                                >
                                    Email
                                </label>
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
                                <label
                                    className="block text-gray-700 text-sm font-bold mb-2"
                                    for="password"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="******************"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className="text-sm shadow border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                {error && (
                                    <p className="text-red-500 text-xs italic">
                                        {error}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-x-2 mb-2">
                            <button
                                type="button"
                                onClick={handleSignIn}
                                className="flex-grow bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Sign In
                            </button>
                        </div>
                        <a
                            onClick={() => setPanel("signup")}
                            className="text-sm text-text hover:text-textpink flex justify-center items-center w-full my-1"
                        >
                            Create an Account
                        </a>
                        <a
                            onClick={() => setPanel("forgotpassword")}
                            className="text-sm text-text hover:text-textpink flex justify-center items-center w-full"
                        >
                            Forgot Password?
                        </a>
                    </form>
                </div>
            )}
            {/* Sign Up Panel */}
            {panel === "signup" && (
                <div>
                    <form className="w-[300px] bg-panel rounded-2xl shadow-lg p-8 flex flex-col justify-between">
                        <div className="flex items-center gap-x-2 mx-auto mb-4">
                            <Image
                                src="/images/logo/lp-logo.svg"
                                alt="Life Panel Logo"
                                className="h-8"
                                width={40}
                                height={40}
                            />
                            <p className="text-center text-lg text-text font-semibold">
                                Life Panel
                            </p>
                        </div>
                        <div>
                            <div className="mb-4">
                                <label
                                    className="block text-gray-700 text-sm font-bold mb-2"
                                    for="name"
                                >
                                    Name
                                </label>
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
                                <label
                                    className="block text-gray-700 text-sm font-bold mb-2"
                                    for="email"
                                >
                                    Email
                                </label>
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
                                <label
                                    className="block text-gray-700 text-sm font-bold mb-2"
                                    for="password"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="******************"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className="text-sm shadow border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                {error && (
                                    <p className="text-red-500 text-xs italic">
                                        {error}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-x-2 mb-2">
                            <button
                                type="button"
                                onClick={handleSignUp}
                                className="flex-grow bg-textorange hover:bg-zinc-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Create Account
                            </button>
                        </div>

                        <a
                            onClick={() => setPanel("login")}
                            className="text-sm text-text hover:text-textpink flex justify-center items-center w-full"
                        >
                            Go Back
                        </a>
                    </form>
                </div>
            )}
            {/* Forgot Password Panel */}
            {panel === "forgotpassword" && (
                <div>
                    <form className="w-[300px]  bg-panel rounded-2xl shadow-lg p-8 flex flex-col justify-between">
                        <div className="flex items-center gap-x-2 mx-auto mb-4">
                            <Image
                                src="/images/logo/lp-logo.svg"
                                alt="Life Panel Logo"
                                className="h-8"
                                width={40}
                                height={40}
                            />
                            <p className="text-center text-lg text-text font-semibold">
                                Life Panel
                            </p>
                        </div>
                        <p className="text-text text-center text-xs mb-4">
                            Your password recovery email will be sent to this
                            email address
                        </p>

                        <div>
                            <div className="mb-4">
                                <label
                                    className="block text-gray-700 text-sm font-bold mb-2"
                                    for="email"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="text"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="text-sm shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                        </div>
                        <div className="flex gap-x-2 mb-2">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="flex-grow bg-zinc-900 hover:bg-textpink text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Forgot Password
                            </button>
                        </div>

                        <a
                            onClick={() => setPanel("login")}
                            className="text-sm text-text hover:text-textpink flex justify-center items-center w-full"
                        >
                            Go Back
                        </a>
                    </form>
                </div>
            )}
            <div className="text-sm mt-4">
                {user ? (
                    <div className="text-green-500">
                        <p>
                            User is logged in! {user.displayName} - {user.email}
                        </p>
                    </div>
                ) : (
                    <div className="text-red-500">
                        <p>User is not logged in!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
