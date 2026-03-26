import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  Shield, 
  Briefcase, 
  Scale, 
  Heart, 
  Home, 
  AlertCircle, 
  Rocket, 
  ChevronRight, 
  Send, 
  BarChart3, 
  Activity, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Sparkles, 
  MessageCircle, 
  UserPlus, 
  Phone, 
  Ghost, 
  Zap,
  Coffee,
  Baby,
  GraduationCap,
  DoorOpen,
  TrendingUp,
  Headphones,
  HeartOff,
  Palmtree,
  UserCheck,
  DollarSign,
  ShoppingBag,
  Smile,
  Key,
  Star,
  BookOpen,
  Terminal,
  Eye,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type, ThinkingLevel, HarmCategory, HarmBlockThreshold } from "@google/genai";
import Markdown from 'react-markdown';

// --- Types & Constants ---

type ScenarioId = 'hr' | 'friend' | 'roommate' | 'tutorial' | 'interview' | 'client' | 'partner' | 'customer' | 'parent' | 'team' | 'feedback_scenario' | 'rent' | 'apology' | 'exam' | 'neighbor' | 'promotion' | 'customer_service' | 'inheritance' | 'breakup' | 'vacation' | 'peer_feedback' | 'custom';

interface Metric {
  name: string;
  value: number;
  max: number;
  color: string;
}

interface Scenario {
  id: ScenarioId;
  title: string;
  description: string;
  icon: React.ReactNode;
  metrics: Metric[];
  objective: string;
  intro: string;
  victoryCondition: string;
  defeatCondition: string;
  difficulty: number; // 1 (Easiest) to 5 (Hardest)
}

interface Message {
  role: 'gm' | 'player' | 'npc';
  content: string;
  narrative?: string;
  feedback?: string;
  timestamp: number;
}

interface GameState {
  scenario: Scenario | null;
  metrics: Record<string, number>;
  history: Message[];
  isGameActive: boolean;
  status: 'playing' | 'won' | 'lost';
}

