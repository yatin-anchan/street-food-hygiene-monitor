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

        // Always delete stale KV cache after new submission
        await env.FEEDBACK_KV.delete("latest_complaints");

        // Fetch fresh data and store in KV
        const { data: latest, error: fetchError } = await supabase
          .from("complaints")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (!fetchError && latest) {
          await env.FEEDBACK_KV.put(
            "latest_complaints",
            JSON.stringify(latest),
            { expirationTtl: 60 }
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

        // STEP 1: Always delete old stale KV first
        await env.FEEDBACK_KV.delete("latest_complaints");

        // STEP 2: Always fetch fresh from Supabase
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

        // STEP 3: Store fresh data in KV
        await env.FEEDBACK_KV.put(
          "latest_complaints",
          JSON.stringify(data),
          { expirationTtl: 60 }
        );

        console.log("Fetched from Supabase, count:", data.length);

        return Response.json(data, {
          headers: {
            ...corsHeaders,
            "X-Cache": "MISS",
            "X-Count": String(data.length),
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