// functions/api/ai-comment.js

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const promptText = body.content;

    // ดึง API Key จาก Cloudflare Environment Variable
    const apiKey = env.HF_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "HF_API_KEY is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // เรียกไปหา Hugging Face API จากฝั่ง Server
    const hfResponse = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
      headers: { 
        "Authorization": `Bearer ${apiKey}`, 
        "Content-Type": "application/json" 
      },
      method: "POST",
      body: JSON.stringify({
        inputs: `[INST] บทความ: "${promptText}" \nจงเขียนความคิดเห็นสั้นๆ ภาษาไทย แสดงความรู้สึก พร้อมยกวลีเด็ดจากบทความมาอ้างอิง [/INST]`,
        parameters: { max_new_tokens: 150, temperature: 0.7 }
      }),
    });

    const result = await hfResponse.json();

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
