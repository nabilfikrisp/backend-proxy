"use client";

import { apiProxy } from "@/utils/api-proxy";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const requestData = async () => {
      const people = await apiProxy.get("/api/people");
      console.log("PROXY GET:", people);

      const echo = await apiProxy.post("/api/echo", {
        message: "Hello, backend!",
      });
      console.log("PROXY POST:", echo);
    };

    requestData();
  }, []);

  return <h1 className="text-3xl font-bold">Check console log</h1>;
}
