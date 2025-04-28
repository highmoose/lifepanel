"use client";

import React, { useState } from "react";
import Image from "next/image";
import { auth } from "../../src/app/firebase/config";
import { signOut } from "firebase/auth";
import {
  BarChart4,
  CircleUser,
  Files,
  Gauge,
  ListChecks,
  MessageSquareText,
  ShoppingCart,
  SlidersVertical,
} from "lucide-react";

export default function NavMenu({ userName, setSelectedNav }) {
  const [width, setWidth] = useState("thin");
  const [selected, setSelected] = useState("taskManager");

  const handleSelectedNav = (nav) => {
    setSelected(nav);
    setSelectedNav(nav);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error: ", error);
    }
  };

  const navItems = [
    // {
    //     id: "dashboard",
    //     label: "Dashboard",
    //     icon: <Gauge size={18} className="text-gray-400" />,
    // },
    {
      id: "taskManager",
      label: "Task Manager",
      icon: <ListChecks size={18} className="text-gray-400" />,
    },
    // {
    //     id: "insights",
    //     label: "Insights",
    //     icon: <BarChart4 size={18} className="text-gray-400" />,
    // },
    // {
    //     id: "docs",
    //     label: "Docs",
    //     icon: <Files size={18} className="text-gray-400" />,
    // },
    // {
    //     id: "products",
    //     label: "Products",
    //     icon: <ShoppingCart size={18} className="text-gray-400" />,
    // },
    // {
    //     id: "settings",
    //     label: "Settings",
    //     icon: <SlidersVertical size={18} className="text-gray-400" />,
    // },
    // {
    //     id: "messages",
    //     label: "Messages",
    //     icon: <MessageSquareText size={18} className="text-gray-400" />,
    //     hasNotification: true,
    // },
  ];

  const renderNavItems = (isWide) =>
    navItems.map((item) => (
      <a
        key={item.id}
        onClick={() => handleSelectedNav(item.id)}
        className={`relative flex items-center w-full h-10 px-3  ${
          selected === item.id
            ? "text-gray-200 bg-zinc-800 rounded-sm mr-1"
            : "hover:bg-zinc-200 rounded-sm hover:text-zinc-500"
        }`}
        href="#"
        aria-label={item.label}
      >
        {item.icon}
        {isWide && (
          <span className="ml-2 text-sm font-normal  ">{item.label}</span>
        )}
        {item.hasNotification && (
          <span
            className={`absolute top-1 ${
              isWide ? "left-[104px]" : "left-8"
            } w-2 h-2 bg-primary rounded-full`}
          ></span>
        )}
      </a>
    ));

  return (
    <div className="h-screen">
      {/* Thin Nav */}
      {width === "thin" && (
        <div className="flex flex-col items-center w-16 h-full overflow-hidden text-zinc-200 bg-zinc-900 rounded-r">
          <a className="flex items-start justify-center mt-5 mb-5" href="#">
            <Image
              src="/images/logo/lp-logo.svg"
              alt="Life Panel Logo"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </a>
          <div className="flex flex-col items-center mt-3 ">
            {renderNavItems(false)}
          </div>
          <div className="flex flex-col items-center mt-auto w-full">
            <button
              onClick={() => setWidth("wide")}
              className="text-sm hover:text-primary w-full h-12 flex justify-center items-center hover:bg-zinc-200 rounded-sm"
            >
              Expand
            </button>
            <button
              onClick={handleSignOut}
              className="text-sm hover:text-primary w-full h-12 flex justify-center items-center hover:bg-zinc-200 rounded-sm"
            >
              X
            </button>
          </div>
        </div>
      )}

      {/* Wide Nav */}
      {width === "wide" && (
        <div className="flex flex-col items-center w-48 h-full overflow-hidden text-zinc-200 bg-zinc-900 rounded-sm">
          <a className="flex items-start w-full px-3 mt-3.5 mb-4 pl-5" href="#">
            <div className="flex items-center gap-x-2">
              <Image
                src="/images/logo/lp-logo.svg"
                alt="Life Panel Logo"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <p className="text-center text-md text-white font-semibold">
                Life Panel
              </p>
            </div>
          </a>
          <div className="w-full px-2">
            <div className="flex flex-col items-center w-full mt-3 ml-0.5">
              {renderNavItems(true)}
            </div>
          </div>
          <div className="flex flex-col items-center mt-auto w-full p-2">
            <a
              className="flex items-center  w-full h-12 pl-3 bg-zinc-900 hover:bg-zinc-200  hover:text-zinc-900 rounded-sm"
              href="#"
            >
              <CircleUser size={20} className="stroke-current" />
              <span className="ml-2 text-sm font-medium text-white">
                {userName}
              </span>
            </a>
            <button
              onClick={() => setWidth("thin")}
              className="text-sm hover:text-primary w-full h-12 flex pl-3 items-center hover:bg-zinc-200 rounded-sm"
            >
              Compress Nav
            </button>
            <button
              onClick={handleSignOut}
              className="text-sm hover:text-primary w-full h-12 flex pl-3 items-center hover:bg-zinc-200 rounded-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
