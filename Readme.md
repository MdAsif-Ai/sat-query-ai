# 🛰️ SatQuery AI — Agentic Architecture

SatQuery AI is an agentic Vision-Language Assistant designed for intelligent analysis of remote-sensing imagery through natural-language queries.

Unlike a conventional system that sends every image to a single generic Vision-Language Model (VLM), SatQuery AI uses a **Master Agent** to understand the user's query, validate the input imagery, select the appropriate specialist model or tool, execute the required workflow, and combine the results into an evidence-grounded response.

The system supports:

- Single Optical/Multispectral image analysis
- Single SAR image analysis
- Visual Question Answering (VQA)
- Image captioning / scene description
- Text-guided region grounding
- Bi-temporal change detection
- Change-based Visual Question Answering
- Optical + SAR cross-modal analysis
- Evidence-based response generation
- Confidence estimation
- Auditable execution traces

---

# 🧠 Agentic Architecture

```text
                              ┌───────────────────────┐
                              │         USER          │
                              │                       │
                              │  Images + Query       │
                              └───────────┬───────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │   INPUT VALIDATOR     │
                              │                       │
                              │ • File format         │
                              │ • Image count         │
                              │ • Sensor modality     │
                              │ • Metadata            │
                              │ • Spatial compatibility│
                              └───────────┬───────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │     MASTER AGENT      │
                              │   Query Orchestrator  │
                              │                       │
                              │ • Query understanding │
                              │ • Task classification │
                              │ • Model selection     │
                              │ • Workflow planning   │
                              └───────────┬───────────┘
                                          │
                 ┌────────────────────────┼────────────────────────┐
                 │                        │                        │
                 ▼                        ▼                        ▼
        ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
        │  SINGLE IMAGE   │      │   BI-TEMPORAL   │      │   CROSS-MODAL   │
        │    ANALYSIS     │      │    ANALYSIS     │      │    ANALYSIS     │
        └────────┬────────┘      └────────┬────────┘      └────────┬────────┘
                 │                        │                        │
        ┌────────┼────────┐               │                ┌───────┴───────┐
        ▼        ▼        ▼               ▼                ▼               ▼
       VQA    Caption  Grounding   Change Detection   Optical Model    SAR Model
        │        │        │               │                │               │
        └────────┴────────┘               │                └───────┬───────┘
                 │                        │                        │
                 └────────────────────────┼────────────────────────┘
                                          ▼
                              ┌───────────────────────┐
                              │  EVIDENCE AGGREGATOR  │
                              │                       │
                              │ • Result fusion      │
                              │ • Evidence validation │
                              │ • Confidence scoring  │
                              │ • Spatial evidence    │
                              └───────────┬───────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │  RESPONSE GENERATOR   │
                              │                       │
                              │ • Natural language    │
                              │ • Visual evidence     │
                              │ • Confidence          │
                              │ • Execution trace     │
                              └───────────────────────┘