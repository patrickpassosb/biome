from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import metrics, plan, memory, agent as agent_router, data
import uvicorn

app = FastAPI(
    title="Biome Training Intelligence API",
    version="1.0.0",
    description="API for Training Intelligence Dashboard (Biome)."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router)
app.include_router(plan.router)
app.include_router(memory.router)
app.include_router(agent_router.router)
app.include_router(data.router)

@app.get("/")
async def root():
    return {"status": "ok", "message": "Biome Backend is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)