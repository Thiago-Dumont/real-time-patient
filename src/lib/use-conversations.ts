import { useEffect, useState, useCallback } from "react";
import { supabase, type Conversation } from "./supabase";

export function useConversations() {
  const [data, setData] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtime, setRealtime] = useState(false);

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) {
      setError(error.message);
    } else {
      setData((data || []) as Conversation[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        (payload) => {
          setData((prev) => {
            if (payload.eventType === "INSERT") {
              return [payload.new as Conversation, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((c) =>
                String(c.id) === String((payload.new as Conversation).id)
                  ? (payload.new as Conversation)
                  : c,
              );
            }
            if (payload.eventType === "DELETE") {
              return prev.filter(
                (c) => String(c.id) !== String((payload.old as Conversation).id),
              );
            }
            return prev;
          });
        },
      )
      .subscribe((status) => {
        setRealtime(status === "SUBSCRIBED");
      });

    const interval = setInterval(fetchData, 30000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { data, loading, error, realtime, refresh: fetchData };
}