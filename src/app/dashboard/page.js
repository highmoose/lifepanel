"use client";

import React from "react";
import { useState, useEffect } from "react";
import NavMenu from "../../../components/navigation/navMenu";
import { auth } from "./../firebase/config";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import TaskManager from "@components/area/task-manager/taskManager";
import { QuickTabs } from "../../../components/overlay/quick-ticks/quickTicks";
import { ClipboardCheck } from "lucide-react";
import { Drawer } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { fetchUserByUid, selectUserData } from "@redux/slices/userSlice";

export default function DashboardPanel(signOut) {
  const router = useRouter();

  const dispatch = useDispatch();
  const userData = useSelector(selectUserData);

  const [selectedNav, setSelectedNav] = useState("taskManager");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(fetchUserByUid());
      } else {
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

  return (
    <div className=" relative w-full h-full flex bg-zinc-100">
      {/* Left Nav Bar */}
      <NavMenu
        userName={userData?.display_name}
        signOut={signOut}
        setSelectedNav={handleSelectedNav}
      />
      {/* Tabs */}
      <div className="h-[100vh] w-[100vw] overflow-hidden">
        <div className="w-full h-full  text-white text-sm pl-8 pt-6 flex flex-col gap-2">
          <div className="text-lg font-semibold rounded-2xl flex flex-col justify-between text-text">
            Welcome back, {userData?.display_name}!
          </div>
          {selectedNav === "dashboard" && <div>Dashboard Tab</div>}
          {selectedNav === "taskManager" && userData && (
            <TaskManager data={userData} />
          )}
          {selectedNav === "insights" && <div>Insights Tab</div>}
          {selectedNav === "docs" && <div>Docs Tab</div>}
          {selectedNav === "products" && <div>Products Tab</div>}
          {selectedNav === "settings" && <div>Settings Tab</div>}
          {selectedNav === "messages" && <div>Messages Tab</div>}
        </div>
      </div>
      {/* Overlays */}
      <QuickTabs />
    </div>
  );
}
