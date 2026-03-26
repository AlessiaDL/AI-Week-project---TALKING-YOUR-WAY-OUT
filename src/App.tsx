import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Shield, 
  Users, 
  Home, 
  Send, 
  Terminal, 
  BarChart3, 
  LogOut,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2,
  Sparkles,
  Ghost,
  Heart,
  Coffee,
  PartyPopper,
  Gamepad2,
  Rocket,
  Star,
  Eye,
  Activity,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types & Constants ---

const DEFAULT_API_KEY = ""; // Modifica qui la tua API Key

type ScenarioId = 'hr' | 'friend' | 'roommate' | 'tutorial';

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
}

interface Message {
  role: 'gm' | 'player' | 'npc';
  content: string;
  narrative?: string;
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
    icon: <Rocket className="w-6 h-6" />,
    metrics: [
      { name: 'Apprendimento', value: 0, max: 3, color: 'bg-orange-500' }
    ],
    objective: 'Completa i 3 passaggi del tutorial.',
    intro: 'Benvenuto nel tutorial! Io sono il tuo assistente. Per iniziare, prova a scrivere il comando "/observe" per analizzare l\'ambiente e ricevere il tuo primo punto Apprendimento.',
    victoryCondition: 'Apprendimento >= 3',
    defeatCondition: 'Apprendimento < 0'
  },
  hr: {
    id: 'hr',
    title: 'Revisione delle Prestazioni HR',
    description: 'Un incontro teso con le Risorse Umane riguardo alle tue recenti prestazioni. La fiducia è bassa, il sospetto è alto.',
    icon: <Shield className="w-6 h-6" />,
    metrics: [
      { name: 'Fiducia', value: 1, max: 5, color: 'bg-emerald-500' },
      { name: 'Sospetto', value: 1, max: 5, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Fiducia 3 prima che il Sospetto raggiunga 3.',
    intro: 'Sei seduto in un ufficio sterile. La signora Henderson delle Risorse Umane si sistema gli occhiali. "Grazie per essere venuto. Abbiamo alcune preoccupazioni riguardo alla tabella di marcia del progetto..."',
    victoryCondition: 'Fiducia >= 3',
    defeatCondition: 'Sospetto >= 3'
  },
  friend: {
    id: 'friend',
    title: 'Conflitto con un Amico',
    description: 'Il tuo migliore amico è arrabbiato per un impegno dimenticato. Le emozioni sono forti.',
    icon: <Heart className="w-6 h-6" />,
    metrics: [
      { name: 'Rabbia', value: 4, max: 5, color: 'bg-orange-500' },
      { name: 'Rispetto', value: 2, max: 5, color: 'bg-sky-500' }
    ],
    objective: 'Riduci la Rabbia a 0.',
    intro: 'Alex cammina nervosamente in soggiorno. "Proprio non capisco. Contavo su di te. Ti importa almeno dei nostri piani?"',
    victoryCondition: 'Rabbia == 0',
    defeatCondition: 'Rispetto == 0'
  },
  roommate: {
    id: 'roommate',
    title: 'Conflitto tra Coinquilini',
    description: 'La cucina è un disastro e l\'affitto deve essere pagato. Devi coordinarti con un coinquilino difficile.',
    icon: <Coffee className="w-6 h-6" />,
    metrics: [
      { name: 'Tensione', value: 3, max: 5, color: 'bg-amber-500' },
      { name: 'Collaborazione', value: 0, max: 5, color: 'bg-indigo-500' }
    ],
    objective: 'Raggiungi Collaborazione 2.',
    intro: 'Il lavandino è pieno di piatti sporchi. Jordan è seduto sul divano, ignorando il disordine. "Oh, sei a casa. A proposito, la bolletta di internet è più alta questo mese."',
    victoryCondition: 'Collaborazione >= 2',
    defeatCondition: 'Tensione >= 5'
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

  const systemInstruction = `Sei il Game Master di "TALKING YOUR WAY OUT".
Simuli conversazioni realistiche e tese.
Comandi globali: /observe, /question [testo], /show [testo], /challenge, /status, /quit.
Il testo libero è permesso e incoraggiato.
TUTTA LA TUA RISPOSTA (dialogo e narrativa) DEVE ESSERE IN ITALIANO.

Rispondi SOLO con un oggetto JSON valido che segua questo schema:
{
  "dialog": "Le parole pronunciate dal personaggio NPC",
  "narrative": "Una breve descrizione delle azioni o dell'atmosfera",
  "metrics": { "NomeMetrica": valore_numerico, ... },
  "status": "victory" | "defeat" | null
}

Scenario attuale: ${gameState.scenario?.title}
Descrizione: ${gameState.scenario?.description}
Obiettivo: ${gameState.scenario?.objective}
Condizione di Vittoria: ${gameState.scenario?.victoryCondition}
Condizione di Sconfitta: ${gameState.scenario?.defeatCondition}

Metriche attuali: ${JSON.stringify(gameState.metrics)}

IMPORTANTE: Aggiorna le metriche in base all'efficacia della comunicazione dell'utente. Sii equo ma rigoroso.
Se l'utente raggiunge la condizione di vittoria, imposta status su "victory".
Se l'utente raggiunge la condizione di sconfitta, imposta status su "defeat".
Se lo scenario è il tutorial, guida l'utente a completare i passaggi e incrementa "Apprendimento" quando l'utente interagisce correttamente.`;

  // Build history for Gemini (alternating user/model)
  // We take the last 10 messages for context
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
        systemInstruction,
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
            status: { type: Type.STRING, enum: ["victory", "defeat", null] }
          },
          required: ["dialog", "narrative", "metrics", "status"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Errore Gemini API:", error);
    throw error;
  }
};

// --- Main Component ---

export default function App() {
  const [apiKey] = useState<string>(DEFAULT_API_KEY);
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [gameState, setGameState] = useState<GameState>({
    scenario: null,
    metrics: {},
    history: [],
    isGameActive: false,
    status: 'playing'
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
  };

  const handleCommand = (cmd: string) => {
    const parts = cmd.split(' ');
    const base = parts[0];
    const arg = parts.slice(1).join(' ');

    let response: Message | null = null;

    switch (base) {
      case '/observe':
        let observeText = "Ti prendi un momento per analizzare la situazione.";
        if (gameState.scenario?.id === 'tutorial') {
          observeText = "Osservi il tuo assistente virtuale. Ti sta sorridendo, pronto ad aiutarti. Hai completato il primo passo del tutorial! Ora prova a fargli una domanda scrivendo normalmente.";
          setGameState(prev => ({
            ...prev,
            metrics: { ...prev.metrics, 'Apprendimento': Math.min((prev.metrics['Apprendimento'] || 0) + 1, 3) }
          }));
        } else if (gameState.scenario?.id === 'hr') {
          observeText += " L'aria è densa di tensione professionale.";
        } else if (gameState.scenario?.id === 'friend') {
          observeText += " Il silenzio tra voi sembra pesante e fragile.";
        } else {
          observeText += " Il disordine nella stanza rispecchia la comunicazione confusa.";
        }
        response = {
          role: 'gm',
          content: observeText,
          timestamp: Date.now()
        };
        break;
      case '/status':
        const metricStr = Object.entries(gameState.metrics).map(([k, v]) => `${k}: ${v}`).join(', ');
        response = {
          role: 'gm',
          content: `Stato Attuale - ${metricStr}. Obiettivo: ${gameState.scenario?.objective}`,
          timestamp: Date.now()
        };
        break;
      case '/help':
        response = {
          role: 'gm',
          content: "Comandi disponibili: /status (mostra metriche), /observe (analizza la situazione), /quit (esci), /help (mostra questo messaggio). Puoi anche scrivere normalmente per parlare!",
          timestamp: Date.now()
        };
        break;
      case '/quit':
        setGameState(prev => ({ ...prev, isGameActive: false, scenario: null }));
        return;
      case '/question':
      case '/show':
      case '/challenge':
        processUserMessage(`[COMANDO: ${base}] ${arg}`);
        return;
      default:
        response = { role: 'gm', content: "Comando sconosciuto. Prova /status o /observe.", timestamp: Date.now() };
    }

    if (response) {
      setGameState(prev => ({
        ...prev,
        history: [...prev.history, response!]
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
        role: 'npc',
        content: result.dialog,
        narrative: result.narrative,
        timestamp: Date.now()
      };

      setGameState(prev => ({
        ...prev,
        metrics: result.metrics,
        status: result.status === 'victory' ? 'won' : result.status === 'defeat' ? 'lost' : 'playing',
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
    <div className="flex flex-col h-screen max-w-6xl mx-auto p-4 md:p-6 gap-6 bg-orange-50 text-slate-800 relative overflow-hidden">
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
          <Star className="w-12 h-12 text-orange-400" />
        </div>
        <div className="absolute bottom-1/3 left-20 opacity-10">
          <PartyPopper className="w-16 h-16 text-orange-300" />
        </div>
        <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-5">
          <Gamepad2 className="w-32 h-32 text-orange-400" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showMainMenu ? (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10"
          >
            <motion.div 
              animate={{ rotate: [0, 5, -5, 0], y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-32 h-32 bg-orange-100 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner"
            >
              <Gamepad2 className="w-16 h-16 text-orange-600" />
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-7xl font-black text-slate-800 mb-4 tracking-tighter"
            >
              TALKING <span className="text-orange-500">YOUR</span> WAY OUT
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-slate-500 mb-12 max-w-md mx-auto font-medium leading-relaxed"
            >
              Affina le tue abilità comunicative in scenari realistici guidati dall'intelligenza artificiale.
            </motion.p>

            <div className="flex flex-col gap-4 w-full max-w-sm">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMainMenu(false)}
                className="group relative overflow-hidden bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-3xl font-bold text-2xl transition-all shadow-xl shadow-orange-500/20 border-b-4 border-orange-700"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  GIOCA ORA <Rocket className="w-7 h-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </span>
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startScenario('tutorial')}
                className="bg-white hover:bg-orange-100 text-orange-600 border-2 border-orange-200 py-5 rounded-3xl font-bold text-2xl transition-all shadow-lg border-b-4 border-orange-200"
              >
                TUTORIAL INTERATTIVO
              </motion.button>
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
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  onClick={() => setShowMainMenu(true)}
                  className="bg-orange-500 p-2.5 rounded-2xl shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-colors"
                >
                  <Gamepad2 className="w-6 h-6 text-white" />
                </motion.button>
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
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Live</span>
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

                  {/* Scenario Selection */}
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
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Scegli uno Scenario</h3>
                      {Object.values(SCENARIOS).filter(s => s.id !== 'tutorial').map(s => (
                        <button
                          key={s.id}
                          onClick={() => startScenario(s.id)}
                          className="group flex flex-col gap-2 p-4 bg-white hover:bg-orange-50 border border-orange-100 hover:border-orange-500/50 rounded-2xl text-left transition-all duration-300 hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors text-orange-600">
                              {s.icon}
                            </div>
                            <span className="font-bold text-slate-800">{s.title}</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{s.description}</p>
                        </button>
                      ))}
                    </section>
                  )}

                  {gameState.isGameActive && (
                    <button 
                      onClick={() => {
                        setGameState(prev => ({ ...prev, isGameActive: false, scenario: null }));
                        setShowMainMenu(true);
                      }}
                      className="mt-auto flex items-center justify-center gap-2 p-3 bg-white hover:bg-orange-50 border border-orange-100 rounded-xl text-sm font-bold text-slate-500 hover:text-orange-600 transition-all shadow-sm"
                    >
                      <LogOut className="w-4 h-4" /> Torna al Menu
                    </button>
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
                              : msg.role === 'gm'
                              ? 'bg-orange-50 text-slate-700 border border-orange-100 italic rounded-tl-none'
                              : 'bg-white text-slate-800 border border-orange-100 rounded-tl-none'
                          }`}>
                            {msg.content}
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
                          <button 
                            onClick={() => {
                              setGameState(prev => ({ ...prev, isGameActive: false, scenario: null }));
                              setShowMainMenu(true);
                            }}
                            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg"
                          >
                            Torna al Menu
                          </button>
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
    </div>
  );
}