const SCENARIOS: Record<ScenarioId, Scenario> = {
  tutorial: {
    id: 'tutorial',
    title: 'Tutorial Interattivo',
    description: 'Impara le basi del gioco in un ambiente protetto.',
    icon: <Rocket className="w-8 h-8" />,
    metrics: [
      { name: 'Apprendimento', value: 0, max: 10, color: 'bg-orange-500' }
    ],
    objective: 'Completa i passaggi del tutorial raggiungendo Apprendimento 10.',
    intro: 'Benvenuto nel tutorial! Io sono il tuo assistente. Per iniziare, prova a scrivere il comando "/observe" per analizzare l\'ambiente e ricevere i tuoi primi punti Apprendimento.',
    victoryCondition: 'Apprendimento >= 10',
    defeatCondition: 'Apprendimento < 0',
    difficulty: 1
  },
  friend: {
    id: 'friend',
    title: 'Conflitto con Marco',
    description: 'Marco si sente trascurato. Le emozioni sono forti.',
    icon: <Users className="w-8 h-8" />,
    metrics: [
      { name: 'Rabbia', value: 6, max: 10, color: 'bg-orange-500' },
      { name: 'Rispetto', value: 5, max: 10, color: 'bg-sky-500' }
    ],
    objective: 'Riduci la Rabbia a 0.',
    intro: 'Marco cammina nervosamente in soggiorno. "Proprio non capisco. Contavo su di te. Ti importa almeno dei nostri piani?"',
    victoryCondition: 'Rabbia == 0',
    defeatCondition: 'Rispetto == 0',
    difficulty: 2
  },
  roommate: {
    id: 'roommate',
    title: 'Disputa con Sara',
    description: 'Sara è frustrata per le faccende domestiche.',
    icon: <Coffee className="w-8 h-8" />,
    metrics: [
      { name: 'Tensione', value: 4, max: 10, color: 'bg-amber-500' },
      { name: 'Collaborazione', value: 2, max: 10, color: 'bg-indigo-500' }
    ],
    objective: 'Raggiungi Collaborazione 8 o superiore.',
    intro: 'Il lavandino è pieno di piatti sporchi. Sara è seduta sul divano, ignorando il disordine. "Oh, sei a casa. A proposito, la cucina è un disastro e l\'affitto deve essere pagato."',
    victoryCondition: 'Collaborazione >= 8',
    defeatCondition: 'Tensione >= 10',
    difficulty: 2
  },
  hr: {
    id: 'hr',
    title: 'Holly Roberts: Revisione HR',
    description: 'Un incontro teso con Holly Roberts riguardo alle tue recenti prestazioni.',
    icon: <UserCheck className="w-8 h-8" />,
    metrics: [
      { name: 'Fiducia', value: 3, max: 10, color: 'bg-emerald-500' },
      { name: 'Sospetto', value: 3, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Fiducia 10 prima che il Sospetto raggiunga 10.',
    intro: 'Sei seduto in un ufficio sterile. Holly Roberts delle Risorse Umane si sistema gli occhiali. "Grazie per essere venuto. Abbiamo alcune preoccupazioni riguardo alla tabella di marcia del progetto..."',
    victoryCondition: 'Fiducia >= 10',
    defeatCondition: 'Sospetto >= 10',
    difficulty: 3
  },
  interview: {
    id: 'interview',
    title: 'Colloquio con Davide',
    description: 'Davide Conti, senior hiring manager, ti sta valutando.',
    icon: <Briefcase className="w-8 h-8" />,
    metrics: [
      { name: 'Interesse', value: 3, max: 10, color: 'bg-emerald-500' },
      { name: 'Dubbio', value: 3, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Interesse 10 prima che il Dubbio raggiunga 10.',
    intro: 'Davide Conti ti osserva con attenzione. "Parlami di una volta in cui hai dovuto gestire un conflitto in un team. Come hai reagito?"',
    victoryCondition: 'Interesse >= 10',
    defeatCondition: 'Dubbio >= 10',
    difficulty: 3
  },
  client: {
    id: 'client',
    title: 'Negoziazione con Elena',
    description: 'Elena Rossi è una cliente scettica.',
    icon: <DollarSign className="w-8 h-8" />,
    metrics: [
      { name: 'Fiducia', value: 3, max: 10, color: 'bg-emerald-500' },
      { name: 'Sensibilità Prezzo', value: 4, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Fiducia 10.',
    intro: 'Elena Rossi incrocia le braccia. "Il vostro preventivo è decisamente superiore alla concorrenza. Perché dovrei scegliere voi?"',
    victoryCondition: 'Fiducia >= 10',
    defeatCondition: 'Sensibilità Prezzo >= 10',
    difficulty: 4
  },
  partner: {
    id: 'partner',
    title: 'Conflitto con Alessandro',
    description: 'Alessandro è ferito per promesse non mantenute.',
    icon: <Heart className="w-8 h-8" />,
    metrics: [
      { name: 'Ferita', value: 6, max: 10, color: 'bg-rose-500' },
      { name: 'Comprensione', value: 2, max: 10, color: 'bg-emerald-500' }
    ],
    objective: 'Raggiungi Comprensione 10.',
    intro: 'Alessandro ti guarda con gli occhi lucidi. "Avevi promesso che saresti tornato presto stasera. È la terza volta questa settimana che mi lasci solo a cena."',
    victoryCondition: 'Comprensione >= 10',
    defeatCondition: 'Ferita >= 10',
    difficulty: 4
  },
  customer: {
    id: 'customer',
    title: 'La Signora Bianchi',
    description: 'La signora Bianchi è una cliente molto arrabbiata.',
    icon: <ShoppingBag className="w-8 h-8" />,
    metrics: [
      { name: 'Frustrazione', value: 7, max: 10, color: 'bg-orange-500' },
      { name: 'Risoluzione', value: 1, max: 10, color: 'bg-emerald-500' }
    ],
    objective: 'Raggiungi Risoluzione 10.',
    intro: 'La signora Bianchi urla al telefono. "È inaccettabile! Il prodotto è arrivato rotto e nessuno mi risponde da tre giorni!"',
    victoryCondition: 'Risoluzione >= 10',
    defeatCondition: 'Frustrazione >= 10',
    difficulty: 4
  },
  parent: {
    id: 'parent',
    title: 'Confronto con Linda',
    description: 'Linda è preoccupata per le regole di casa.',
    icon: <Baby className="w-8 h-8" />,
    metrics: [
      { name: 'Tensione', value: 6, max: 10, color: 'bg-amber-500' },
      { name: 'Rispetto Reciproco', value: 3, max: 10, color: 'bg-indigo-500' }
    ],
    objective: 'Raggiungi Rispetto Reciproco 10.',
    intro: 'Linda ti aspetta in cucina. "Sono le due di notte. Avevamo concordato che saresti tornato a mezzanotte. Perché non hai risposto al telefono?"',
    victoryCondition: 'Rispetto Reciproco >= 10',
    defeatCondition: 'Tensione >= 10',
    difficulty: 5
  },
  team: {
    id: 'team',
    title: 'Tensione con Giacomo',
    description: 'Giacomo si sente sminuito nel team.',
    icon: <UserPlus className="w-8 h-8" />,
    metrics: [
      { name: 'Risentimento', value: 6, max: 10, color: 'bg-rose-500' },
      { name: 'Collaborazione', value: 3, max: 10, color: 'bg-emerald-500' }
    ],
    objective: 'Raggiungi Collaborazione 10.',
    intro: 'Giacomo ti interrompe durante la riunione. "Ancora una volta, hai presentato la mia idea come se fosse tua. Non è la prima volta che succede."',
    victoryCondition: 'Collaborazione >= 10',
    defeatCondition: 'Risentimento >= 10',
    difficulty: 5
  },
  feedback_scenario: {
    id: 'feedback_scenario',
    title: 'Feedback con il Dr. Patelli',
    description: 'Il Dr. Patelli è un supervisore esigente.',
    icon: <Shield className="w-8 h-8" />,
    metrics: [
      { name: 'Apertura', value: 3, max: 10, color: 'bg-emerald-500' },
      { name: 'Difensiva', value: 4, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Apertura 10.',
    intro: 'Il Dr. Patelli ti chiama nel suo ufficio. "Ho notato alcuni errori ricorrenti nei tuoi ultimi report. Dobbiamo parlarne."',
    victoryCondition: 'Apertura >= 10',
    defeatCondition: 'Difensiva >= 10',
    difficulty: 5
  },
  rent: {
    id: 'rent',
    title: 'Negoziazione Affitto',
    description: 'Il proprietario vuole aumentare l\'affitto del 20%.',
    icon: <Key className="w-8 h-8" />,
    metrics: [
      { name: 'Flessibilità', value: 2, max: 10, color: 'bg-sky-500' },
      { name: 'Fermezza', value: 5, max: 10, color: 'bg-orange-500' }
    ],
    objective: 'Raggiungi Flessibilità 8 mantenendo Fermezza sopra 3.',
    intro: 'Il Signor Gatti ti aspetta sulla porta. "Senti, i costi sono saliti per tutti. Da mese prossimo l\'affitto sale di 150 euro. Prendere o lasciare."',
    victoryCondition: 'Flessibilità >= 8',
    defeatCondition: 'Fermezza <= 2',
    difficulty: 3
  },
  apology: {
    id: 'apology',
    title: 'Scuse al Partner',
    description: 'Hai dimenticato un anniversario importante.',
    icon: <Smile className="w-8 h-8" />,
    metrics: [
      { name: 'Sincerità', value: 1, max: 10, color: 'bg-emerald-500' },
      { name: 'Rancore', value: 7, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Riduci il Rancore a 0.',
    intro: 'Giulia è seduta a tavola, la cena è fredda. "Non dire niente. So che te ne sei dimenticato di nuovo. Non sono le scuse che voglio, è l\'attenzione."',
    victoryCondition: 'Rancore == 0',
    defeatCondition: 'Sincerità <= 0',
    difficulty: 4
  },
  exam: {
    id: 'exam',
    title: 'Esame Orale Teso',
    description: 'Il professore è convinto che tu stia barando.',
    icon: <GraduationCap className="w-8 h-8" />,
    metrics: [
      { name: 'Credibilità', value: 3, max: 10, color: 'bg-indigo-500' },
      { name: 'Sospetto', value: 6, max: 10, color: 'bg-amber-500' }
    ],
    objective: 'Raggiungi Credibilità 10.',
    intro: 'Il Professor Bianchi chiude il libretto. "Le sue risposte sono troppo simili al testo del manuale. Mi spieghi come mai, o dovrò annullare l\'esame."',
    victoryCondition: 'Credibilità >= 10',
    defeatCondition: 'Sospetto >= 10',
    difficulty: 5
  },
  neighbor: {
    id: 'neighbor',
    title: 'Disputa tra Vicini',
    description: 'Rumori molesti a tarda notte.',
    icon: <DoorOpen className="w-8 h-8" />,
    metrics: [
      { name: 'Pazienza', value: 4, max: 10, color: 'bg-emerald-500' },
      { name: 'Ostilità', value: 5, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Riduci l\'Ostilità a 2 o meno.',
    intro: 'Il vicino bussa forte alla porta. "Basta con questa musica! Sono le tre di notte e domani lavoro. Se non la smetti chiamo i carabinieri!"',
    victoryCondition: 'Ostilità <= 2',
    defeatCondition: 'Pazienza <= 0',
    difficulty: 2
  },
  promotion: {
    id: 'promotion',
    title: 'Richiesta di Promozione',
    description: 'Parla con il tuo capo per ottenere il riconoscimento che meriti.',
    icon: <TrendingUp className="w-8 h-8" />,
    metrics: [
      { name: 'Valore Percepito', value: 3, max: 10, color: 'bg-indigo-500' },
      { name: 'Budget', value: 2, max: 10, color: 'bg-amber-500' }
    ],
    objective: 'Raggiungi Valore Percepito 10.',
    intro: 'Il tuo capo, il Dott. Rossi, ti riceve nel suo ufficio. "Ho visto i risultati del trimestre. Ottimo lavoro. C\'era altro di cui volevi parlarmi?"',
    victoryCondition: 'Valore Percepito >= 10',
    defeatCondition: 'Budget <= 0',
    difficulty: 4
  },
  customer_service: {
    id: 'customer_service',
    title: 'Cliente in Negozio',
    description: 'Un cliente vuole restituire un prodotto usato.',
    icon: <Headphones className="w-8 h-8" />,
    metrics: [
      { name: 'Soddisfazione', value: 2, max: 10, color: 'bg-emerald-500' },
      { name: 'Policy Aziendale', value: 5, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Soddisfazione 8 senza scendere sotto Policy 3.',
    intro: 'Un cliente poggia una scatola sgualcita sul bancone. "Voglio il rimborso. L\'ho usato una volta e non mi piace. Non mi interessa se la scatola è aperta."',
    victoryCondition: 'Soddisfazione >= 8',
    defeatCondition: 'Policy Aziendale <= 2',
    difficulty: 3
  },
  inheritance: {
    id: 'inheritance',
    title: 'Eredità Difficile',
    description: 'Una discussione familiare su beni affettivi.',
    icon: <Scale className="w-8 h-8" />,
    metrics: [
      { name: 'Armonia', value: 3, max: 10, color: 'bg-emerald-500' },
      { name: 'Avidità', value: 4, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Armonia 10.',
    intro: 'Tuo cugino guarda l\'orologio antico del nonno. "Penso che spetti a me, l\'ho sempre aiutato con le riparazioni. Tu non sei mai venuto a trovarlo."',
    victoryCondition: 'Armonia >= 10',
    defeatCondition: 'Avidità >= 10',
    difficulty: 5
  },
  breakup: {
    id: 'breakup',
    title: 'Rottura Civile',
    description: 'Chiudere una relazione senza distruggere i ponti.',
    icon: <HeartOff className="w-8 h-8" />,
    metrics: [
      { name: 'Rispetto', value: 5, max: 10, color: 'bg-sky-500' },
      { name: 'Dolore', value: 6, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Rispetto 10 mantenendo il Dolore sotto controllo.',
    intro: 'Siete seduti al parco. È il momento di dirlo. "Senti, penso che entrambi sappiamo che le cose non stanno più funzionando come prima..."',
    victoryCondition: 'Rispetto >= 10',
    defeatCondition: 'Dolore >= 10',
    difficulty: 4
  },
  vacation: {
    id: 'vacation',
    title: 'Richiesta di Ferie',
    description: 'Hai bisogno di ferie in un periodo critico per il team.',
    icon: <Palmtree className="w-8 h-8" />,
    metrics: [
      { name: 'Empatia', value: 2, max: 10, color: 'bg-emerald-500' },
      { name: 'Urgenza', value: 8, max: 10, color: 'bg-orange-500' }
    ],
    objective: 'Raggiungi Empatia 8.',
    intro: 'Il tuo manager ti guarda preoccupato. "So che hai lavorato sodo, ma siamo nel pieno del lancio. Chiedere due settimane proprio ora è... complicato."',
    victoryCondition: 'Empatia >= 8',
    defeatCondition: 'Urgenza >= 10',
    difficulty: 3
  },
  peer_feedback: {
    id: 'peer_feedback',
    title: 'Feedback a un Collega',
    description: 'Devi dire a un collega che il suo lavoro sta rallentando il team.',
    icon: <MessageSquare className="w-8 h-8" />,
    metrics: [
      { name: 'Chiarezza', value: 3, max: 10, color: 'bg-indigo-500' },
      { name: 'Difensiva', value: 5, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Chiarezza 10 senza far esplodere la Difensiva.',
    intro: 'Sei alla macchinetta del caffè con Luca. "Ehi, volevo parlarti di quel modulo che stiamo aspettando. C\'è qualche problema?"',
    victoryCondition: 'Chiarezza >= 10',
    defeatCondition: 'Difensiva >= 10',
    difficulty: 4
  },
  custom: {
    id: 'custom',
    title: 'Scenario Personalizzato',
    description: 'Generato dall\'IA.',
    icon: <Zap className="w-8 h-8" />,
    metrics: [],
    objective: '',
    intro: '',
    victoryCondition: '',
    defeatCondition: '',
    difficulty: 3
  }
};

// --- Gemini API Integration ---

const GEMINI_MODEL = "gemini-3-flash-preview";

const callGemini = async (
  apiKey: string,
  gameState: GameState,
  userMessage: string
) => {
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `<system_instruction>
<role>
You are the Game Master of "TALKING YOUR WAY OUT", an interactive communication training game. Your task is to simulate realistic conversations, evaluate the user's actions, update game metrics, and determine victory or defeat. You must also provide constructive feedback on communication strategies when requested.
</role>

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
When the user types the command \`/feedback\`, you must **only** provide a structured educational analysis. Do **not** produce any dialog or narrative from the character. Set \`dialog\` and \`narrative\` to empty strings (\`""\`). The \`metrics\` and \`status\` fields should reflect the current state of the game without changes (since feedback does not affect the game). The \`feedback\` field must contain a detailed, structured evaluation in Italian, using the following format:

### 🌟 Cosa hai fatto bene
[Elenca 2-3 punti di forza della comunicazione dell'utente]

### 💡 Cosa puoi migliorare
[Elenca 2-3 aree di miglioramento specifiche]

### 📘 Principio di comunicazione
[Spiegazione concisa di una tecnica specifica, ad esempio: “L’ascolto attivo implica riformulare ciò che l’altro ha detto per mostrare comprensione.”]

### ✍️ Esempio di risposta efficace
[Fornisci un esempio concreto di come avresti potuto rispondere in modo più efficace, basato sul contesto attuale.]

Base your analysis on recognized communication models (Active Listening, Nonviolent Communication, Assertiveness, Emotion Regulation, Reframing). Keep the tone constructive and educational. Limit the total feedback to 4‑5 sentences per section.
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
${Object.values(SCENARIOS).map(s => `
${s.id}: ${s.title}
- Character: ${s.description}
- Metrics: ${s.metrics.map(m => `${m.name} (0-${m.max})`).join(', ')}
- Victory: ${s.victoryCondition}
- Defeat: ${s.defeatCondition}
`).join('\n')}
</scenarios>

<rules>
- You must always respond in Italian. All dialog, narrative, and feedback must be in Italian.
- Always stay in character for the given scenario.
- Update metrics based on the user's action: a skillful, empathetic, or well‑reasoned action should improve the positive metric (e.g., Trust, Collaboration) and/or reduce the negative one (e.g., Suspicion, Anger). Poor choices should have the opposite effect.
- **Leniency**: Do not fail the user too easily. Allow for a few minor mistakes or misunderstandings before triggering a defeat. The goal is training, not immediate punishment. Be patient and give the user chances to recover the conversation.
- **NPC Final Response**: Even if the user reaches a defeat condition, the \`dialog\` field **MUST** contain the NPC's final response (e.g., their final outburst, their decision to leave, or their closing statement) that justifies the defeat. This message is CRITICAL as it provides closure to the scene before the "Scenario Fallito" overlay appears.
- Victory/defeat is triggered when the conditions are met. Once triggered, set \`status\` accordingly.
- For \`/status\`, simply display the current metrics (you may also add a short narrative).
- When the user uses \`/feedback\`, you must not continue the role‑play. Set \`dialog\` and \`narrative\` to empty strings. Provide only the structured feedback in the \`feedback\` field. Do not update metrics or change the game state.
- For \`/quit\`, immediately end the scenario with \`status: "defeat"\` (the application will return to the menu).
- Use the conversation history to maintain consistency.
- The first message in the conversation will specify the active scenario and initial metrics. You must use that information to begin the role‑play.
</rules>

<dynamic_context>
Active scenario: ${gameState.scenario?.title}
Current metrics: ${JSON.stringify(gameState.metrics)}
</dynamic_context>
</system_instruction>`;

  // Build history for Gemini (alternating user/model)
  const historyContext = gameState.history.slice(-10).map(msg => ({
    role: msg.role === 'player' ? 'user' : 'model',
    parts: [{ text: msg.content + (msg.narrative ? ` [Narrativa: ${msg.narrative}]` : '') }]
  }));

  // Build dynamic metrics schema based on scenario
  const metricsSchema: Record<string, any> = {};
  gameState.scenario?.metrics.forEach(m => {
    metricsSchema[m.name] = { type: Type.NUMBER };
  });

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
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
            feedback: { type: Type.STRING }
          },
          required: ["dialog", "narrative", "metrics", "status"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    if (result.status === "playing") result.status = null;
    return result;
  } catch (error) {
    console.error("Errore Gemini API:", error);
    throw error;
  }
};

// --- Main Component ---

export default function App() {
  const [apiKey] = useState<string>(process.env.GEMINI_API_KEY || "");
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [currentView, setCurrentView] = useState<'main' | 'scenarios' | 'game'>('main');
  const [gameState, setGameState] = useState<GameState>({
    scenario: null,
    metrics: {},
    history: [],
    isGameActive: false,
    status: 'playing'
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedScenarios, setCompletedScenarios] = useState<string[]>([]);
  const [customScenarioPrompt, setCustomScenarioPrompt] = useState('');
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load completed scenarios from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('completedScenarios');
    if (saved) {
      try {
        setCompletedScenarios(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse completed scenarios", e);
      }
    }
  }, []);

  // Save completed scenarios to localStorage
  useEffect(() => {
    localStorage.setItem('completedScenarios', JSON.stringify(completedScenarios));
  }, [completedScenarios]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.history]);

  const startScenario = (id: ScenarioId) => {
    const scenario = SCENARIOS[id];
    const initialMetrics: Record<string, number> = {};
    scenario.metrics.forEach(m => initialMetrics[m.name] = m.value);

    setGameState({
      scenario,
      metrics: initialMetrics,
      history: [{
        role: 'gm',
        content: scenario.intro,
        timestamp: Date.now()
      }],
      isGameActive: true,
      status: 'playing'
    });
    setShowMainMenu(false);
    setCurrentView('game');
  };

  const generateCustomScenario = async () => {
    if (!customScenarioPrompt.trim()) return;
    
    // Check for API key availability
    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
    console.log("Generating custom scenario with API Key present:", !!effectiveApiKey);
    
    if (!effectiveApiKey) {
      setError("API Key non configurata. Controlla le impostazioni.");
      return;
    }
    
    setIsGeneratingScenario(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      console.log("Calling Gemini API for custom scenario...");
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Crea uno scenario di addestramento alla comunicazione basato su questo prompt: "${customScenarioPrompt}". 
        Ritorna SOLO un oggetto JSON con questa struttura:
        {
          "id": "custom",
          "title": "string",
          "description": "string",
          "objective": "string",
          "intro": "string",
          "victoryCondition": "string",
          "defeatCondition": "string",
          "difficulty": number (1-5),
          "metrics": [
            { "name": "string", "value": number, "max": 10, "color": "bg-color-500" },
            { "name": "string", "value": number, "max": 10, "color": "bg-color-500" }
          ]
        }
        Lo scenario deve essere in italiano. Usa metriche pertinenti alla situazione.`,
        config: { responseMimeType: "application/json" }
      });
      
      const scenario = JSON.parse(response.text) as Scenario;
      console.log("Generated scenario:", scenario);
      scenario.icon = <Zap className="w-10 h-10" />;
      
      setGameState({
        scenario,
        metrics: scenario.metrics.reduce((acc, m) => ({ ...acc, [m.name]: m.value }), {}),
        history: [{
          role: 'gm',
          content: scenario.intro,
          timestamp: Date.now()
        }],
        isGameActive: true,
        status: 'playing'
      });
      setCurrentView('game');
    } catch (err) {
      console.error(err);
      setError("Errore nella generazione dello scenario. Riprova.");
    } finally {
      setIsGeneratingScenario(false);
      setCustomScenarioPrompt('');
    }
  };

  const handleCommand = (cmd: string) => {
    const parts = cmd.split(' ');
    const base = parts[0];
    const arg = parts.slice(1).join(' ');

    switch (base) {
      case '/observe':
        processUserMessage('/observe');
        break;
      case '/status':
        const metricStr = Object.entries(gameState.metrics).map(([k, v]) => `${k}: ${v}`).join(', ');
        const statusMsg: Message = {
          role: 'gm',
          content: `Stato Attuale - ${metricStr}. Obiettivo: ${gameState.scenario?.objective}`,
          timestamp: Date.now()
        };
        setGameState(prev => ({
          ...prev,
          history: [...prev.history, statusMsg]
        }));
        break;
      case '/help':
        const helpMsg: Message = {
          role: 'gm',
          content: "Comandi disponibili: /status (mostra metriche), /observe (analizza la situazione), /feedback (ricevi un'analisi della tua comunicazione), /quit (esci), /help (mostra questo messaggio). Puoi anche scrivere normalmente per parlare!",
          timestamp: Date.now()
        };
        setGameState(prev => ({
          ...prev,
          history: [...prev.history, helpMsg]
        }));
        break;
      case '/feedback':
        processUserMessage('/feedback');
        break;
      case '/quit':
        setGameState(prev => ({ ...prev, isGameActive: false, scenario: null }));
        setCurrentView('main');
        break;
      case '/question':
      case '/show':
      case '/challenge':
        processUserMessage(`[COMANDO: ${base}] ${arg}`);
        break;
      default:
        const unknownMsg: Message = { role: 'gm', content: "Comando sconosciuto. Prova /status o /observe.", timestamp: Date.now() };
        setGameState(prev => ({
          ...prev,
          history: [...prev.history, unknownMsg]
        }));
    }
  };

  const processUserMessage = async (text: string) => {
    if (!gameState.isGameActive || gameState.status !== 'playing' || isLoading) return;

    if (!apiKey) {
      setError("Configura una API Key di Gemini nel codice sorgente per giocare.");
      return;
    }

    setError(null);
    setIsLoading(true);

    const playerMsg: Message = {
      role: 'player',
      content: text,
      timestamp: Date.now()
    };

    const newHistory = [...gameState.history, playerMsg];
    
    // Optimistically update history to show player message immediately
    setGameState(prev => ({
      ...prev,
      history: newHistory
    }));

    try {
      const result = await callGemini(apiKey, gameState, text);
      
      const npcMsg: Message = {
        role: result.feedback ? 'gm' : 'npc',
        content: result.feedback || result.dialog,
        narrative: result.narrative,
        feedback: result.feedback,
        timestamp: Date.now()
      };

      if (result.feedback) {
        setFeedbackModal(result.feedback);
      }

      const isVictory = result.status === 'victory';
      if (isVictory && gameState.scenario) {
        setCompletedScenarios(prev => {
          if (prev.includes(gameState.scenario!.id)) return prev;
          return [...prev, gameState.scenario!.id];
        });
      }

      setGameState(prev => ({
        ...prev,
        metrics: result.metrics || prev.metrics,
        status: isVictory ? 'won' : result.status === 'defeat' ? 'lost' : 'playing',
        history: [...newHistory, npcMsg]
      }));
    } catch (err) {
      setError("Errore durante la comunicazione con l'IA. Controlla la tua API Key.");
      setGameState(prev => ({
        ...prev,
        history: [...newHistory, {
          role: 'gm',
          content: "Si è verificato un errore tecnico. Riprova o controlla la tua connessione.",
          timestamp: Date.now()
        }]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (inputValue.startsWith('/')) {
      handleCommand(inputValue);
    } else {
      processUserMessage(inputValue);
    }
    setInputValue('');
  };

  return (
    <div className="flex flex-col min-h-screen md:h-screen max-w-6xl mx-auto p-4 md:p-6 gap-6 bg-orange-50 text-slate-800 relative overflow-x-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -10, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl"
        />
        <div className="absolute top-1/4 left-10 opacity-20">
          <Sparkles className="w-12 h-12 text-orange-400" />
        </div>
        <div className="absolute top-1/3 right-20 opacity-10">
          <Ghost className="w-16 h-16 text-orange-300" />
        </div>
        <div className="absolute bottom-1/4 right-10 opacity-20">
          <MessageCircle className="w-12 h-12 text-orange-400" />
        </div>
        <div className="absolute bottom-1/3 left-20 opacity-10">
          <UserPlus className="w-16 h-16 text-orange-300" />
        </div>
        <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-5">
          <Phone className="w-32 h-32 text-orange-400" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentView === 'main' ? (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10 min-h-0"
          >
            <motion.div 
              animate={{ rotate: [0, 5, -5, 0], y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-32 h-32 bg-orange-100 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner"
            >
              <Users className="w-16 h-16 text-orange-600" />
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-800 mb-4 tracking-tighter leading-none"
            >
              TALKING <span className="text-orange-500">YOUR</span> WAY OUT
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-slate-500 mb-8 md:mb-12 max-w-md mx-auto font-medium leading-relaxed px-4"
            >
              Affina le tue abilità comunicative in scenari realistici guidati dall'intelligenza artificiale.
            </motion.p>

            <div className="flex flex-col gap-4 md:gap-6 w-full max-w-sm mx-auto px-4">
              <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('scenarios')}
                className="group relative overflow-hidden bg-orange-500 hover:bg-orange-600 text-white py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-bold text-xl md:text-2xl transition-all shadow-xl shadow-orange-500/20 border-b-4 md:border-b-8 border-orange-700 active:border-b-0 active:translate-y-1 md:active:translate-y-2 cursor-pointer"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  SELEZIONA SCENARIO <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
                </span>
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startScenario('tutorial')}
                className="bg-white hover:bg-orange-50 text-orange-600 border-2 md:border-4 border-orange-200 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-bold text-xl md:text-2xl transition-all shadow-lg border-b-4 md:border-b-8 border-orange-200 active:border-b-0 active:translate-y-1 md:active:translate-y-2 cursor-pointer"
              >
                <span className="flex items-center justify-center gap-3">
                  TUTORIAL <Rocket className="w-6 h-6 md:w-8 md:h-8" />
                </span>
              </motion.button>
            </div>
          </motion.div>
        ) : currentView === 'scenarios' ? (
          <motion.div 
            key="scenarios"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col relative z-10 w-full min-h-0 overflow-hidden"
          >
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 shrink-0 px-6 gap-4">
              <button 
                onClick={() => setCurrentView('main')}
                className="flex items-center gap-2 text-slate-500 hover:text-orange-600 font-bold transition-colors cursor-pointer"
              >
                <Home className="w-5 h-5" /> Torna al Menu
              </button>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight text-center">SCEGLI LA TUA <span className="text-orange-500">SFIDA</span></h2>
              <div className="hidden md:block w-24"></div>
            </div>

            {error && (
              <div className="mx-6 mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
                <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto p-6 chat-scrollbar pb-32">
              {/* Custom Scenario Card */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="flex flex-col gap-4 p-6 bg-orange-50 border-2 border-orange-200 rounded-[2.5rem] text-left transition-all shadow-lg relative cursor-default h-fit"
              >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-3xl flex items-center justify-center text-orange-600 shadow-inner shrink-0">
                      <Zap className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Scenario Personalizzato</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">Descrivi una situazione e l'IA creerà una sfida su misura per te.</p>
                  <div className="flex flex-col gap-3">
                    <textarea 
                      value={customScenarioPrompt}
                      onChange={(e) => setCustomScenarioPrompt(e.target.value)}
                      placeholder="Esempio: Chiedere un aumento al capo..."
                      className="w-full p-4 text-sm bg-white border border-orange-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 chat-scrollbar resize-none h-24 shadow-inner"
                    />
                    <button 
                      onClick={() => {
                        console.log("Genera Sfida button clicked!");
                        if (!customScenarioPrompt.trim()) {
                          setError("Inserisci una descrizione per lo scenario.");
                          return;
                        }
                        generateCustomScenario();
                      }}
                      disabled={isGeneratingScenario}
                      className={`w-full py-4 ${!customScenarioPrompt.trim() ? 'bg-orange-300' : 'bg-orange-500 hover:bg-orange-600'} text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isGeneratingScenario ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                      Genera Sfida
                    </button>
                  </div>
                </div>
              </motion.div>

              {Object.values(SCENARIOS)
                .filter(s => s.id !== 'tutorial')
                .sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0))
                .map((s) => (
                  <motion.button
                    key={s.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startScenario(s.id)}
                    className="flex flex-col gap-4 p-6 bg-white border-2 border-orange-100 hover:border-orange-500 rounded-[2.5rem] text-left transition-all shadow-lg hover:shadow-orange-500/10 group relative cursor-pointer h-fit"
                  >
                    <div className="absolute top-0 right-0 p-4 flex flex-col items-end gap-2">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < (s.difficulty || 0) ? 'text-orange-500 fill-orange-500' : 'text-slate-200'}`} 
                          />
                        ))}
                      </div>
                      {completedScenarios.includes(s.id) && (
                        <div className="flex items-center gap-1 bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="w-2 h-2" /> Completato
                        </div>
                      )}
                    </div>
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 shadow-inner shrink-0">
                      {React.cloneElement(s.icon as React.ReactElement<any>, { className: "w-8 h-8 md:w-10 md:h-10" })}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">{s.title}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Sintesi</p>
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{s.description}</p>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-orange-50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Difficoltà {s.difficulty}/5</span>
                      <ChevronRight className="w-5 h-5 text-orange-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.button>
                ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col gap-6 min-h-0"
          >
            {/* Header */}
            <header className="flex items-center justify-between bg-white p-4 rounded-3xl border border-orange-100 shadow-lg relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-2.5 rounded-2xl shadow-lg shadow-orange-500/30">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">TALKING YOUR WAY OUT</h1>
              </div>
              <div className="flex items-center gap-4">
                {error && (
                  <div className="hidden md:flex items-center gap-2 text-rose-600 text-xs font-bold bg-rose-50 px-4 py-2 rounded-full border border-rose-100 shadow-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full border border-orange-100">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">AI Coach</span>
                </div>
              </div>
            </header>

            <main className={`flex-1 flex flex-col ${gameState.scenario?.id === 'tutorial' ? 'items-center' : 'md:flex-row'} gap-6 min-h-0 relative z-10`}>
              {/* Left Sidebar: Scenarios & Metrics */}
              {gameState.scenario?.id !== 'tutorial' && (
                <aside className="w-full md:w-80 flex flex-col gap-6">
                  {/* Metrics Panel */}
                  {gameState.scenario && (
                    <section className="bg-white p-5 rounded-3xl border border-orange-100 shadow-lg flex flex-col gap-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-orange-500" /> Metriche Attuali
                      </h3>
                      <div className="space-y-4">
                        {gameState.scenario.metrics.map(m => (
                          <div key={m.name} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-slate-600">{m.name}</span>
                              <span className="text-slate-400">{gameState.metrics[m.name] || 0} / {m.max}</span>
                            </div>
                            <div className="h-2 bg-orange-50 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${((gameState.metrics[m.name] || 0) / m.max) * 100}%` }}
                                className={`h-full ${m.color} shadow-sm`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-4 border-t border-orange-50">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Obiettivo</p>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{gameState.scenario.objective}</p>
                      </div>
                    </section>
                  )}

                  {/* Climate Analysis Panel */}
                  {gameState.isGameActive && gameState.scenario && (
                    <section className="bg-white p-5 rounded-3xl border border-orange-100 shadow-lg flex flex-col gap-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-orange-500" /> Analisi Clima
                      </h3>
                      <div className="p-3 bg-orange-50/50 rounded-2xl border border-orange-100">
                        <div className="flex items-center gap-2 mb-2">
                          {Object.values(gameState.metrics).some(v => v > 7) ? (
                            <>
                              <Zap className="w-4 h-4 text-orange-500" />
                              <span className="text-lg">🔥</span>
                            </>
                          ) : Object.values(gameState.metrics).every(v => v < 4) ? (
                            <>
                              <Smile className="w-4 h-4 text-emerald-500" />
                              <span className="text-lg">😊</span>
                            </>
                          ) : (
                            <>
                              <Activity className="w-4 h-4 text-amber-500" />
                              <span className="text-lg">⚖️</span>
                            </>
                          )}
                          <span className="text-[10px] font-bold uppercase text-slate-500">Stato Attuale</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed italic">
                          {Object.values(gameState.metrics).some(v => v >= 8) 
                            ? "La situazione è estremamente tesa. Un passo falso potrebbe essere fatale." 
                            : Object.values(gameState.metrics).some(v => v >= 5)
                            ? "C'è una tensione palpabile. Procedi con cautela e ascolto attivo."
                            : "Il clima sembra stabile, ma non abbassare la guardia."}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-orange-400 uppercase tracking-tighter">
                        <HelpCircle className="w-3 h-3" /> Suggerimento: Usa /observe per indizi.
                      </div>
                    </section>
                  )}

              {/* Home Button in Sidebar */}
              {gameState.isGameActive && (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setGameState(prev => ({ ...prev, isGameActive: false, scenario: null }));
                    setCurrentView('main');
                  }}
                  className="flex items-center justify-center gap-2 p-4 bg-white hover:bg-orange-50 border border-orange-100 rounded-3xl text-sm font-bold text-slate-500 hover:text-orange-600 transition-all shadow-lg"
                >
                  <Home className="w-5 h-5" /> Torna al Menu
                </motion.button>
              )}

              {/* Scenario Selection (Hidden during game) */}
              {!gameState.isGameActive && (
                <section className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 chat-scrollbar">
                  <div className="bg-white border border-orange-100 p-4 rounded-2xl mb-2 shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3" /> Tutorial Rapido
                    </h4>
                    <ul className="text-[11px] text-slate-500 space-y-1.5 leading-tight">
                      <li>• Scegli uno scenario per iniziare.</li>
                      <li>• Parla con l'NPC per raggiungere l'obiettivo.</li>
                      <li>• Usa <code className="text-orange-600 font-bold">/observe</code> per analizzare la scena.</li>
                      <li>• Monitora le metriche: influenzano il finale!</li>
                    </ul>
                  </div>
                </section>
              )}
            </aside>
          )}

              {/* Main Chat Area */}
              <section className={`flex-1 flex flex-col bg-white rounded-[2.5rem] border border-orange-100 overflow-hidden shadow-2xl transition-all duration-500 ${gameState.scenario?.id === 'tutorial' ? 'max-w-3xl w-full' : ''}`}>
                {!gameState.isGameActive ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                      <MessageSquare className="w-10 h-10 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Pronto ad allenarti?</h2>
                    <p className="text-slate-500 max-w-sm">Seleziona uno scenario dalla barra laterale per iniziare la tua sessione di allenamento alla comunicazione.</p>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    <div className="px-6 py-4 border-b border-orange-50 bg-orange-50/30 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm shrink-0">
                          {gameState.scenario && React.cloneElement(gameState.scenario.icon as React.ReactElement<any>, { className: "w-6 h-6" })}
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">
                            {gameState.scenario?.title}
                          </h2>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sessione Attiva</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < (gameState.scenario?.difficulty || 0) ? 'text-orange-500 fill-orange-500' : 'text-slate-200'}`} 
                          />
                        ))}
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 chat-scrollbar bg-white">
                      {gameState.history.map((msg, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          whileHover={{ y: -2 }}
                          className={`flex flex-col ${msg.role === 'player' ? 'items-end' : 'items-start'} transition-all duration-300`}
                        >
                          <div className="flex items-center gap-2 mb-1.5 px-1">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              {msg.role === 'gm' ? (
                                <><Terminal className="w-3 h-3" /> Game Master</>
                              ) : msg.role === 'npc' ? (
                                <><Ghost className="w-3 h-3" /> {gameState.scenario?.title.split(' ')[0]}</>
                              ) : (
                                <><Users className="w-3 h-3" /> Tu</>
                              )}
                            </span>
                          </div>
                          
                          <div className={`max-w-[85%] rounded-[2rem] p-5 text-sm leading-relaxed shadow-md hover:shadow-lg transition-shadow ${
                            msg.role === 'player' 
                              ? 'bg-orange-500 text-white rounded-tr-none' 
                              : msg.feedback
                              ? 'bg-indigo-50 text-indigo-900 border-2 border-indigo-100 rounded-tl-none'
                              : msg.role === 'gm'
                              ? 'bg-orange-50 text-slate-700 border border-orange-100 italic rounded-tl-none'
                              : 'bg-white text-slate-800 border border-orange-100 rounded-tl-none'
                          }`}>
                            {msg.feedback && (
                              <div className="flex items-center gap-2 mb-3 text-indigo-600 font-bold uppercase tracking-widest text-[10px]">
                                <Sparkles className="w-4 h-4" /> Analisi Comunicativa
                              </div>
                            )}
                            <div className="whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </div>

                          {msg.narrative && (
                            <div className="mt-2 text-xs text-slate-400 italic px-1 max-w-[80%]">
                              {msg.narrative}
                            </div>
                          )}
                        </motion.div>
                      ))}

                      {isLoading && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 text-orange-400 text-xs font-bold px-1"
                        >
                          <Loader2 className="w-3 h-3 animate-spin" />
                          L'IA sta elaborando...
                        </motion.div>
                      )}

                      {/* Game Outcome Overlay */}
                      {gameState.status !== 'playing' && (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`p-6 rounded-2xl border-2 flex flex-col items-center text-center gap-4 ${
                            gameState.status === 'won' 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}
                        >
                          {gameState.status === 'won' ? (
                            <CheckCircle2 className="w-12 h-12" />
                          ) : (
                            <XCircle className="w-12 h-12" />
                          )}
                          <div>
                            <h3 className="text-xl font-bold mb-1">
                              {gameState.status === 'won' ? 'Obiettivo Raggiunto!' : 'Scenario Fallito'}
                            </h3>
                            <p className="text-sm opacity-80">
                              {gameState.status === 'won' 
                                ? 'Hai gestito la conversazione con successo.' 
                                : 'La situazione è deteriorata oltre ogni recupero.'}
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => startScenario(gameState.scenario!.id)}
                              className="px-6 py-2 bg-white border-2 border-current hover:bg-white/50 rounded-xl text-sm font-bold transition-all"
                            >
                              Riprova
                            </button>
                            <button 
                              onClick={() => {
                                setGameState(prev => ({ ...prev, isGameActive: false, scenario: null }));
                                setCurrentView('main');
                              }}
                              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg"
                            >
                              Torna al Menu
                            </button>
                          </div>
                        </motion.div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 md:p-6 bg-orange-50/30 border-t border-orange-100">
                      <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
                        <div className="absolute left-4 text-orange-400">
                          <Terminal className="w-4 h-4" />
                        </div>
                        <input 
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          disabled={gameState.status !== 'playing' || isLoading}
                          placeholder={gameState.status === 'playing' ? "Scrivi un messaggio o un comando (/status, /observe)..." : "Fine Partita"}
                          className="flex-1 bg-white border border-orange-100 rounded-2xl pl-11 pr-14 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 placeholder:text-slate-400 text-slate-800 shadow-sm disabled:opacity-50"
                        />
                        <button 
                          type="submit"
                          disabled={!inputValue.trim() || gameState.status !== 'playing' || isLoading}
                          className="absolute right-2 p-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white rounded-xl transition-all shadow-lg shadow-orange-500/20"
                        >
                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                      </form>
                      <div className="mt-5 px-2">
                        <div className="flex items-center gap-2 mb-3">
                          <Terminal className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Azioni Rapide</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {/* Status Button */}
                          <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => handleCommand('/status')}
                            className="flex items-center gap-2.5 px-6 py-3 bg-orange-100/50 border-2 border-orange-200 hover:bg-orange-100 hover:border-orange-400 text-orange-700 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all"
                          >
                            <Activity className="w-5 h-5" />
                            /status
                          </motion.button>

                          {/* Observe Button */}
                          <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => handleCommand('/observe')}
                            className="flex items-center gap-2.5 px-6 py-3 bg-orange-100/50 border-2 border-orange-200 hover:bg-orange-100 hover:border-orange-400 text-orange-700 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all"
                          >
                            <Eye className="w-5 h-5" />
                            /observe
                          </motion.button>

                          {/* Help Button */}
                          <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => handleCommand('/help')}
                            className="flex items-center gap-2.5 px-6 py-3 bg-orange-100/50 border-2 border-orange-200 hover:bg-orange-100 hover:border-orange-400 text-orange-700 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all"
                          >
                            <HelpCircle className="w-5 h-5" />
                            /help
                          </motion.button>

                          {/* Feedback Button */}
                          <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => handleCommand('/feedback')}
                            className="flex items-center gap-2.5 px-6 py-3 bg-indigo-50 border-2 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400 text-indigo-700 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all"
                          >
                            <Sparkles className="w-5 h-5" />
                            /feedback
                          </motion.button>

                          {/* Quit Button */}
                          <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => handleCommand('/quit')}
                            className="flex items-center gap-2.5 px-6 py-3 bg-rose-50 border-2 border-rose-200 hover:bg-rose-100 hover:border-rose-400 text-rose-600 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all ml-auto"
                          >
                            <LogOut className="w-5 h-5" />
                            /quit
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </main>

            {/* Footer Info */}
            <footer className="text-center pb-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                Communication Trainer v1.2 • Powered by Gemini 3.0 Flash
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFeedbackModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border-4 border-indigo-100"
            >
              <div className="bg-indigo-600 p-8 text-white relative">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">ANALISI COMUNICATIVA</h2>
                    <p className="text-indigo-100 font-medium opacity-80 uppercase tracking-widest text-xs">Feedback dell'Intelligenza Artificiale</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFeedbackModal(null)}
                  className="absolute top-8 right-8 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 max-h-[70vh] overflow-y-auto chat-scrollbar">
                <div className="prose prose-slate max-w-none">
                  <div className="text-slate-700 leading-relaxed font-medium">
                    <Markdown>{feedbackModal}</Markdown>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                <button 
                  onClick={() => setFeedbackModal(null)}
                  className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all"
                >
                  HO CAPITO
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
