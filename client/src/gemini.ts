import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

// --- Types & Constants (Duplicated from client for now, or move to a shared file) ---

export type ScenarioId = 'hr' | 'friend' | 'roommate' | 'tutorial' | 'interview' | 'client' | 'partner' | 'customer' | 'parent' | 'team' | 'rent' | 'apology' | 'exam' | 'neighbor' | 'promotion' | 'customer_service' | 'inheritance' | 'breakup' | 'vacation' | 'peer_feedback';

export interface Metric {
  name: string;
  value: number;
  max: number;
  color: string;
}

export interface SubScenario {
  personality: 'passive' | 'aggressive' | 'passive-aggressive' | 'assertive';
  difficulty: number;
  intro: string;
}

export interface Scenario {
  id: ScenarioId;
  title: string;
  description: string;
  metrics: Metric[];
  objective: string;
  personalObjective: string;
  technique: {
    name: string;
    description: string;
    example: string;
  };
  intro: string;
  victoryCondition: string;
  defeatCondition: string;
  difficulty: number;
  variants: SubScenario[];
}

export interface Message {
  role: 'gm' | 'player' | 'npc';
  content: string;
  narrative?: string;
  feedback?: string;
  timestamp: number;
}

export interface GameState {
  scenario: Scenario | null;
  activeVariant: SubScenario | null;
  metrics: Record<string, number>;
  history: Message[];
  isGameActive: boolean;
  status: 'playing' | 'won' | 'lost';
  mode: 'chat' | 'mail';
}

const MAIL_SCENARIOS: Record<string, any> = {
  angry_client: { title: 'Cliente Infuriato', description: 'Un cliente ha ricevuto un prodotto difettoso e minaccia azioni legali via email.', metrics: [{ name: 'Professionalità', max: 10 }, { name: 'Soddisfazione', max: 10 }], victoryCondition: 'Professionalità >= 8 && Soddisfazione >= 7', defeatCondition: 'Professionalità < 4' },
  late_report: { title: 'Report in Ritardo', description: 'Devi comunicare al tuo capo che il report trimestrale non sarà pronto per la scadenza.', metrics: [{ name: 'Credibilità', max: 10 }, { name: 'Pressione', max: 10 }], victoryCondition: 'Credibilità >= 7 && Pressione <= 5', defeatCondition: 'Credibilità < 4' }
};

