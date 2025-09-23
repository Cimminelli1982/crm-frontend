import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { contact_id, first_name, last_name, birthday } = await req.json();

    if (!birthday) {
      return new Response("No birthday provided", { status: 400 });
    }

    if (!first_name && !last_name) {
      return new Response("Missing contact name", { status: 400 });
    }

    // Extract month and day from birthday, ignore year
    // Handle date parsing more robustly
    const dob = new Date(birthday + 'T00:00:00Z'); // Force UTC to avoid timezone issues
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[dob.getUTCMonth()];
    const day = dob.getUTCDate();

    // Format as "every year on Sep 22"
    const due_string = `every year on ${month} ${day}`;

    // Create task content - handle cases where last_name might be null and sanitize special characters
    const sanitizeName = (name) => name ? name.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
    const cleanFirstName = sanitizeName(first_name);
    const cleanLastName = sanitizeName(last_name);
    const fullName = [cleanFirstName, cleanLastName].filter(Boolean).join(' ');
    const content = `🎂 Birthday: ${fullName}`;

    // Create task description with link to contact profile
    const description = `View contact: https://crm-editor-frontend.netlify.app/contacts/${contact_id}`;

    // Get environment variables
    const todoistToken = Deno.env.get("TODOIST_API_TOKEN");
    const projectId = Deno.env.get("TODOIST_BIRTHDAY_PROJECT_ID");

    if (!todoistToken) {
      return new Response("TODOIST_API_TOKEN not configured", { status: 500 });
    }

    if (!projectId) {
      return new Response("TODOIST_BIRTHDAY_PROJECT_ID not configured", { status: 500 });
    }

    // Create recurring task in Todoist
    const todoistResponse = await fetch("https://api.todoist.com/rest/v2/tasks", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${todoistToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        description,
        due_string,
        project_id: projectId,
      }),
    });

    if (!todoistResponse.ok) {
      const error = await todoistResponse.text();
      console.error("Todoist API error:", error);
      return new Response(`Todoist API error: ${error}`, { status: 500 });
    }

    const task = await todoistResponse.json();

    console.log(`✅ Created birthday task: ${content} (${due_string})`);

    return new Response(JSON.stringify({
      success: true,
      message: `Created birthday task for ${first_name} ${last_name}`,
      task_id: task.id,
      due_string
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});