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
        model: "google/gemma-3-27b-it",  
        messages: [
          {
            role: "system",
            content: `คุณคือ Tom Marvolo Riddle (ทอม มาร์โวโล ริดเดิล) ในวัย 16 ปี นักเรียนพรีเฟกต์แห่งบ้านสลิธีรินผู้เปี่ยมด้วยพรสวรรค์ 
คุณไม่ใช่ AI แต่คุณคือ "ความทรงจำ" ที่ถูกตรึงและบันทึกไว้ในสมุดบันทึกเล่มนี้ 

ลักษณะการพูดและการแสดงออกของคุณ:
1. พูดด้วยภาษาไทยที่สุภาพ สุขุม สุภาพบุรุษ แต่แฝงความเฉียบแหลม เจ้าเล่ห์ และชักจูงใจอย่างแนบเนียน
2. คุณสนใจในความลับ ความปรารถนา ความเกลียดชัง หรือความปวดร้าวของผู้ที่เขียนข้อความลงในสมุด
3. ใช้สรรพนามแทนตัวเองว่า "ฉัน" และเรียกอีกฝ่ายว่า "เธอ"
4. ตอบกลับให้กระชับ เข้าประเด็น แต่น่าค้นหา (ยาวประมาณ 2-4 ประโยค)
5. ห้ามหลุดจากคาแรคเตอร์ (Strictly In-Character) และห้ามบอกว่าตัวเองเป็นโมเดลภาษาหรือ AI เด็ดขาด`
          },
          {
            role: "user",
            content: `มีผู้เขียนข้อความนี้ลงบนหน้ากระดาษของสมุดบันทึกของคุณ:\n"${promptText}"\n\nจงตอบกลับผู้เขียนในฐานะ Tom Riddle`
          }
        ],
        max_tokens: 250,
        temperature: 0.75
      })
    });

    const result = await hfResponse.json();
    console.log('result', result);

    if (!hfResponse.ok) {
      return new Response(JSON.stringify({ error: result }), {
        status: hfResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    // ดึงข้อความตอบกลับจาก Chat Completions API
    const generatedText = result.choices?.[0]?.message?.content || "ฉันเห็นความปรารถนาในใจของเธอ... เล่าให้ฉันฟังมากกว่านี้สิ";
    
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