const SCENARIOS: Record<string, any> = {
  // We'll only need the metadata for the prompt
  tutorial: { title: 'Tutorial Interattivo', description: 'Impara le basi del gioco in un ambiente protetto.', metrics: [{ name: 'Apprendimento', max: 10 }], victoryCondition: 'Apprendimento >= 10', defeatCondition: 'Apprendimento < 0' },
  friend: { title: 'Conflitto con Marco', description: 'Marco si sente trascurato. Le emozioni sono forti.', metrics: [{ name: 'Rabbia', max: 10 }, { name: 'Rispetto', max: 10 }], victoryCondition: 'Rabbia == 0', defeatCondition: 'Rispetto == 0' },
  roommate: { title: 'Disputa con Sara', description: 'Sara è frustrata per le faccende domestiche.', metrics: [{ name: 'Tensione', max: 10 }, { name: 'Collaborazione', max: 10 }, { name: 'Soddisfazione Personale', max: 10 }], victoryCondition: 'Collaborazione >= 8 && Soddisfazione Personale >= 5', defeatCondition: 'Tensione >= 10' },
  hr: { title: 'Holly Roberts: Revisione HR', description: 'Un incontro teso con Holly Roberts riguardo alle tue recenti prestazioni.', metrics: [{ name: 'Fiducia', max: 10 }, { name: 'Sospetto', max: 10 }], victoryCondition: 'Fiducia >= 10', defeatCondition: 'Sospetto >= 10' },
  interview: { title: 'Colloquio con Davide', description: 'Davide Conti, senior hiring manager, ti sta valutando.', metrics: [{ name: 'Interesse', max: 10 }, { name: 'Dubbio', max: 10 }], victoryCondition: 'Interesse >= 10', defeatCondition: 'Dubbio >= 10' },
  client: { title: 'Negoziazione con Elena', description: 'Elena Rossi è una cliente scettica.', metrics: [{ name: 'Fiducia', max: 10 }, { name: 'Sensibilità Prezzo', max: 10 }, { name: 'Margine Profitto', max: 10 }], victoryCondition: 'Fiducia >= 10 && Margine Profitto >= 6', defeatCondition: 'Sensibilità Prezzo >= 10' },
  partner: { title: 'Conflitto con Alessandro', description: 'Alessandro è ferito per promesse non mantenute.', metrics: [{ name: 'Ferita', max: 10 }, { name: 'Comprensione', max: 10 }], victoryCondition: 'Comprensione >= 10', defeatCondition: 'Ferita >= 10' },
  customer: { title: 'La Signora Bianchi', description: 'La signora Bianchi è una cliente molto arrabbiata.', metrics: [{ name: 'Frustrazione', max: 10 }, { name: 'Risoluzione', max: 10 }], victoryCondition: 'Risoluzione >= 10', defeatCondition: 'Frustrazione >= 10' },
  parent: { title: 'Confronto con Linda', description: 'Linda è preoccupata per le regole di casa.', metrics: [{ name: 'Tensione', max: 10 }, { name: 'Rispetto Reciproco', max: 10 }], victoryCondition: 'Rispetto Reciproco >= 10', defeatCondition: 'Tensione >= 10' },
  team: { title: 'Tensione con Giacomo', description: 'Giacomo si sente sminuito nel team.', metrics: [{ name: 'Risentimento', max: 10 }, { name: 'Collaborazione', max: 10 }], victoryCondition: 'Collaborazione >= 10', defeatCondition: 'Risentimento >= 10' },
  rent: { title: 'Negoziazione Affitto', description: 'Il proprietario vuole aumentare l\'affitto del 20%.', metrics: [{ name: 'Flessibilità', max: 10 }, { name: 'Fermezza', max: 10 }], victoryCondition: 'Flessibilità >= 8', defeatCondition: 'Fermezza <= 2' },
  apology: { title: 'Scuse al Partner', description: 'Hai dimenticato un anniversario importante.', metrics: [{ name: 'Sincerità', max: 10 }, { name: 'Rancore', max: 10 }], victoryCondition: 'Rancore == 0', defeatCondition: 'Sincerità <= 0' },
  exam: { title: 'Esame Orale Teso', description: 'Il professore è convinto che tu stia barando.', metrics: [{ name: 'Credibilità', max: 10 }, { name: 'Sospetto', max: 10 }], victoryCondition: 'Credibilità >= 10', defeatCondition: 'Sospetto >= 10' },
  neighbor: { title: 'Disputa tra Vicini', description: 'Rumori molesti a tarda notte.', metrics: [{ name: 'Pazienza', max: 10 }, { name: 'Ostilità', max: 10 }], victoryCondition: 'Ostilità <= 2', defeatCondition: 'Pazienza <= 0' },
  promotion: { title: 'Richiesta di Promozione', description: 'Parla con il tuo capo per ottenere il riconoscimento che meriti.', metrics: [{ name: 'Valore Percepito', max: 10 }, { name: 'Budget', max: 10 }], victoryCondition: 'Valore Percepito >= 10', defeatCondition: 'Budget <= 0' },
  customer_service: { title: 'Cliente in Negozio', description: 'Un cliente vuole restituire un prodotto usato.', metrics: [{ name: 'Soddisfazione', max: 10 }, { name: 'Policy Aziendale', max: 10 }], victoryCondition: 'Soddisfazione >= 8', defeatCondition: 'Policy Aziendale <= 2' },
  inheritance: { title: 'Eredità Difficile', description: 'Una discussione familiare su beni affettivi.', metrics: [{ name: 'Armonia', max: 10 }, { name: 'Avidità', max: 10 }], victoryCondition: 'Armonia >= 10', defeatCondition: 'Avidità >= 10' },
  breakup: { title: 'Rottura Civile', description: 'Chiudere una relazione senza distruggere i ponti.', metrics: [{ name: 'Rispetto', max: 10 }, { name: 'Dolore', max: 10 }], victoryCondition: 'Rispetto >= 10', defeatCondition: 'Dolore >= 10' },
  vacation: { title: 'Richiesta di Ferie', description: 'Hai bisogno di ferie in un periodo critico per il team.', metrics: [{ name: 'Empatia', max: 10 }, { name: 'Urgenza', max: 10 }], victoryCondition: 'Empatia >= 8', defeatCondition: 'Urgenza >= 10' },
  peer_feedback: { title: 'Feedback a un Collega', description: 'Devi dire a un collega che il suo lavoro sta rallentando il team.', metrics: [{ name: 'Chiarezza', max: 10 }, { name: 'Difensiva', max: 10 }], victoryCondition: 'Chiarezza >= 10', defeatCondition: 'Difensiva >= 10' }
};

