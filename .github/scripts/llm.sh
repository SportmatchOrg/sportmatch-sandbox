#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# llm.sh — Llamada a un LLM vía endpoint compatible con OpenAI (chat completions)
#
# Provider-agnostic: se configura con variables de entorno. Por defecto usa
# el free tier de Google Gemini (AI Studio), que expone un endpoint
# compatible con OpenAI. Para cambiar de proveedor NO hace falta tocar los
# workflows: basta con setear estas variables/secret en el repo.
#
#   LLM_API_KEY   (secret, obligatorio)  -> tu API key del proveedor
#   LLM_BASE_URL  (variable, opcional)   -> URL del endpoint chat/completions
#   LLM_MODEL     (variable, opcional)   -> nombre del modelo
#
# Ejemplos de configuración por proveedor:
#   Gemini (default):
#     LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
#     LLM_MODEL=gemini-2.5-flash
#   Groq:
#     LLM_BASE_URL=https://api.groq.com/openai/v1/chat/completions
#     LLM_MODEL=llama-3.3-70b-versatile
#   OpenRouter:
#     LLM_BASE_URL=https://openrouter.ai/api/v1/chat/completions
#     LLM_MODEL=qwen/qwen3-coder:free
#   OpenAI:
#     LLM_BASE_URL=https://api.openai.com/v1/chat/completions
#     LLM_MODEL=gpt-4o-mini
#
# Uso:  bash llm.sh <archivo_con_el_prompt>
# Imprime por stdout el texto de la respuesta.
# ---------------------------------------------------------------------------
set -euo pipefail

PROMPT_FILE="${1:?uso: llm.sh <archivo_prompt>}"
BASE_URL="${LLM_BASE_URL:-https://generativelanguage.googleapis.com/v1beta/openai/chat/completions}"
MODEL="${LLM_MODEL:-gemini-2.5-flash}"
: "${LLM_API_KEY:?falta el secret LLM_API_KEY}"

# Armar el payload de forma segura (el prompt puede tener comillas y saltos).
PAYLOAD="$(jq -n --arg model "$MODEL" --rawfile content "$PROMPT_FILE" \
  '{model:$model, messages:[{role:"user", content:$content}], temperature:0.3}')"

RESP="$(curl -sS --fail-with-body "$BASE_URL" \
  -H "Authorization: Bearer $LLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" || true)"

# Extraer el texto. Si la respuesta no tiene el formato esperado, imprimir el
# error crudo para poder debuggear desde los logs del workflow.
echo "$RESP" | jq -r '.choices[0].message.content // ("ERROR LLM: " + (.error.message // (.|tostring)))'
