// Läuft als Web Worker: führt die komplette WebLLM-Inferenz aus, damit die
// Seite während Modell-Laden und Bewertung bedienbar bleibt. Ohne Worker
// blockiert die Token-Generierung den UI-Thread — die App wirkt "eingefroren".
import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm'

const handler = new WebWorkerMLCEngineHandler()
self.onmessage = (msg: MessageEvent) => handler.onmessage(msg)