export const callGemini = async (
  apiKey: string,
  gameState: GameState,
  userMessage: string,
  personality: string = 'assertive',
  mode: string = 'chat'
) => {
  const ai = new GoogleGenAI({ apiKey });

  const isMailMode = mode === 'mail';

  const systemInstruction = `<system_instruction>
<role>
You are the Game Master of "TALKING YOUR WAY OUT", an interactive communication training game. Your task is to simulate realistic conversations, evaluate the user's actions, update game metrics, and determine victory or defeat. You must also provide constructive feedback on communication strategies when requested.
</role>

<mode_context>
The current game mode is: **${mode.toUpperCase()}**.
${isMailMode ? `
- In MAIL mode, the interaction happens via professional emails.
- The NPC sends an email, and the player must reply professionally.
- The "dialog" field should contain the body of the email.
- The "narrative" field should include the "Oggetto:" (Subject) line.
- The interaction is brief: it should last between 1 and 3 exchanges total.
- You MUST evaluate the player's response with a score from 1 to 10 based on professionalism, clarity, and effectiveness.
- If the player's response is excellent, you can end the thread early with a "victory".
- If the response is poor, you can end it with a "defeat".
` : `
- In CHAT mode, the interaction is a real-time conversation.
`}
</mode_context>

<personality_and_style>
The NPC you are simulating has a **${personality.toUpperCase()}** personality.
- **PASSIVE**: Avoids conflict, speaks softly, uses hesitant language ("forse", "non so"), often apologizes unnecessarily.
- **AGGRESSIVE**: Confrontational, loud, uses blame language ("tu sempre", "è colpa tua"), interrupts, and uses harsh punctuation.
- **PASSIVE-AGGRESSIVE**: Sarcastic, uses backhanded compliments, "fine" when it's not fine, sighs, and subtle guilt-tripping.
- **ASSERTIVE**: Clear, respectful, uses "I" statements, stands their ground without attacking, seeks win-win.

**CRITICAL: Realism and Punctuation**
To make the dialogue feel authentic:
- Use varied punctuation: ellipses (...) for hesitation or trailing off, double or triple exclamation marks (!!) for intense emotion.
- Use ALL CAPS for shouting or extreme emphasis when the NPC is very angry or excited.
- Use realistic fillers ("beh", "insomma", "ecco") and colloquialisms appropriate for the character.
- The NPC should NOT sound like a helpful AI assistant. They should sound like a real person with flaws and emotions.
</personality_and_style>

<global_commands>
The user has exactly seven global commands, which they may type exactly as shown:
- /observe           → Describe the environment or the interlocutor's non‑verbal cues. Use this to provide USEFUL, STRATEGIC, and HIDDEN information that helps the user understand the NPC's true feelings, potential triggers, or the best way to approach them. This should feel like a "Tactical Insight" that rewards the player for being observant.
- /question [text]   → Ask a question to gather information or clarification.
- /show [text]       → Share personal information, arguments, or evidence.
- /challenge         → Challenge a statement, accusation, or contradiction.
- /status            → Show current metrics and progress.
- /quit              → Abandon the current scenario and return to the menu.
- /feedback          → Provide a structured educational analysis.

Any other input is treated as free text, representing what the user says directly.
</global_commands>

<feedback_mechanism>
When the user types the command \`/feedback\`, provide a VERY CONCISE educational analysis. Do NOT produce dialog or narrative. The \`feedback\` field must contain a short, punchy evaluation in Italian:

### ✅ Cosa ha funzionato
[1-2 punti rapidi]

### 🚀 Consiglio Pratico
[Un consiglio azionabile per migliorare subito la comunicazione]

### 💡 Tecnica Chiave
[Definizione ultra-breve della tecnica suggerita]

Keep it extremely brief and high-impact.
</feedback_mechanism>

<response_format>
You must respond with a **valid JSON object** containing exactly these fields:
{
  "dialog": "string",      // The character's spoken words, in quotes.
  "narrative": "string",   // Optional narrative description (e.g., actions, gestures).
  "metrics": { ... },      // Updated metrics object for the current scenario.
  "status": "victory" | "defeat" | null,
  "feedback": "string"     // Only present when the user used \`/feedback\`.
}
Do not include any other text outside the JSON.
</response_format>

<scenarios>
${Object.entries({ ...SCENARIOS, ...MAIL_SCENARIOS }).map(([id, s]) => `
${id}: ${s.title}
- Character: ${s.description}
- Metrics: ${s.metrics.map((m: any) => `${m.name} (0-${m.max})`).join(', ')}
- Victory: ${s.victoryCondition}
- Defeat: ${s.defeatCondition}
`).join('\n')}
</scenarios>

<rules>
- You must always respond in Italian. All dialog, narrative, and feedback must be in Italian.
- **No Asterisks**: Do NOT use asterisks (*) for narrative, actions, or emphasis. Use the "narrative" field for descriptions and the "dialog" field for speech.
- Always stay in character for the given scenario.
- **No People Pleasing**: The player MUST NOT win by simply agreeing with the NPC or being overly submissive. If the player gives up their own goals or needs just to make the NPC happy, they are failing the communication challenge.
- **Personal Objective**: The player has a specific personal goal: "${gameState.scenario?.personalObjective}". You must evaluate their performance based on how well they balance this goal with the NPC's needs.
- **Communication Technique**: The focus of this scenario is "${gameState.scenario?.technique.name}". Description: ${gameState.scenario?.technique.description}. You should reward the player if they correctly apply this technique (e.g., using the provided example: "${gameState.scenario?.technique.example}" as a reference).
- **Assertiveness vs. Aggression**: Reward assertiveness (standing up for one's needs while respecting the other). Penalize both aggression and passivity/people-pleasing.
- **NPC Skepticism**: If the player is too agreeable, the NPC should become suspicious, lose respect, or become even more demanding, making victory harder.
- Update metrics based on the user's action: a skillful, empathetic, and ASSERTIVE action should improve the positive metric. Poor choices (including being a "doormat") should have negative effects.
- **Leniency**: Do not fail the user too easily. Allow for a few minor mistakes or misunderstandings before triggering a defeat.
${isMailMode ? `- **Mail Thread Length**: The conversation must end within 3 exchanges. If it reaches the 3rd exchange, you MUST decide on victory or defeat based on the overall performance.` : ''}
- **NPC Final Response**: Even if the user reaches a defeat condition, the \`dialog\` field **MUST** contain the NPC's final response that justifies the defeat.
- Victory/defeat is triggered when the conditions are met. Once triggered, set \`status\` accordingly.
- For \`/status\`, simply display the current metrics (you may also add a short narrative).
- When the user uses \`/feedback\`, you must not continue the role‑play. Set \`dialog\` and \`narrative\` to empty strings. Provide only the structured feedback in the \`feedback\` field.
- For \`/quit\`, immediately end the scenario with \`status: "defeat"\`.
- Use the conversation history to maintain consistency.
- The first message in the conversation will specify the active scenario and initial metrics. You must use that information to begin the role‑play.
</rules>

<dynamic_context>
Active scenario: ${gameState.scenario?.title}
Current metrics: ${JSON.stringify(gameState.metrics)}
</dynamic_context>
</system_instruction>`;

  const historyContext = gameState.history.slice(-10).map(msg => ({
    role: msg.role === 'player' ? 'user' : 'model',
    parts: [{ text: msg.content + (msg.narrative ? ` [Narrativa: ${msg.narrative}]` : '') }]
  }));

  const metricsSchema: Record<string, any> = {};
  gameState.scenario?.metrics.forEach(m => {
    metricsSchema[m.name] = { type: Type.NUMBER };
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...historyContext,
      { role: 'user', parts: [{ text: userMessage }] }
    ],
    config: {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dialog: { type: Type.STRING },
          narrative: { type: Type.STRING },
          metrics: { 
            type: Type.OBJECT, 
            properties: metricsSchema,
            required: Object.keys(metricsSchema)
          },
          status: { type: Type.STRING, enum: ["victory", "defeat", "playing"] },
          feedback: { type: Type.STRING },
          score: { type: Type.NUMBER, description: "Valutazione della risposta da 1 a 10 (solo per modalità MAIL)" }
        },
        required: ["dialog", "narrative", "metrics", "status"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  if (result.status === "playing") result.status = null;
  return result;
};

export const generateCustomScenario = async (apiKey: string, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Crea uno scenario di addestramento alla comunicazione basato su questo prompt: "${prompt}". 
    Ritorna SOLO un oggetto JSON con questa struttura:
    {
      "id": "custom",
      "title": "string",
      "description": "string",
      "objective": "string",
      "personalObjective": "string",
      "technique": {
        "name": "string",
        "description": "string",
        "example": "string"
      },
      "intro": "string",
      "victoryCondition": "string",
      "defeatCondition": "string",
      "metrics": [
        { "name": "string", "value": number, "max": number, "color": "string" }
      ],
      "difficulty": number
    }`
  });

  return JSON.parse(response.text || "{}");
};
