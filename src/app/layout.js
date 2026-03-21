"use client";

import React from "react";
import { Roboto } from "next/font/google";
import { MantineProvider } from "@mantine/core";
import "./globals.css";
import "@mantine/dates/styles.css";
import "@mantine/core/styles.css";

// Redux
import { Provider as ReduxProvider } from "react-redux";
import store from "@redux/store";

// Geist Font

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
});

// export const metadata = {
//     title: "Life Panel",
//     description: "Life and Task Manager",
// };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={roboto.className}>
        <ReduxProvider store={store}>
          <MantineProvider theme={{}}>{children}</MantineProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
