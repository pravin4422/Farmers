from gemini_service import get_agriculture_advice
class ChatRequest(BaseModel):
    prompt: str
@app.post("/chat")
async def chat(data: ChatRequest):
    response = get_agriculture_advice(data.prompt)
    return {"response": response}