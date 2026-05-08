const API_BASE_URL =
    "https://worker-api.yatin-a-anchan.workers.dev";

export async function submitFeedback(data) {
    const response = await fetch(
        `${API_BASE_URL}/api/submit`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        }
    );
    if (!response.ok) {
        throw new Error(
            "Failed to submit feedback"
        );
    }
    return response.json();
}

export async function getMessages() {
    const response = await fetch(
        `${API_BASE_URL}/api/messages`
    )
    if (!response.ok) {
        throw new Error(
            "Failed to fetch messages"
        );
    }
    return response.json();
}