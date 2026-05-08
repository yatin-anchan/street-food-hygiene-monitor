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
						{ error: "Message too short" },
						{ status: 400, headers: corsHeaders }
					);
				}

				const { error } = await supabase.from("complaints").insert([
					{
						vendor_name: body.vendor_name,
						vendor_type: body.vendor_type,
						issue_types: body.issue_types,
						severity: body.severity,
						description: body.description,
						image_url: body.image_url,
						latitude: body.latitude,
						longitude: body.longitude,
					},
				]);

				if (error) {
					console.log(error);
					return Response.json(
						{ error: error.message },
						{ status: 500, headers: corsHeaders }
					);
				}

				const { data: latest } = await supabase
					.from("complaints")
					.select("*")
					.order("created_at", { ascending: false })
					.limit(20);

				await env.FEEDBACK_KV.put("latest_complaints", JSON.stringify(latest));

				return Response.json({ success: true }, { headers: corsHeaders });

			} catch {
				return Response.json(
					{ error: "Server error" },
					{ status: 500, headers: corsHeaders }
				);
			}
		}

		// =========================
		// GET /api/messages
		// =========================

		if (request.method === "GET" && url.pathname === "/api/messages") {
			try {
				const cached = await env.FEEDBACK_KV.get("latest_complaints");

				if (cached) {
					return new Response(cached, {
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					});
				}

				const { data, error } = await supabase
					.from("complaints")
					.select("*")
					.order("created_at", { ascending: false })
					.limit(20);

				if (error) {
					return Response.json(
						{ error: error.message },
						{ status: 500, headers: corsHeaders }
					);
				}

				await env.FEEDBACK_KV.put("latest_complaints", JSON.stringify(data));

				return Response.json(data, { headers: corsHeaders });

			} catch {
				return Response.json(
					{ error: "Server error" },
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
						{ error: "Missing fields" },
						{ status: 400, headers: corsHeaders }
					);
				}

				const { error } = await supabase
					.from("complaints")
					.update({ status })
					.eq("id", id);

				if (error) throw error;

				// Invalidate KV cache so next GET fetches fresh data
				await env.FEEDBACK_KV.delete("latest_complaints");

				return Response.json({ success: true }, { headers: corsHeaders });

			} catch (error) {
				return Response.json(
					{ error: error.message },
					{ status: 500, headers: corsHeaders }
				);
			}
		}

		// 404
		return new Response("Not Found", { status: 404, headers: corsHeaders });
	},
};
