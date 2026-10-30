import os
import uvicorn
import gradio as gr
from app.main import app as fastapi_app

# Gradio status dashboard UI for Hugging Face Spaces
with gr.Blocks(title="WEIR Backend Station") as demo:
    gr.Markdown("# 🌊 WEIR — Autonomous Solana Token Counting Station")
    gr.Markdown(
        "Backend API & Ingestion Worker is running 24/7 on Hugging Face Spaces.\n\n"
        "- **FastAPI Docs:** [/docs](/docs)\n"
        "- **State API:** [/api/state](/api/state)\n"
        "- **Gate Level:** [/api/gate](/api/gate)\n"
        "- **Health Check:** [/health](/health)"
    )

# Mount Gradio onto the existing FastAPI application
# This allows all original FastAPI routes (/api/*, /docs, /health, /stream) to work seamlessly!
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    print(f"[HF SPACES] Starting WEIR server on 0.0.0.0:{port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
