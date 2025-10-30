"use client";

import { apiProxy } from "@/utils/api-proxy";
import { useEffect, useState } from "react";

export default function Home() {
  const [people, setPeople] = useState<
    {
      id: number;
      first_name: string;
      last_name: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const requestData = async () => {
        const people = await apiProxy.get("/api/people");
        console.log("PROXY GET:", people);
        setPeople(people);

        const echo = await apiProxy.post("/api/echo", {
          message: "Hello, backend!",
        });
        console.log("PROXY POST:", echo);
      };

      requestData();
    } catch (error) {
      console.error("Error fetching data via proxy:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold">
        Check console log and network devtools
      </h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {people.map((person) => (
            <div key={person.id}>
              {person.first_name} {person.last_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
