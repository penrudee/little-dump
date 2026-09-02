// ai-comment.js

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const promptText = body.content;

    const apiKey = env.HF_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "HF_API_KEY is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const hfResponse = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemma-3-27b-it",  // ต้องระบุ provider ต่อท้ายด้วย :provider
        messages: [
          {
            role: "user",
            content: `บทความ: "${promptText}"\nจงเขียนความคิดเห็นสั้นๆ ภาษาไทย แสดงความรู้สึก พร้อมยกวลีเด็ดจากบทความมาอ้างอิง`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    const result = await hfResponse.json();

    if (!hfResponse.ok) {
      return new Response(JSON.stringify({ error: result }), {
        status: hfResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    // ดึงข้อความจาก response แบบใหม่
    const generatedText = result.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify([{ generated_text: generatedText }]), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
