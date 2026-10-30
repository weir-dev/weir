FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Hugging Face Spaces standard: Port 7860 & User UID 1000
ENV PORT=7860
EXPOSE 7860

RUN useradd -m -u 1000 user && \
    chown -R user:user /app
USER user

CMD ["python", "-m", "app.main"]
