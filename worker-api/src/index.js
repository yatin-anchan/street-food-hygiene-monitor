import { createClient } from "@supabase/supabase-js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

    // =========================
    // POST /api/submit
    // =========================

    if (request.method === "POST" && url.pathname === "/api/submit") {
      try {
        const body = await request.json();

        // Validate required field
        if (!body.description || body.description.trim().length < 5) {
          return Response.json(
            { error: "Message too short (minimum 5 characters)" },
            { status: 400, headers: corsHeaders }
          );
        }

        if (body.description.trim().length > 1000) {
          return Response.json(
            { error: "Message too long (maximum 1000 characters)" },
            { status: 400, headers: corsHeaders }
          );
        }

        // Insert into Supabase
        const { error: insertError } = await supabase
          .from("complaints")
          .insert([
            {
              vendor_name: body.vendor_name || null,
              vendor_type: body.vendor_type || null,
              issue_types: body.issue_types || null,
              severity: body.severity || null,
              description: body.description.trim(),
              image_url: body.image_url || null,
              latitude: body.latitude || null,
              longitude: body.longitude || null,
            },
          ]);

        if (insertError) {
          console.error("Supabase insert error:", insertError);
          return Response.json(
            { error: insertError.message },
            { status: 500, headers: corsHeaders }
          );
        }

        // Refresh KV cache with latest 10 after new submission
        const { data: latest, error: fetchError } = await supabase
          .from("complaints")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!fetchError && latest) {
          await env.FEEDBACK_KV.put(
            "latest_complaints",
            JSON.stringify(latest),
            { expirationTtl: 60 } // auto-expire after 60 seconds
          );
        }

        return Response.json({ success: true }, { headers: corsHeaders });

      } catch (err) {
        console.error("Submit error:", err);
        return Response.json(
          { error: "Internal server error" },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // =========================
    // GET /api/messages
    // =========================

    if (request.method === "GET" && url.pathname === "/api/messages") {
      try {
        // 1. Try KV cache first
        const cached = await env.FEEDBACK_KV.get("latest_complaints");

        if (cached) {
          return new Response(cached, {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "X-Cache": "HIT",
            },
          });
        }

        // 2. KV miss → fetch fresh from Supabase
        const { data, error } = await supabase
          .from("complaints")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Supabase fetch error:", error);
          return Response.json(
            { error: error.message },
            { status: 500, headers: corsHeaders }
          );
        }

        // 3. Store in KV for next requests
        await env.FEEDBACK_KV.put(
          "latest_complaints",
          JSON.stringify(data),
          { expirationTtl: 60 } // auto-expire after 60 seconds
        );

        return Response.json(data, {
          headers: {
            ...corsHeaders,
            "X-Cache": "MISS",
          },
        });

      } catch (err) {
        console.error("Messages fetch error:", err);
        return Response.json(
          { error: "Internal server error" },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // =========================
    // POST /api/update-status
    // =========================

    if (request.method === "POST" && url.pathname === "/api/update-status") {
      try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
          return Response.json(
            { error: "Missing id or status field" },
            { status: 400, headers: corsHeaders }
          );
        }

        const { error: updateError } = await supabase
          .from("complaints")
          .update({ status })
          .eq("id", id);

        if (updateError) {
          console.error("Update error:", updateError);
          return Response.json(
            { error: updateError.message },
            { status: 500, headers: corsHeaders }
          );
        }

        // Invalidate KV cache so next GET fetches fresh data
        await env.FEEDBACK_KV.delete("latest_complaints");

        return Response.json({ success: true }, { headers: corsHeaders });

      } catch (err) {
        console.error("Update-status error:", err);
        return Response.json(
          { error: "Internal server error" },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // 404
    return new Response("Not Found", {
      status: 404,
      headers: corsHeaders,
    });
  },
};