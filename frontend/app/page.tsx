"use client";

import { apiProxy } from "@/utils/api-proxy";
import { useQuery } from "@tanstack/react-query";

type Person = {
  id: number;
  first_name: string;
  last_name: string;
  postal_code: string;
  salary: number;
};

export default function Home() {
  const { data, error } = useQuery({
    queryKey: ["people"],
    queryFn: async () => {
      const response = await apiProxy.get("/api/people");
      return response as Person[];
    },
  });

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  if (!data) {
    return <p>Loading...</p>;
  }

  console.log(data);
  return (
    <div>
      <h1 className="text-3xl font-bold">
        Check console log and network devtools
      </h1>
      {data && (
        <div>
          {data.map((person) => (
            <div key={person.id}>
              {person.first_name} {person.last_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
