"use client";

import React from "react";
import { useState, useEffect } from "react";
import NavMenu from "../../../components/navigation/navMenu";
import { auth } from "./../firebase/config";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Projects from "../../../components/tabs/projects";
import QuickTicks from "../../../components/overlay/quickTicks";
import { ClipboardCheck } from "lucide-react";

export default function DashboardPanel(signOut) {
    const router = useRouter();

    const [user, setUser] = useState(null); // User details stored here - Push these to components if needed using props.
    const [selectedNav, setSelectedNav] = useState("dashboard");
    const [quickTicksOpen, setQuickTicksOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                setUser(null);
                router.push("/");
            }
        });

        return () => {
            unsubscribe();
        };
    }, [router]);

    const handleSelectedNav = (nav) => {
        setSelectedNav(nav);
    };

    const QuickTicksOverlay = () => {
        return (
            <>
                <div className="absolute bottom-[52px] right-0 m-6 rounded-xl">
                    {quickTicksOpen && (
                        <QuickTicks setQuickTicksOpen={setQuickTicksOpen} />
                    )}
                </div>
                <button
                    onClick={() => setQuickTicksOpen(!quickTicksOpen)}
                    className="absolute bottom-0 right-0 m-6 rounded-xl"
                >
                    <div
                        className={`flex w-12 h-12 ${
                            quickTicksOpen
                                ? "bg-gray-900 shadow-lg shadow-black/5"
                                : "bg-white"
                        } rounded-md items-center justify-center`}
                    >
                        <ClipboardCheck
                            size={26}
                            color={quickTicksOpen ? "white" : "black"}
                            noMargin
                        />
                    </div>
                </button>
            </>
        );
    };

    return (
        <div className=" relative w-full h-full flex bg-zinc-100">
            {/* Left Nav Bar */}
            <NavMenu
                userName={user?.displayName}
                signOut={signOut}
                setSelectedNav={handleSelectedNav}
            />
            {/* Tabs */}
            <div className="h-[100vh] w-[100vw] overflow-y-auto">
                <div className="w-full h-full text-white text-sm px-8 pt-6 flex flex-col gap-2">
                    <div className="text-lg font-semibold rounded-2xl flex flex-col justify-between text-text">
                        Welcome back, {user?.displayName}!
                    </div>
                    {selectedNav === "dashboard" && <div>Dashboard Tab</div>}
                    {selectedNav === "projects" && <Projects user={user} />}
                    {selectedNav === "insights" && <div>Insights Tab</div>}
                    {selectedNav === "docs" && <div>Docs Tab</div>}
                    {selectedNav === "products" && <div>Products Tab</div>}
                    {selectedNav === "settings" && <div>Settings Tab</div>}
                    {selectedNav === "messages" && <div>Messages Tab</div>}
                </div>
            </div>
            {/* Overlays Here */}
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px]">
                <QuickTicksOverlay
                    quickTicksOpen={quickTicksOpen}
                    setQuickTicksOpen={setQuickTicksOpen}
                />
            </div>
        </div>
    );
}
