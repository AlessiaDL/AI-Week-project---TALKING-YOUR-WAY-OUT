/// <reference types="vite/client" />
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
  LogOut,
  RotateCcw,
  Mail,
  Inbox,
  SendHorizontal,
  Info,
  FileWarning
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { callGemini } from './gemini'; // Importa la logica dell'AI

// --- Types & Constants ---

type ScenarioId = 'hr' | 'friend' | 'roommate' | 'interview' | 'client' | 'partner' | 'customer' | 'parent' | 'team' | 'rent' | 'apology' | 'exam' | 'neighbor' | 'promotion' | 'customer_service' | 'inheritance' | 'breakup' | 'vacation' | 'peer_feedback' | 'angry_client' | 'late_report' | 'tutorial';

type GameMode = 'chat' | 'mail';

type Personality = 'passive' | 'aggressive' | 'passive-aggressive' | 'assertive';

interface SubScenario {
  personality: Personality;
  difficulty: number;
  intro?: string;
}

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

interface Message {
  role: 'gm' | 'player' | 'npc';
  content: string;
  narrative?: string;
  feedback?: string;
  score?: number;
  timestamp: number;
}

interface GameState {
  mode: GameMode;
  scenario: Scenario | null;
  activeVariant: SubScenario | null;
  metrics: Record<string, number>;
  history: Message[];
  isGameActive: boolean;
  status: 'playing' | 'won' | 'lost';
}

const PERSONALITY_LABELS: Record<Personality | 'all', string> = {
  all: 'Tutti',
  passive: 'Passivo',
  aggressive: 'Aggressivo',
  'passive-aggressive': 'Passivo-Aggressivo',
  assertive: 'Assertivo'
};

const PERSONALITY_COLORS: Record<Personality | 'all', { 
  bg: string, 
  accent: string, 
  text: string, 
  border: string,
  hoverBorder: string,
  groupHoverBg: string
}> = {
  all: { 
    bg: 'bg-orange-50', 
    accent: 'bg-orange-500', 
    text: 'text-orange-600', 
    border: 'border-orange-200',
    hoverBorder: 'hover:border-orange-500',
    groupHoverBg: 'group-hover:bg-orange-500'
  },
  passive: { 
    bg: 'bg-sky-50', 
    accent: 'bg-sky-500', 
    text: 'text-sky-600', 
    border: 'border-sky-200',
    hoverBorder: 'hover:border-sky-500',
    groupHoverBg: 'group-hover:bg-sky-500'
  },
  aggressive: { 
    bg: 'bg-rose-50', 
    accent: 'bg-rose-500', 
    text: 'text-rose-600', 
    border: 'border-rose-200',
    hoverBorder: 'hover:border-rose-500',
    groupHoverBg: 'group-hover:bg-rose-500'
  },
  'passive-aggressive': { 
    bg: 'bg-amber-50', 
    accent: 'bg-amber-500', 
    text: 'text-amber-600', 
    border: 'border-amber-200',
    hoverBorder: 'hover:border-amber-500',
    groupHoverBg: 'group-hover:bg-amber-500'
  },
  assertive: { 
    bg: 'bg-emerald-50', 
    accent: 'bg-emerald-500', 
    text: 'text-emerald-600', 
    border: 'border-emerald-200',
    hoverBorder: 'hover:border-emerald-500',
    groupHoverBg: 'group-hover:bg-emerald-500'
  }
};

const MAIL_SCENARIOS: Record<string, Scenario> = {
  angry_client: {
    id: 'angry_client',
    title: 'Cliente Furioso',
    description: 'Un cliente importante ha ricevuto un ordine errato e minaccia di disdire il contratto via email.',
    icon: <Mail className="w-8 h-8" />,
    metrics: [
      { name: 'Soddisfazione', value: 2, max: 10, color: 'bg-rose-500' },
      { name: 'Professionalità', value: 5, max: 10, color: 'bg-indigo-500' }
    ],
    objective: 'Raggiungi Soddisfazione 8.',
    personalObjective: 'Risolvi il problema logistico senza offrire rimborsi eccessivi, mantenendo un tono calmo e risolutivo.',
    technique: {
      name: 'Empatia Professionale',
      description: 'Riconoscere il disagio del cliente senza scusarsi eccessivamente o promettere l\'impossibile.',
      example: '"Capisco perfettamente la sua frustrazione per l\'errore nella consegna. Stiamo già lavorando per spedire i prodotti corretti entro oggi."'
    },
    intro: 'Oggetto: RECLAMO FORMALE - Ordine #8821\n\nSpettabile Assistenza,\n\nSono assolutamente indignato. Ho ricevuto metà della merce ordinata e quella arrivata è danneggiata. Se non risolvete entro 24 ore, chiuderò ogni rapporto con voi.\n\nIn attesa di un riscontro immediato,\n\nMarco Rossi',
    victoryCondition: 'Soddisfazione >= 8',
    defeatCondition: 'Soddisfazione <= 0',
    difficulty: 3,
    variants: [
      { personality: 'aggressive', difficulty: 5, intro: 'Oggetto: RECLAMO FORMALE - Ordine #8821\n\nSenti, non so chi stia gestendo le spedizioni lì, ma è un incompetente. Ho ricevuto merce rotta e incompleta. O risolvete ORA o vi faccio causa. Avete 24 ore.'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Oggetto: RECLAMO FORMALE - Ordine #8821\n\nComplimenti per l\'efficienza. Immagino che spedire la merce corretta fosse troppo complicato per voi. Non preoccupatevi, aspetterò... come sempre.'},
      { personality: 'assertive', difficulty: 3, intro: 'Oggetto: RECLAMO FORMALE - Ordine #8821\n\nBuongiorno, vi scrivo per segnalare un grave disservizio nell\'ordine #8821. La merce è incompleta e parzialmente danneggiata. Attendo una vostra proposta di risoluzione entro domani.'}
    ]
  },
  late_report: {
    id: 'late_report',
    title: 'Report in Ritardo',
    description: 'Il tuo superiore ti chiede spiegazioni via email per un report mensile non ancora consegnato.',
    icon: <FileWarning className="w-8 h-8" />,
    metrics: [
      { name: 'Fiducia', value: 4, max: 10, color: 'bg-emerald-500' },
      { name: 'Pressione', value: 6, max: 10, color: 'bg-orange-500' }
    ],
    objective: 'Raggiungi Fiducia 8.',
    personalObjective: 'Spiega il ritardo focalizzandoti sulla qualità dei dati raccolti, senza sembrare disorganizzato.',
    technique: {
      name: 'Trasparenza Proattiva',
      description: 'Comunicare un ritardo prima che diventi un problema critico, proponendo una nuova scadenza realistica.',
      example: '"Il report è in fase di finalizzazione. Ho preferito approfondire l\'analisi dei dati di vendita per fornirle un quadro più accurato. Sarà sulla sua scrivania entro domani mattina."'
    },
    intro: 'Oggetto: Stato Report Mensile\n\nCiao,\n\nNon ho ancora ricevuto il report che doveva essere pronto ieri. Ci sono problemi? Ho bisogno di quei dati per la riunione di domani pomeriggio.\n\nFammi sapere,\n\nLaura (Direzione)',
    victoryCondition: 'Fiducia >= 8',
    defeatCondition: 'Pressione >= 10',
    difficulty: 2,
    variants: [
      { personality: 'aggressive', difficulty: 4, intro: 'Oggetto: Stato Report Mensile\n\nAllora? Dov\'è il report? Spero tu abbia una buona scusa perché non tollero ritardi ingiustificati.'},
      { personality: 'passive-aggressive', difficulty: 3, intro: 'Oggetto: Stato Report Mensile\n\nImmagino che tu sia troppo occupato per inviarmi il report puntualmente. Spero che almeno il risultato finale valga l\'attesa.'},
      { personality: 'assertive', difficulty: 2, intro: 'Oggetto: Stato Report Mensile\n\nCiao, ho notato che il report mensile non è ancora arrivato. Potresti aggiornarmi sullo stato di avanzamento? Ne ho bisogno per domani.'}
    ]
  }
};

const SCENARIOS: Record<string, Scenario> = {
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
    personalObjective: 'Riconnetti con Marco senza scusarti per aver lavorato sodo: fagli capire che il tuo impegno è anche per il vostro futuro.',
    technique: {
      name: 'Ascolto Attivo',
      description: 'Dimostrare di aver capito il messaggio e l\'emozione dell\'altro senza giudicare.',
      example: '"Mi sembra di capire che ti senti trascurato perché ultimamente sono molto preso dal lavoro, è così?"'
    },
    intro: 'Marco cammina nervosamente in soggiorno. "Proprio non capisco. Contavo su di te. Ti importa almeno dei nostri piani?"',
    victoryCondition: 'Rabbia == 0',
    defeatCondition: 'Rispetto == 0',
    difficulty: 2,
    variants: [
      { personality: 'passive', difficulty: 2, intro: 'Marco sospira, guardando il pavimento. "Ah... ciao. Non importa, davvero. Immagino che tu avessi cose più importanti da fare che vedermi..."'},
      { personality: 'aggressive', difficulty: 4, intro: 'Marco sbatte la porta. "ANCORA?! Sei incredibile! Mi hai lasciato ad aspettare per due ore! Ti rendi conto di quanto sei egoista?!"'},
      { personality: 'passive-aggressive', difficulty: 3, intro: 'Marco sorride forzatamente mentre pulisce freneticamente un bicchiere già pulito. "Oh, non preoccuparti per me. Sono abituato a essere l\'ultima delle tue priorità. Davvero, vai pure a lavorare."'},
      { personality: 'assertive', difficulty: 2, intro: 'Marco ti guarda con calma ma con delusione. "Ehi, avevamo un accordo per stasera. Mi sento un po\' messo da parte quando il lavoro prende sempre il sopravvento sui nostri piani. Possiamo parlarne?"'}
    ]
  },
  roommate: {
    id: 'roommate',
    title: 'Disputa con Sara',
    description: 'Sara è frustrata per le faccende domestiche.',
    icon: <DoorOpen className="w-8 h-8" />,
    metrics: [
      { name: 'Tensione', value: 5, max: 10, color: 'bg-orange-500' },
      { name: 'Collaborazione', value: 4, max: 10, color: 'bg-sky-500' },
      { name: 'Soddisfazione Personale', value: 5, max: 10, color: 'bg-emerald-500' }
    ],
    objective: 'Raggiungi Collaborazione 8.',
    personalObjective: 'Ottieni che Sara si occupi della cucina senza dover fare tu il bagno, mantenendo un clima sereno.',
    technique: {
      name: 'Messaggi in Prima Persona (I-Messages)',
      description: 'Esprimere i propri sentimenti e bisogni senza attaccare l\'altro.',
      example: '"Mi sento sopraffatto quando vedo la cucina in disordine, avrei bisogno di aiuto per gestirla meglio."'
    },
    intro: 'Sara incrocia le braccia in cucina. "Ancora piatti sporchi? Non è possibile che io debba sempre pulire tutto!"',
    victoryCondition: 'Collaborazione >= 8 && Soddisfazione Personale >= 5',
    defeatCondition: 'Tensione >= 10',
    difficulty: 3,
    variants: [
      { personality: 'passive', difficulty: 2, intro: 'Sara inizia a lavare i piatti in silenzio, con le spalle curve. "Non fa niente... lo faccio io. Come sempre. Non voglio disturbarti..."'},
      { personality: 'aggressive', difficulty: 5, intro: 'Sara urla dal corridoio. "BASTA! SONO STUFA DI FARE LA TUA CAMERIERA! O PULISCI QUESTA CUCINA ORA O ME NE VADO!"'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Sara lascia un bigliettino sul frigo: *Spero che i piatti si lavino da soli, visto che io non esisto.* Ti guarda e sospira pesantemente.'},
      { personality: 'assertive', difficulty: 3, intro: 'Sara ti chiama in cucina. "Senti, ho notato che i piatti sono ancora lì. Avevamo concordato dei turni e mi sento frustrata quando non vengono rispettati. Come possiamo risolvere?"'}
    ]
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
    objective: 'Raggiungi Fiducia 10.',
    personalObjective: 'Difendi la tua posizione sul ritardo del progetto spiegando i problemi tecnici reali, senza dare la colpa ai colleghi.',
    technique: {
      name: 'Riformulazione (Reframing)',
      description: 'Presentare un problema o un errore sotto una luce diversa, focalizzandosi sulle soluzioni o sugli apprendimenti.',
      example: '"Il ritardo non è una mancanza di impegno, ma una scelta consapevole per garantire la stabilità tecnica del prodotto finale."'
    },
    intro: 'Sei seduto in un ufficio sterile. Holly Roberts delle Risorse Umane si sistema gli occhiali. "Grazie per essere venuto. Abbiamo alcune preoccupazioni riguardo alla tabella di marcia del progetto..."',
    victoryCondition: 'Fiducia >= 10',
    defeatCondition: 'Sospetto >= 10',
    difficulty: 3,
    variants: [
      { personality: 'assertive', difficulty: 3, intro: 'Holly ti guarda con professionalità. "Ho analizzato i report. Siamo in ritardo. Vorrei capire da te quali sono stati gli ostacoli e come intendi recuperare."' },
      { personality: 'aggressive', difficulty: 5, intro: 'Holly sbatte una cartella sulla scrivania. "Senti, non ho tempo per le scuse. I numeri parlano chiaro: siete in ritardo. Cosa hai intenzione di fare prima che io debba prendere provvedimenti seri?"'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Holly ti guarda con un sorriso gelido. "È interessante vedere come alcuni riescano a mantenere la calma nonostante il fallimento imminente del progetto. Ammiro la tua... rilassatezza."'}
    ]
  },
  interview: {
    id: 'interview',
    title: 'Colloquio con Davide',
    description: 'Davide Conti, senior hiring manager, ti sta valutando.',
    icon: <Briefcase className="w-8 h-8" />,
    metrics: [
      { name: 'Interesse', value: 3, max: 10, color: 'bg-emerald-500' },
      { name: 'Dubbio', value: 5, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Interesse 10.',
    personalObjective: 'Dimostra di essere il candidato ideale senza sembrare arrogante.',
    technique: {
      name: 'STAR Method',
      description: 'Rispondere alle domande comportamentali descrivendo Situazione, Task, Azione e Risultato.',
      example: '"In quella situazione, il mio compito era... ho agito facendo... e il risultato è stato..."'
    },
    intro: 'Davide chiude il tuo CV. "Bene, vedo che hai esperienza. Ma dimmi, perché dovremmo scegliere proprio te?"',
    victoryCondition: 'Interesse >= 10',
    defeatCondition: 'Dubbio >= 10',
    difficulty: 3,
    variants: [
      { personality: 'assertive', difficulty: 3, intro: 'Davide ti guarda con attenzione. "Il tuo profilo è interessante. Raccontami di una sfida tecnica che hai superato."' },
      { personality: 'aggressive', difficulty: 5, intro: 'Davide incrocia le braccia. "Senti, ho visto decine di candidati oggi. Dimmi qualcosa che non sia nel tuo CV e che mi faccia perdere meno tempo."' },
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Davide sorride in modo strano. "Ah, un altro esperto di React. Immagino che tu sia... molto orgoglioso del tuo lavoro, vero?"' }
    ]
  },
  client: {
    id: 'client',
    title: 'Negoziazione con Elena',
    description: 'Elena Rossi è una cliente scettica.',
    icon: <UserPlus className="w-8 h-8" />,
    metrics: [
      { name: 'Fiducia', value: 4, max: 10, color: 'bg-sky-500' },
      { name: 'Sensibilità Prezzo', value: 6, max: 10, color: 'bg-amber-500' },
      { name: 'Margine Profitto', value: 5, max: 10, color: 'bg-emerald-500' }
    ],
    objective: 'Raggiungi Fiducia 10 e Margine Profitto >= 6.',
    personalObjective: 'Chiudi l\'accordo senza concedere uno sconto eccessivo.',
    technique: {
      name: 'Ancoraggio (Anchoring)',
      description: 'Stabilire un punto di riferimento iniziale per influenzare la percezione del valore.',
      example: '"Il valore di mercato per questo servizio è solitamente X, ma per la nostra partnership possiamo partire da Y."'
    },
    intro: 'Elena sfoglia la tua proposta. "Il servizio sembra buono, ma il prezzo è decisamente fuori dal nostro budget attuale."',
    victoryCondition: 'Fiducia >= 10 && Margine Profitto >= 6',
    defeatCondition: 'Sensibilità Prezzo >= 10',
    difficulty: 4,
    variants: [
      { personality: 'passive', difficulty: 3, intro: 'Elena sembra quasi dispiaciuta. "Mi piacerebbe davvero lavorare con voi, ma... i miei superiori dicono che costa troppo. Non so cosa fare..."'},
      { personality: 'aggressive', difficulty: 5, intro: 'Elena chiude il laptop con forza. "Questo prezzo è un insulto! O scendete del 30% o questa conversazione finisce qui!"'},
      { personality: 'assertive', difficulty: 4, intro: 'Elena ti guarda negli occhi. "Apprezzo la qualità del vostro lavoro, ma dobbiamo trovare un punto d\'incontro che sia sostenibile per noi. Cosa proponi?"'}
    ]
  },
  partner: {
    id: 'partner',
    title: 'Conflitto con Alessandro',
    description: 'Alessandro è ferito per promesse non mantenute.',
    icon: <Heart className="w-8 h-8" />,
    metrics: [
      { name: 'Ferita', value: 7, max: 10, color: 'bg-rose-500' },
      { name: 'Comprensione', value: 3, max: 10, color: 'bg-sky-500' }
    ],
    objective: 'Raggiungi Comprensione 10.',
    personalObjective: 'Riparare la relazione assumendoti le tue responsabilità senza metterti sulla difensiva.',
    technique: {
      name: 'Validazione Emotiva',
      description: 'Riconoscere e accettare i sentimenti dell\'altro come validi, anche se non si è d\'accordo con i fatti.',
      example: '"Capisco che tu ti senta ferito e deluso, e hai ragione a sentirti così dopo quello che è successo."'
    },
    intro: 'Alessandro guarda fuori dalla finestra. "Avevi promesso che saresti venuto. Di nuovo. Non so più se posso fidarmi delle tue parole."',
    victoryCondition: 'Comprensione >= 10',
    defeatCondition: 'Ferita >= 10',
    difficulty: 3,
    variants: [
      { personality: 'passive', difficulty: 2, intro: 'Alessandro sospira. "Va bene... non importa. Mi abituerò. Non voglio litigare ancora..."'},
      { personality: 'aggressive', difficulty: 5, intro: 'Alessandro si gira furioso. "SEI UN BUGIARDO! Non ti importa nulla di me, solo del tuo maledetto lavoro!"'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Alessandro sorride amaramente. "Oh, non preoccuparti. Ho passato una serata fantastica da solo. Grazie per avermi ricordato quanto conto per te."'},
      { personality: 'assertive', difficulty: 3, intro: 'Alessandro si siede di fronte a te. "Mi sento molto ferito quando non mantieni le promesse. Ho bisogno di sapere se possiamo trovare un modo per far funzionare le cose."'}
    ]
  },
  customer: {
    id: 'customer',
    title: 'La Signora Bianchi',
    description: 'La signora Bianchi è una cliente molto arrabbiata.',
    icon: <AlertCircle className="w-8 h-8" />,
    metrics: [
      { name: 'Frustrazione', value: 8, max: 10, color: 'bg-orange-500' },
      { name: 'Risoluzione', value: 2, max: 10, color: 'bg-emerald-500' }
    ],
    objective: 'Raggiungi Risoluzione 10.',
    personalObjective: 'Calma la cliente e risolvi il problema tecnico senza violare la policy aziendale.',
    technique: {
      name: 'Tecnica del Disco Rotto',
      description: 'Ripetere con calma la propria posizione o soluzione senza farsi trascinare in discussioni laterali.',
      example: '"Capisco il suo disagio, e come le dicevo, posso offrirle un rimborso parziale o una sostituzione immediata."'
    },
    intro: 'La signora Bianchi sbatte il prodotto sul bancone. "È la terza volta che si rompe! Voglio parlare con il responsabile ORA!"',
    victoryCondition: 'Risoluzione >= 10',
    defeatCondition: 'Frustrazione >= 10',
    difficulty: 3,
    variants: [
      { personality: 'aggressive', difficulty: 4, intro: 'La signora Bianchi urla così forte che tutti si girano. "QUESTO NEGOZIO È UNA TRUFFA! Voglio i miei soldi indietro e voglio che lei venga licenziato!"'},
      { personality: 'passive-aggressive', difficulty: 3, intro: 'La signora Bianchi ti guarda con sufficienza. "Immagino che la formazione dei dipendenti qui sia... opzionale. Non mi sorprende che nulla funzioni."'},
      { personality: 'assertive', difficulty: 3, intro: 'La signora Bianchi respira profondamente. "Senta, sono molto delusa da questo acquisto. È difettoso per la terza volta. Cosa intende fare per risolvere definitivamente?"'}
    ]
  },
  parent: {
    id: 'parent',
    title: 'Confronto con Linda',
    description: 'Linda è preoccupata per le regole di casa.',
    icon: <Baby className="w-8 h-8" />,
    metrics: [
      { name: 'Tensione', value: 6, max: 10, color: 'bg-orange-500' },
      { name: 'Rispetto Reciproco', value: 4, max: 10, color: 'bg-sky-500' }
    ],
    objective: 'Raggiungi Rispetto Reciproco 10.',
    personalObjective: 'Negozia un nuovo orario di rientro dimostrando maturità e responsabilità.',
    technique: {
      name: 'Negoziazione Basata sugli Interessi',
      description: 'Focalizzarsi sui bisogni sottostanti (sicurezza, autonomia) invece che sulle posizioni rigide.',
      example: '"Capisco che la tua preoccupazione sia la mia sicurezza. Se ti mandassi un messaggio ogni ora, potrei restare fuori fino a mezzanotte?"'
    },
    intro: 'Tua madre Linda ti aspetta in cucina. "Sei tornato tardi di nuovo. Questa casa non è un albergo. Dobbiamo rivedere le regole."',
    victoryCondition: 'Rispetto Reciproco >= 10',
    defeatCondition: 'Tensione >= 10',
    difficulty: 3,
    variants: [
      { personality: 'passive', difficulty: 2, intro: 'Linda scuote la testa tristemente. "Non so più cosa dirti... fai come vuoi. Tanto non mi ascolti mai..."'},
      { personality: 'aggressive', difficulty: 5, intro: 'Linda sbatte la mano sul tavolo. "DA DOMANI NON ESCI PIÙ! Hai finito di prenderti gioco di me!"'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Linda sorride amaramente. "Oh, non preoccuparti per me. Sono rimasta sveglia tutta la notte a preoccuparmi, ma immino che il tuo divertimento sia più importante della mia salute."'},
      { personality: 'assertive', difficulty: 3, intro: 'Linda ti fa cenno di sederti. "Sono preoccupata quando non rispetti gli orari. Dobbiamo trovare un accordo che mi faccia stare tranquilla e ti dia la tua libertà."'}
    ]
  },
  team: {
    id: 'team',
    title: 'Tensione con Giacomo',
    description: 'Giacomo si sente sminuito nel team.',
    icon: <Users className="w-8 h-8" />,
    metrics: [
      { name: 'Risentimento', value: 6, max: 10, color: 'bg-orange-500' },
      { name: 'Collaborazione', value: 4, max: 10, color: 'bg-sky-500' }
    ],
    objective: 'Raggiungi Collaborazione 10.',
    personalObjective: 'Risolvi il conflitto con Giacomo riconoscendo il suo contributo senza sminuire il tuo ruolo di leader.',
    technique: {
      name: 'Feedback Costruttivo (Modello SBI)',
      description: 'Descrivere la Situazione, il Comportamento e l\'Impatto per dare feedback oggettivi.',
      example: '"Durante la riunione (S), quando hai interrotto il mio discorso (B), mi sono sentito poco supportato davanti al cliente (I)."'
    },
    intro: 'Giacomo ti ferma alla macchinetta del caffè. "Senti, nell\'ultima riunione hai preso tutto il merito del mio lavoro. Non mi sta bene."',
    victoryCondition: 'Collaborazione >= 10',
    defeatCondition: 'Risentimento >= 10',
    difficulty: 3,
    variants: [
      { personality: 'passive', difficulty: 2, intro: 'Giacomo guarda il caffè. "No, niente... lascia stare. Non voglio creare problemi. Continua pure così..."'},
      { personality: 'aggressive', difficulty: 5, intro: 'Giacomo ti punta il dito contro. "SEI UN LADRO DI IDEE! Non farò più nulla per questo team finché non mi darai il credito che merito!"'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Giacomo sorride falsamente. "Ottima presentazione ieri. È incredibile come tu riesca a far sembrare tue le idee degli altri. Un vero talento."'},
      { personality: 'assertive', difficulty: 3, intro: 'Giacomo ti guarda con fermezza. "Mi sono sentito ignorato durante la presentazione. Vorrei che in futuro il mio contributo venisse menzionato esplicitamente."'}
    ]
  },
  rent: {
    id: 'rent',
    title: 'Negoziazione Affitto',
    description: 'Il proprietario vuole aumentare l\'affitto del 20%.',
    icon: <Home className="w-8 h-8" />,
    metrics: [
      { name: 'Flessibilità', value: 3, max: 10, color: 'bg-sky-500' },
      { name: 'Fermezza', value: 7, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Flessibilità 8.',
    personalObjective: 'Evita l\'aumento o riducilo drasticamente facendo leva sulla tua affidabilità come inquilino.',
    technique: {
      name: 'Leva della Reciprocità',
      description: 'Offrire qualcosa in cambio (es. contratto più lungo) per ottenere una concessione.',
      example: '"Capisco la sua necessità, ma se mantenessimo il canone attuale, sarei disposto a firmare per altri 4 anni immediatamente."'
    },
    intro: 'Il signor Moretti ti chiama. "Senta, i costi sono aumentati per tutti. Da mese prossimo l\'affitto sale di 150 euro. Prendere o lasciare."',
    victoryCondition: 'Flessibilità >= 8',
    defeatCondition: 'Fermezza <= 2',
    difficulty: 4,
    variants: [
      { personality: 'aggressive', difficulty: 5, intro: 'Moretti urla al telefono. "NON MI INTERESSA! Se non le va bene, ci sono altre dieci persone pronte a entrare domani! Decida subito!"'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Moretti sospira. "Certo, capisco che per lei sia difficile. Ma immagino che preferisca pagare un po\' di più piuttosto che dover traslocare in questo mercato, no?"'},
      { personality: 'assertive', difficulty: 4, intro: 'Moretti ti riceve con calma. "Ho analizzato i prezzi della zona. Un aumento è necessario. Parliamone, ma la mia posizione è solida."'}
    ]
  },
  apology: {
    id: 'apology',
    title: 'Scuse al Partner',
    description: 'Hai dimenticato un anniversario importante.',
    icon: <HeartOff className="w-8 h-8" />,
    metrics: [
      { name: 'Sincerità', value: 2, max: 10, color: 'bg-emerald-500' },
      { name: 'Rancore', value: 8, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Riduci il Rancore a 0.',
    personalObjective: 'Fatti perdonare senza giustificarti troppo, dimostrando che hai capito l\'errore.',
    technique: {
      name: 'Le 3 R delle Scuse',
      description: 'Rimpianto, Responsabilità e Rimedio.',
      example: '"Mi dispiace tantissimo (Rimpianto), ho sbagliato a non segnarlo in agenda (Responsabilità). Voglio rimediare portandoti in quel posto che ti piace tanto domani (Rimedio)."'
    },
    intro: 'La tua partner ti guarda con gli occhi lucidi. "Non posso credere che te ne sia dimenticato di nuovo. Forse non è così importante per te come lo è per me."',
    victoryCondition: 'Rancore == 0',
    defeatCondition: 'Sincerità <= 0',
    difficulty: 3,
    variants: [
      { personality: 'passive', difficulty: 2, intro: 'Lei scuote la testa. "Non fa niente... davvero. Ormai ci sono abituata. Vai pure a dormire..."'},
      { personality: 'aggressive', difficulty: 5, intro: 'Lei urla furiosa. "SEI UN EGOISTA! Pensi solo a te stesso! Non voglio vederti per il resto della settimana!"'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Lei sorride amaramente. "Oh, ma figurati. Ho passato una serata deliziosa ad aspettarti. Mi ha dato il tempo di riflettere su molte cose."'},
      { personality: 'assertive', difficulty: 3, intro: 'Lei ti guarda con serietà. "Mi sento molto delusa. Questo anniversario era importante per me. Vorrei capire perché è successo di nuovo."'}
    ]
  },
  exam: {
    id: 'exam',
    title: 'Esame Orale Teso',
    description: 'Il professore è convinto che tu stia barando.',
    icon: <GraduationCap className="w-8 h-8" />,
    metrics: [
      { name: 'Credibilità', value: 4, max: 10, color: 'bg-sky-500' },
      { name: 'Sospetto', value: 6, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Credibilità 10.',
    personalObjective: 'Dimostra la tua onestà e la tua preparazione senza mancare di rispetto al docente.',
    technique: {
      name: 'Appello alla Logica',
      description: 'Usare fatti e ragionamenti razionali per smontare un\'accusa infondata.',
      example: '"Professore, se avessi barato non saprei spiegarle il processo logico che mi ha portato a questa conclusione, che è..."'
    },
    intro: 'Il Professor Bianchi abbassa i fogli. "Questo compito è troppo simile a quello del suo collega. Mi dica la verità, avete collaborato?"',
    victoryCondition: 'Credibilità >= 10',
    defeatCondition: 'Sospetto >= 10',
    difficulty: 4,
    variants: [
      { personality: 'aggressive', difficulty: 5, intro: 'Bianchi sbatte il pugno sul tavolo. "NON MI PRENDA IN GIRO! Lo so che avete copiato! Se non confessa ora, vi boccio entrambi!"'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Bianchi sorride sornione. "È incredibile come abbiate avuto la stessa identica... ispirazione. Una coincidenza davvero... miracolosa, non trova?"'},
      { personality: 'assertive', difficulty: 4, intro: 'Bianchi ti guarda fisso negli occhi. "L\'evidenza suggerisce un aiuto esterno. Mi convinca del contrario, ora."'}
    ]
  },
  neighbor: {
    id: 'neighbor',
    title: 'Disputa tra Vicini',
    description: 'Rumori molesti a tarda notte.',
    icon: <AlertCircle className="w-8 h-8" />,
    metrics: [
      { name: 'Pazienza', value: 5, max: 10, color: 'bg-sky-500' },
      { name: 'Ostilità', value: 5, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Riduci l\'Ostilità <= 2.',
    personalObjective: 'Ottieni il silenzio senza rovinare definitivamente i rapporti di vicinato.',
    technique: {
      name: 'Ricerca di un Terreno Comune',
      description: 'Identificare un obiettivo condiviso (es. la tranquillità del palazzo) per risolvere il conflitto.',
      example: '"Entrambi vogliamo vivere in un ambiente tranquillo. Forse potremmo concordare un orario limite per la musica?"'
    },
    intro: 'Il vicino apre la porta con la musica a palla. "Sì? Che c\'è? Sto solo festeggiando un po\', non si può più fare niente in questa casa?"',
    victoryCondition: 'Ostilità <= 2',
    defeatCondition: 'Pazienza <= 0',
    difficulty: 3,
    variants: [
      { personality: 'passive', difficulty: 2, intro: 'Il vicino abbassa un po\' lo sguardo. "Oh... scusa. Non pensavo si sentisse... va bene, ora spengo tutto..."'},
      { personality: 'aggressive', difficulty: 5, intro: 'Il vicino ti urla in faccia. "TORNA IN CASA TUA! Faccio quello che voglio a casa mia! Chiama pure la polizia se hai il coraggio!"'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Il vicino sorride con sarcasmo. "Oh, mi scusi tanto, Sua Maestà. Non sapevo che il palazzo intero dovesse andare a letto alle nove per colpa sua."'},
      { personality: 'assertive', difficulty: 3, intro: 'Il vicino incrocia le braccia. "Senti, è sabato sera. Sto solo passando del tempo con gli amici. Qual è il problema esattamente?"'}
    ]
  },
  customer_service: {
    id: 'customer_service',
    title: 'Cliente in Negozio',
    description: 'Un cliente vuole restituire un prodotto usato.',
    icon: <ShoppingBag className="w-8 h-8" />,
    metrics: [
      { name: 'Soddisfazione', value: 4, max: 10, color: 'bg-sky-500' },
      { name: 'Policy Aziendale', value: 8, max: 10, color: 'bg-amber-500' }
    ],
    objective: 'Raggiungi Soddisfazione 8.',
    personalObjective: 'Gestisci il cliente difficile senza infrangere le regole del negozio sul reso.',
    technique: {
      name: 'Empatia Strategica',
      description: 'Mostrare comprensione per il problema del cliente pur mantenendo i limiti professionali.',
      example: '"Capisco perfettamente la sua frustrazione, e anche se non posso accettare il reso di un prodotto usato, posso offrirle uno sconto sul prossimo acquisto."'
    },
    intro: 'Il cliente ti porge una scatola aperta. "L\'ho usato una volta e non mi piace. Voglio il rimborso completo sulla carta."',
    victoryCondition: 'Soddisfazione >= 8',
    defeatCondition: 'Policy Aziendale <= 2',
    difficulty: 3,
    variants: [
      { personality: 'aggressive', difficulty: 5, intro: 'Il cliente sbatte la scatola sul bancone. "NON MI INTERESSANO LE VOSTRE REGOLE! Voglio i miei soldi ora o faccio un casino che non finisce più!"'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Il cliente ti guarda con aria di sfida. "Immagino che rubare i soldi alla gente onesta sia la vostra missione aziendale. Complimenti."'},
      { personality: 'assertive', difficulty: 3, intro: 'Il cliente ti guarda con calma. "Il prodotto non rispecchia le mie aspettative. Mi sembra giusto ricevere un rimborso, non crede?"'}
    ]
  },
  inheritance: {
    id: 'inheritance',
    title: 'Eredità Difficile',
    description: 'Una discussione familiare su beni affettivi.',
    icon: <DollarSign className="w-8 h-8" />,
    metrics: [
      { name: 'Armonia', value: 4, max: 10, color: 'bg-sky-500' },
      { name: 'Avidità', value: 6, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Armonia 10.',
    personalObjective: 'Risolvi la disputa sui beni di famiglia senza distruggere i rapporti con i tuoi parenti.',
    technique: {
      name: 'Focus sui Valori Condivisi',
      description: 'Spostare la discussione dagli oggetti materiali ai valori e ai ricordi che uniscono la famiglia.',
      example: '"Quello che conta davvero non è chi prende l\'orologio del nonno, ma mantenere vivo il suo ricordo restando uniti."'
    },
    intro: 'Tuo cugino guarda i gioielli della nonna. "Penso che questi spettino a me, visto che sono stato io ad assisterla negli ultimi mesi."',
    victoryCondition: 'Armonia >= 10',
    defeatCondition: 'Avidità >= 10',
    difficulty: 4,
    variants: [
      { personality: 'passive', difficulty: 3, intro: 'Tuo cugino abbassa lo sguardo. "Se li vuoi tu... prendili pure. Non voglio litigare per queste cose... anche se mi farebbero piacere..."'},
      { personality: 'aggressive', difficulty: 5, intro: 'Tuo cugino afferra la scatola. "QUESTI SONO MIEI! Voi non vi siete mai fatti vedere! Non avete alcun diritto!"'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Tuo cugino sorride con veleno. "È bello vedere come l\'affetto per la nonna si trasformi subito in interesse per il suo oro. Siete davvero coerenti."'},
      { personality: 'assertive', difficulty: 4, intro: 'Tuo cugino ti guarda seriamente. "Dobbiamo trovare un modo equo per dividere queste cose. Io ho le mie ragioni, tu le tue. Parliamone civilmente."'}
    ]
  },
  breakup: {
    id: 'breakup',
    title: 'Rottura Civile',
    description: 'Chiudere una relazione senza distruggere i ponti.',
    icon: <HeartOff className="w-8 h-8" />,
    metrics: [
      { name: 'Rispetto', value: 5, max: 10, color: 'bg-sky-500' },
      { name: 'Dolore', value: 7, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Rispetto 10.',
    personalObjective: 'Comunica la tua decisione di lasciarvi in modo chiaro e onesto, riducendo al minimo il dolore inutile.',
    technique: {
      name: 'Onestà Radicale con Gentilezza',
      description: 'Dire la verità senza filtri ma usando un linguaggio che non miri a ferire l\'altra persona.',
      example: '"Ti voglio bene, ma sento che non siamo più felici insieme e che le nostre strade si stanno dividendo. È meglio per entrambi chiudere ora."'
    },
    intro: 'Siete seduti al parco. Lei sembra intuire qualcosa. "Sei molto silenzioso stasera. C\'è qualcosa che devi dirmi?"',
    victoryCondition: 'Rispetto >= 10',
    defeatCondition: 'Dolore >= 10',
    difficulty: 4,
    variants: [
      { personality: 'passive', difficulty: 3, intro: 'Lei ti guarda con ansia. "Se vuoi lasciarmi... dillo e basta. Non lasciarmi qui a indovinare... lo accetterò, come sempre..."'},
      { personality: 'aggressive', difficulty: 5, intro: 'Lei scatta in piedi. "NON CI PROVARE! Non puoi mollarmi così dopo tutto quello che ho fatto per te! Sei un vigliacco!"'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Lei sorride amaramente. "Oh, capisco. Hai trovato qualcuno di meglio, immagino. Non mi stupisce affatto."'},
      { personality: 'assertive', difficulty: 4, intro: 'Lei ti prende la mano. "Sento che c\'è tensione tra noi. Vorrei che fossimo onesti l\'uno con l\'altra, qualunque cosa sia."'}
    ]
  },
  vacation: {
    id: 'vacation',
    title: 'Richiesta di Ferie',
    description: 'Hai bisogno di ferie in un periodo critico per il team.',
    icon: <Palmtree className="w-8 h-8" />,
    metrics: [
      { name: 'Empatia', value: 4, max: 10, color: 'bg-sky-500' },
      { name: 'Urgenza', value: 6, max: 10, color: 'bg-amber-500' }
    ],
    objective: 'Raggiungi Empatia 8.',
    personalObjective: 'Ottieni l\'approvazione per le tue ferie dimostrando che il lavoro non ne risentirà.',
    technique: {
      name: 'Soluzione Pre-Confezionata',
      description: 'Presentare una richiesta insieme a un piano già pronto per gestire le conseguenze.',
      example: '"Avrei bisogno di quei tre giorni, ma ho già parlato con Marco che coprirà le mie urgenze e ho anticipato tutto il lavoro critico."'
    },
    intro: 'Il tuo manager guarda il calendario. "Ferie la prossima settimana? Ma siamo nel pieno del rilascio! È il momento peggiore possibile."',
    victoryCondition: 'Empatia >= 8',
    defeatCondition: 'Urgenza >= 10',
    difficulty: 3,
    variants: [
      { personality: 'aggressive', difficulty: 5, intro: 'Il manager sbatte il mouse. "MA SEI IMPAZZITO?! Qui stiamo affogando e tu pensi alla spiaggia? Scordatelo!"'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Il manager sospira pesantemente. "Certo, vai pure. Noi resteremo qui a lavorare anche per te. Non preoccuparti, ci sacrificheremo come sempre."'},
      { personality: 'assertive', difficulty: 3, intro: 'Il manager ti guarda con serietà. "Capisco che tu ne abbia bisogno, ma spiegami come pensi di gestire le tue responsabilità in tua assenza."'}
    ]
  },
  peer_feedback: {
    id: 'peer_feedback',
    title: 'Feedback a un Collega',
    description: 'Devi dire a un collega che il suo lavoro sta rallentando il team.',
    icon: <UserCheck className="w-8 h-8" />,
    metrics: [
      { name: 'Chiarezza', value: 4, max: 10, color: 'bg-sky-500' },
      { name: 'Difensiva', value: 6, max: 10, color: 'bg-rose-500' }
    ],
    objective: 'Raggiungi Chiarezza 10.',
    personalObjective: 'Dai il feedback in modo che venga accettato come un aiuto e non come un attacco personale.',
    technique: {
      name: 'Metodo Sandwich',
      description: 'Inserire un feedback negativo tra due commenti positivi per ammorbidire l\'impatto.',
      example: '"Apprezzo molto la tua creatività, tuttavia ho notato che i tempi di consegna si sono allungati, ma so che con la tua precisione risolverai subito."'
    },
    intro: 'Sei a pranzo con Luca. "Allora, come sta andando il progetto secondo te? Io mi sento molto soddisfatto del mio lavoro."',
    victoryCondition: 'Chiarezza >= 10',
    defeatCondition: 'Difensiva >= 10',
    difficulty: 3,
    variants: [
      { personality: 'passive', difficulty: 2, intro: 'Luca abbassa lo sguardo. "Oh... pensavo di fare bene. Se vuoi che cambi qualcosa... dimmelo. Farò quello che vuoi..."'},
      { personality: 'aggressive', difficulty: 5, intro: 'Luca si irrigidisce. "Chi sei tu per darmi ordini? Pensa al tuo lavoro che al mio ci penso io!"'},
      { personality: 'passive-aggressive', difficulty: 4, intro: 'Luca sorride con sarcasmo. "Ah, ecco che arriva il professore. Immagino che tu sia perfetto, vero? Grazie per la lezione di vita."'},
      { personality: 'assertive', difficulty: 3, intro: 'Luca ti guarda con interesse. "Apprezzo la tua onestà. Dimmi pure cosa hai notato, sono sempre aperto a migliorare."'}
    ]
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
    personalObjective: 'Ottieni l\'aumento basandoti sui dati dei tuoi successi recenti, non solo sulla tua anzianità in azienda.',
    technique: {
      name: 'Comunicazione Basata sui Risultati',
      description: 'Supportare le proprie richieste con dati oggettivi, KPI e impatto sul business.',
      example: '"Nell\'ultimo anno ho aumentato la produttività del team del 15% e ridotto i costi operativi. Credo che questo giustifichi una revisione del mio inquadramento."'
    },
    intro: 'Il tuo capo, il Dott. Rossi, ti riceve nel suo ufficio. "Ho visto i risultati del trimestre. Ottimo lavoro. C\'era altro di cui volevi parlarmi?"',
    victoryCondition: 'Valore Percepito >= 10',
    defeatCondition: 'Budget <= 0',
    difficulty: 4,
    variants: [
      { personality: 'passive', difficulty: 3, intro: 'Il Dott. Rossi evita il tuo sguardo, giocherellando con una penna. "Sì, sì... i risultati sono buoni. Ma sai, il periodo è difficile... non so se è il momento giusto per parlare di certe cose..."'},
      { personality: 'aggressive', difficulty: 5, intro: 'Rossi alza la voce prima ancora che tu finisca. "Ancora soldi?! Ma ti rendi conto di quanto siamo sotto pressione? Dovresti ringraziare di avere un posto, altro che promozione!"'},
      { personality: 'assertive', difficulty: 4, intro: 'Rossi ti fa cenno di sederti. "Apprezzo la tua iniziativa. Dimmi pure, cosa hai in mente per il tuo futuro qui?"'}
    ]
  }
};

// --- Main Component ---

export default function App() {
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [currentView, setCurrentView] = useState<'main' | 'scenarios' | 'mail_scenarios' | 'game'>('main');
  const [showBriefing, setShowBriefing] = useState(false);
  const [personalityFilter, setPersonalityFilter] = useState<Personality | 'all'>('all');
  const [gameState, setGameState] = useState<GameState>({
    mode: 'chat',
    scenario: null,
    activeVariant: null,
    metrics: {},
    history: [],
    isGameActive: false,
    status: 'playing'
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedScenarios, setCompletedScenarios] = useState<string[]>([]); // Format: "scenarioId:personality"
  const [customScenarioPrompt, setCustomScenarioPrompt] = useState('');
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [unlockedTechniques, setUnlockedTechniques] = useState<string[]>([]);
  const [showTechniquesModal, setShowTechniquesModal] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentTheme = PERSONALITY_COLORS[personalityFilter];

  // Load completed scenarios and unlocked techniques from localStorage
  useEffect(() => {
    const savedScenarios = localStorage.getItem('completedScenarios');
    if (savedScenarios) {
      try {
        setCompletedScenarios(JSON.parse(savedScenarios));
      } catch (e) {
        console.error("Failed to parse completed scenarios", e);
      }
    }

    const savedTechniques = localStorage.getItem('unlockedTechniques');
    if (savedTechniques) {
      try {
        setUnlockedTechniques(JSON.parse(savedTechniques));
      } catch (e) {
        console.error("Failed to parse unlocked techniques", e);
      }
    }
  }, []);

  // Save completed scenarios and unlocked techniques to localStorage
  useEffect(() => {
    localStorage.setItem('completedScenarios', JSON.stringify(completedScenarios));
  }, [completedScenarios]);

  useEffect(() => {
    localStorage.setItem('unlockedTechniques', JSON.stringify(unlockedTechniques));
  }, [unlockedTechniques]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.history]);

  const getScenarioProgress = (scenario: Scenario) => {
    if (scenario.variants.length === 0) return completedScenarios.includes(scenario.id) ? 100 : 0;
    const completedVariants = scenario.variants.filter(v => completedScenarios.includes(`${scenario.id}:${v.personality}`));
    return (completedVariants.length / scenario.variants.length) * 100;
  };

  const startScenario = (id: string, variantOverride?: SubScenario, mode?: GameMode) => {
    const activeMode = mode || gameState.mode;
    const scenario = activeMode === 'chat' ? SCENARIOS[id] : MAIL_SCENARIOS[id];
    if (!scenario) return;
    
    // If "all" is selected and no variant override, find the first uncompleted variant or the first one
    let variant = variantOverride;
    if (!variant && personalityFilter === 'all') {
      variant = scenario.variants.sort((a, b) => a.difficulty - b.difficulty)[0] || null;
    } else if (!variant && personalityFilter !== 'all') {
      variant = scenario.variants.find(v => v.personality === personalityFilter) || null;
    }

    const initialMetrics: Record<string, number> = {};
    scenario.metrics.forEach(m => initialMetrics[m.name] = m.value);

    setGameState({
      mode: activeMode,
      scenario,
      activeVariant: variant,
      metrics: initialMetrics,
      history: [{
        role: 'gm',
        content: variant?.intro || scenario.intro,
        timestamp: Date.now()
      }],
      isGameActive: false,
      status: 'playing'
    });

    if (!hasSeenTutorial) {
      setShowTutorialOverlay(true);
      setHasSeenTutorial(true);
    }

    setShowBriefing(true);
    setShowMainMenu(false);
    setCurrentView('game');
  };

  const startMission = () => {
    setShowBriefing(false);
    setGameState(prev => ({ ...prev, isGameActive: true }));
  };

  const generateCustomScenario = async () => {
    if (!customScenarioPrompt.trim()) return;
    
    setIsGeneratingScenario(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: customScenarioPrompt })
      });

      if (!response.ok) throw new Error("Errore durante la generazione dello scenario");
      
      const scenario = await response.json() as Scenario;
      console.log("Generated scenario:", scenario);
      scenario.icon = <Zap className="w-10 h-10" />;
      
      setGameState({
        mode: 'chat',
        scenario,
        activeVariant: null,
        metrics: scenario.metrics.reduce((acc, m) => ({ ...acc, [m.name]: m.value }), {}),
        history: [{
          role: 'gm',
          content: scenario.intro,
          timestamp: Date.now()
        }],
        isGameActive: false,
        status: 'playing'
      });
      setShowBriefing(true);
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
      case '/reset':
        if (gameState.scenario) {
          startScenario(gameState.scenario.id);
        }
        break;
      case '/status':
        const metricStr = Object.entries(gameState.metrics)
          .map(([k, v]) => `**${k}**: ${v}`)
          .join('\n');
        const statusMsg: Message = {
          role: 'gm',
          content: `### 📊 Stato della Conversazione\n\n${metricStr}\n\n**Obiettivo**: ${gameState.scenario?.objective}`,
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
      // 1. Recuperiamo la chiave API dalle variabili di Vite
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      // 2. Chiamiamo direttamente la funzione nel file gemini.ts (che hai spostato in client/src)
      const result = await callGemini(
        apiKey, 
        { ...gameState, history: newHistory }, 
        text, 
        gameState.activeVariant?.personality || 'assertive',
        gameState.mode
      );

      // 3. Creiamo il messaggio dell'NPC usando i dati ricevuti direttamente
      const npcMsg: Message = {
        role: result.feedback ? 'gm' : 'npc',
        content: result.feedback || result.dialog,
        narrative: result.narrative,
        feedback: result.feedback,
        score: result.score,
        timestamp: Date.now()
      };

      if (result.feedback) {
        setFeedbackModal(result.feedback);
      }

      const isVictory = result.status === 'victory';
      
      if (isVictory && gameState.scenario) {
        const completionKey = gameState.activeVariant 
          ? `${gameState.scenario.id}:${gameState.activeVariant.personality}`
          : gameState.scenario.id;
          
        setCompletedScenarios(prev => {
          if (prev.includes(completionKey)) return prev;
          return [...prev, completionKey];
        });

        const techniqueName = gameState.scenario.technique.name;
        setUnlockedTechniques(prev => {
          if (prev.includes(techniqueName)) return prev;
          return [...prev, techniqueName];
        });
      }

      setGameState(prev => ({
        ...prev,
        metrics: result.metrics || prev.metrics,
        status: isVictory ? 'won' : result.status === 'defeat' ? 'lost' : 'playing',
        history: [...newHistory, npcMsg]
      }));

    } catch (err) {
      console.error(err);
      setError("Errore durante la comunicazione con l'IA. Controlla la tua API Key su Vercel.");
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    if (inputValue.startsWith('/')) {
      handleCommand(inputValue);
    } else {
      processUserMessage(inputValue);
    }
    setInputValue('');
  };

  return (
    <div className={`min-h-screen w-full ${currentTheme.bg} transition-colors duration-500 relative overflow-x-hidden`}>
      {/* Detailed Background Design */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* SVG Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Dynamic Blobs */}
        <motion.div 
          animate={{ 
            y: [0, -40, 0],
            x: [0, 20, 0],
            rotate: [0, 15, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -top-40 -left-40 w-[40rem] h-[40rem] ${currentTheme.accent}/10 rounded-full blur-[100px]`}
        />
        <motion.div 
          animate={{ 
            y: [0, 40, 0],
            x: [0, -20, 0],
            rotate: [0, -15, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -bottom-40 -right-40 w-[50rem] h-[50rem] ${currentTheme.accent}/10 rounded-full blur-[120px]`}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen max-w-5xl mx-auto p-4 md:p-8 gap-8 text-slate-800">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -top-20 -left-20 w-64 h-64 ${currentTheme.accent}/10 rounded-full blur-3xl`}
        />
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -10, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -bottom-20 -right-20 w-96 h-96 ${currentTheme.accent}/10 rounded-full blur-3xl`}
        />
        <div className="absolute top-1/4 left-10 opacity-20">
          <Sparkles className={`w-12 h-12 ${currentTheme.text}`} />
        </div>
        <div className="absolute top-1/3 right-20 opacity-10">
          <Ghost className={`w-16 h-16 ${currentTheme.text}`} />
        </div>
        <div className="absolute bottom-1/4 right-10 opacity-20">
          <MessageCircle className={`w-12 h-12 ${currentTheme.text}`} />
        </div>
        <div className="absolute bottom-1/3 left-20 opacity-10">
          <UserPlus className={`w-16 h-16 ${currentTheme.text}`} />
        </div>
        <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-5">
          <Phone className={`w-32 h-32 ${currentTheme.text}`} />
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
              <MessageCircle className="w-16 h-16 text-orange-600" />
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
                  SCENARI CHAT <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
                </span>
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('mail_scenarios')}
                className="group relative overflow-hidden bg-indigo-500 hover:bg-indigo-600 text-white py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-bold text-xl md:text-2xl transition-all shadow-xl shadow-indigo-500/20 border-b-4 md:border-b-8 border-indigo-700 active:border-b-0 active:translate-y-1 md:active:translate-y-2 cursor-pointer"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  INBOX CHALLENGE <Mail className="w-6 h-6 md:w-8 md:h-8" />
                </span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTechniquesModal(true)}
                className="bg-white hover:bg-slate-50 text-slate-600 border-2 md:border-4 border-slate-200 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-bold text-xl md:text-2xl transition-all shadow-lg border-b-4 md:border-b-8 border-slate-200 active:border-b-0 active:translate-y-1 md:active:translate-y-2 cursor-pointer"
              >
                <span className="flex items-center justify-center gap-3">
                  TECNICHE <Star className="w-6 h-6 md:w-8 md:h-8" />
                </span>
              </motion.button>
            </div>
          </motion.div>
        ) : currentView === 'scenarios' || currentView === 'mail_scenarios' ? (
          <motion.div 
            key={currentView}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col relative z-10 w-full min-h-0 overflow-hidden"
          >
            <div className="flex flex-col md:flex-row items-center justify-between mb-4 shrink-0 px-6 gap-4">
              <button 
                onClick={() => {
                  setPersonalityFilter('all');
                  setCurrentView('main');
                }}
                className={`flex items-center gap-2 text-slate-500 hover:${currentTheme.text} font-bold transition-colors cursor-pointer`}
              >
                <Home className="w-5 h-5" /> Torna al Menu
              </button>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight text-center">
                {currentView === 'scenarios' ? 'SCEGLI LA TUA ' : 'INBOX '}
                <span className={currentTheme.text}>{currentView === 'scenarios' ? 'SFIDA' : 'CHALLENGE'}</span>
              </h2>
              <div className="hidden md:block w-24"></div>
            </div>

            {/* Personality Filter Tabs */}
            <div className="flex flex-col items-center gap-3 mb-6 px-6 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Personalità dell'interlocutore</span>
              <div className="flex justify-center gap-2 overflow-x-auto overflow-y-hidden no-scrollbar w-full">
                {(['all', 'passive', 'aggressive', 'passive-aggressive', 'assertive'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPersonalityFilter(p)}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      personalityFilter === p 
                        ? `${PERSONALITY_COLORS[p].accent} text-white shadow-lg scale-105` 
                        : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'
                    }`}
                  >
                    {PERSONALITY_LABELS[p]}
                  </button>
                ))}
              </div>
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

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto p-6 chat-scrollbar pb-32">
              {/* Custom Scenario Card (Only for Chat Mode) */}
              {currentView === 'scenarios' && personalityFilter === 'all' && (
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={`flex flex-col gap-4 p-6 ${currentTheme.bg} border-2 ${currentTheme.border} ${currentTheme.hoverBorder} rounded-[2.5rem] text-left transition-all shadow-lg relative cursor-default h-fit group`}
                >
                      <div className={`w-16 h-16 md:w-20 md:h-20 bg-white rounded-3xl flex items-center justify-center ${currentTheme.text} ${currentTheme.groupHoverBg} transition-all duration-300 shadow-inner shrink-0`}>
                        <Zap className="w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 group-hover:!text-white" />
                      </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Scenario Personalizzato</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">Descrivi una situazione e l'IA creerà una sfida su misura per te.</p>
                    <div className="flex flex-col gap-3">
                      <textarea 
                        value={customScenarioPrompt}
                        onChange={(e) => setCustomScenarioPrompt(e.target.value)}
                        placeholder="Esempio: Chiedere un aumento al capo..."
                        className={`w-full p-4 text-sm bg-white border ${currentTheme.border} rounded-2xl focus:outline-none focus:ring-2 ${currentTheme.accent.replace('bg-', 'ring-')} chat-scrollbar resize-none h-24 shadow-inner`}
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
                        className={`w-full py-4 ${!customScenarioPrompt.trim() ? 'bg-slate-300' : currentTheme.accent + ' hover:opacity-90'} text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
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
              )}

              {Object.values(currentView === 'scenarios' ? SCENARIOS : MAIL_SCENARIOS)
                .filter(s => s.id !== 'tutorial')
                .filter(s => personalityFilter === 'all' || s.variants.some(v => v.personality === personalityFilter))
                .sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0))
                .map((s) => (
                  <motion.button
                    key={s.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startScenario(s.id, undefined, currentView === 'scenarios' ? 'chat' : 'mail')}
                    className={`flex flex-col gap-4 p-6 bg-white border-2 ${currentTheme.border} ${currentTheme.hoverBorder} rounded-[2.5rem] text-left transition-all shadow-lg hover:shadow-orange-500/10 group relative cursor-pointer h-full`}
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
                      
                      {/* Checkpoint Progress Bar */}
                      <div className="flex gap-1 mt-1 bg-slate-50 p-1.5 rounded-full border border-slate-100 shadow-inner">
                        {s.variants.sort((a, b) => a.difficulty - b.difficulty).map((v, idx) => {
                          const isCompleted = completedScenarios.includes(`${s.id}:${v.personality}`);
                          const pColor = PERSONALITY_COLORS[v.personality];
                          return (
                            <div 
                              key={idx}
                              className={`h-2 w-4 rounded-full transition-all duration-500 ${
                                isCompleted 
                                  ? pColor.accent // vivid
                                  : 'bg-slate-200' // faint
                              }`}
                              title={`${PERSONALITY_LABELS[v.personality]} - ${isCompleted ? 'Completato' : 'Da completare'}`}
                            />
                          );
                        })}
                      </div>

                      {getScenarioProgress(s) === 100 && (
                        <div className="flex items-center gap-1 bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="w-2 h-2" /> Completato
                        </div>
                      )}
                    </div>
                    <div className={`w-16 h-16 md:w-20 md:h-20 ${currentTheme.bg} rounded-3xl flex items-center justify-center ${currentTheme.text} ${currentTheme.groupHoverBg} transition-all duration-300 shadow-inner shrink-0`}>
                      {React.cloneElement(s.icon as React.ReactElement<any>, { 
                        className: `w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 group-hover:!text-white` 
                      })}
                    </div>
                    <div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {s.variants.map(v => (
                          <span 
                            key={v.personality}
                            className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${PERSONALITY_COLORS[v.personality].bg} ${PERSONALITY_COLORS[v.personality].text} ${PERSONALITY_COLORS[v.personality].border}`}
                          >
                            {PERSONALITY_LABELS[v.personality]}
                          </span>
                        ))}
                      </div>
                      <h3 className={`text-xl font-bold text-slate-800 mb-1 group-hover:${currentTheme.text} transition-colors`}>{s.title}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Sintesi</p>
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{s.description}</p>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-orange-50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Difficoltà {s.difficulty}/5</span>
                      <ChevronRight className={`w-5 h-5 text-orange-300 group-hover:${currentTheme.text} group-hover:translate-x-1 transition-all`} />
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
            {/* Briefing Overlay */}
            <AnimatePresence>
              {showBriefing && gameState.scenario && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl border border-indigo-100"
                  >
                    <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <GraduationCap className="w-32 h-32" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                            <GraduationCap className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Briefing Tecnico</span>
                        </div>
                        <h2 className="text-4xl font-black leading-tight mb-4 uppercase tracking-tighter">
                          {gameState.scenario.technique.name}
                        </h2>
                        <p className="text-indigo-50 text-xl font-bold leading-relaxed">
                          {gameState.scenario.technique.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-8 space-y-6">
                      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Esempio di Applicazione</h4>
                        <p className="text-base font-medium text-slate-600 italic leading-relaxed">
                          {gameState.scenario.technique.example}
                        </p>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={startMission}
                          className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-[2rem] transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3 group cursor-pointer text-lg"
                        >
                          HO CAPITO, COMINCIAMO
                          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

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
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${gameState.mode === 'mail' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
                    {gameState.mode === 'mail' ? <Inbox className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {gameState.mode === 'mail' ? 'Inbox Challenge' : 'Scenario Chat'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">AI Coach</span>
                  </div>
                </div>
              </div>
            </header>

            <main className={`flex-1 flex flex-col ${gameState.scenario?.id === 'tutorial' ? 'items-center' : 'md:flex-row'} gap-6 min-h-0 relative z-10`}>
              {/* Left Sidebar: Scenarios & Metrics */}
              {gameState.scenario?.id !== 'tutorial' && (
                <aside className="w-full md:w-72 flex flex-col gap-6">
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
                      <div className="mt-2 pt-4 border-t border-orange-50 space-y-3">
                        <div className="p-3 bg-orange-50/50 rounded-2xl border border-orange-100">
                          <p className="text-[10px] font-bold uppercase text-orange-400 mb-1 flex items-center gap-1">
                            <BarChart3 className="w-3 h-3 text-orange-500" /> Obiettivo Numerico
                          </p>
                          <p className="text-xs text-slate-600 leading-relaxed font-bold">{gameState.scenario.objective}</p>
                        </div>
                        <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                          <p className="text-[10px] font-bold uppercase text-blue-400 mb-1 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Obiettivo Personale
                          </p>
                          <p className="text-xs text-slate-700 leading-relaxed font-bold italic">"{gameState.scenario.personalObjective}"</p>
                        </div>
                      </div>

                      {/* Technique Briefing */}
                      <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-3xl">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2 flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4" /> Tecnica da Applicare
                        </h4>
                        <p className="text-sm font-bold text-indigo-900 mb-1">{gameState.scenario.technique.name}</p>
                        <p className="text-[11px] text-indigo-700 leading-tight mb-3 opacity-80">{gameState.scenario.technique.description}</p>
                        <div className="p-2 bg-white/50 rounded-xl border border-indigo-200/50">
                          <p className="text-[9px] font-bold uppercase text-indigo-400 mb-1">Esempio Pratico</p>
                          <p className="text-[10px] text-indigo-800 italic leading-snug">{gameState.scenario.technique.example}</p>
                        </div>
                      </div>

                      {/* Variant Selection In-Game */}
                      <div className="mt-4 pt-4 border-t border-orange-50">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 text-center">Cambia Personalità</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {gameState.scenario.variants.map((v) => {
                            const isActive = gameState.activeVariant?.personality === v.personality;
                            const isCompleted = completedScenarios.includes(`${gameState.scenario?.id}:${v.personality}`);
                            const pColor = PERSONALITY_COLORS[v.personality];
                            return (
                              <button
                                key={v.personality}
                                onClick={() => startScenario(gameState.scenario!.id, v, gameState.mode)}
                                className={`p-2 rounded-xl text-[10px] font-bold uppercase transition-all border-2 flex items-center justify-between ${
                                  isActive 
                                    ? `${pColor.accent} text-white border-transparent shadow-md scale-105` 
                                    : `bg-white text-slate-500 border-slate-100 hover:border-slate-200`
                                }`}
                              >
                                {PERSONALITY_LABELS[v.personality]}
                                {isCompleted && <CheckCircle2 className={`w-3 h-3 ${isActive ? 'text-white' : 'text-emerald-500'}`} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Home Button in Sidebar */}
                  {gameState.isGameActive && (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setPersonalityFilter('all');
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
              <section className={`flex-1 flex flex-col bg-white rounded-[2.5rem] border border-orange-100 overflow-hidden shadow-2xl transition-all duration-500 ${gameState.scenario?.id === 'tutorial' ? 'max-w-5xl w-full' : ''}`}>
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
                          <div className="flex items-center gap-2">
                            {gameState.activeVariant && (
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${PERSONALITY_COLORS[gameState.activeVariant.personality].bg} ${PERSONALITY_COLORS[gameState.activeVariant.personality].text} border ${PERSONALITY_COLORS[gameState.activeVariant.personality].border}`}>
                                {PERSONALITY_LABELS[gameState.activeVariant.personality]}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sessione Attiva</span>
                            </div>
                          </div>
                          
                          {/* Progress Bar in Header */}
                          {gameState.scenario && (
                            <div className="flex gap-1 mt-2">
                              {gameState.scenario.variants.sort((a, b) => a.difficulty - b.difficulty).map((v, idx) => {
                                const isCompleted = completedScenarios.includes(`${gameState.scenario!.id}:${v.personality}`);
                                const isActive = gameState.activeVariant?.personality === v.personality;
                                const pColor = PERSONALITY_COLORS[v.personality];
                                return (
                                  <div 
                                    key={idx}
                                    className={`h-1 w-6 rounded-full transition-all duration-500 ${
                                      isCompleted ? pColor.accent : isActive ? 'bg-slate-300 animate-pulse' : 'bg-slate-100'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          )}
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
                    <div className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-6 chat-scrollbar ${gameState.mode === 'mail' ? 'bg-slate-50' : 'bg-white'}`}>
                      {gameState.history.map((msg, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          whileHover={{ y: -2 }}
                          className={`flex flex-col ${msg.role === 'player' ? 'items-end' : 'items-start'} transition-all duration-300`}
                        >
                          {gameState.mode === 'mail' ? (
                            /* Mail Mode Message Style */
                            <div className={`w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${msg.role === 'player' ? 'ml-auto border-indigo-100' : 'mr-auto'}`}>
                              <div className={`px-4 py-2 border-b flex items-center justify-between text-[10px] font-bold uppercase tracking-widest ${msg.role === 'player' ? 'bg-indigo-50/50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                <div className="flex items-center gap-2">
                                  {msg.role === 'player' ? <SendHorizontal className="w-3 h-3" /> : <Inbox className="w-3 h-3" />}
                                  {msg.role === 'player' ? 'Da: Tu' : `Da: ${gameState.scenario?.title}`}
                                </div>
                                {msg.score && (
                                  <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-indigo-200 text-indigo-600">
                                    Punteggio: <span className="text-indigo-700">{msg.score}/10</span>
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                {msg.narrative && (
                                  <div className="mb-3 pb-3 border-b border-slate-50 text-xs font-bold text-slate-800">
                                    {msg.narrative}
                                  </div>
                                )}
                                <div className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                                  {msg.content}
                                </div>
                                {msg.feedback && (
                                  <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold uppercase tracking-widest text-[9px]">
                                      <Sparkles className="w-3 h-3" /> Analisi Professionale
                                    </div>
                                    <div className="text-[11px] text-indigo-900">
                                      {msg.feedback}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* Chat Mode Message Style */
                            <>
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
                              
                              <div className={`max-w-[85%] rounded-[1.5rem] p-4 leading-relaxed shadow-md hover:shadow-lg transition-shadow ${
                                msg.role === 'player' 
                                  ? `${currentTheme.accent} text-white rounded-tr-none text-[13px]` 
                                  : msg.feedback
                                  ? 'bg-indigo-50 text-indigo-900 border-2 border-indigo-100 rounded-tl-none text-[13px]'
                                  : msg.role === 'gm'
                                  ? `${currentTheme.bg} text-slate-700 border ${currentTheme.border} italic rounded-tl-none text-sm font-medium`
                                  : 'bg-white text-slate-800 border border-orange-100 rounded-tl-none text-[13px]'
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
                            </>
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
                    <div className={`p-4 md:p-6 border-t ${gameState.mode === 'mail' ? 'bg-white border-slate-200' : 'bg-orange-50/30 border-orange-100'}`}>
                      {gameState.mode === 'mail' ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            <Mail className="w-3 h-3" /> Componi Risposta Professionale
                          </div>
                          <div className="relative">
                            <textarea 
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              disabled={gameState.status !== 'playing' || isLoading}
                              placeholder="Scrivi qui il corpo della tua email..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-400 text-slate-800 shadow-inner min-h-[120px] resize-none disabled:opacity-50"
                            />
                            <button 
                              onClick={handleSubmit}
                              disabled={!inputValue.trim() || gameState.status !== 'playing' || isLoading}
                              className="absolute bottom-3 right-3 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                            >
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                              INVIA EMAIL
                            </button>
                          </div>
                        </div>
                      ) : (
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
                      )}
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
                            status
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
                            observe
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
                            feedback
                          </motion.button>

                          {/* Reset Button */}
                          <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => handleCommand('/reset')}
                            className="flex items-center gap-2.5 px-6 py-3 bg-amber-50 border-2 border-amber-200 hover:bg-amber-100 hover:border-amber-400 text-amber-700 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all"
                          >
                            <RotateCcw className="w-5 h-5" />
                            reset
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
                            quit
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

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorialOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border-4 border-orange-100 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-100 rounded-full blur-3xl opacity-50" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-500/20">
                  <Info className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">BENVENUTO!</h2>
                <div className="space-y-4 text-slate-600 font-medium leading-relaxed">
                  <p>In questo gioco metterai alla prova le tue abilità comunicative. Ecco come funziona:</p>
                  <ul className="space-y-2">
                    <li className="flex gap-3 items-start">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                      <span><strong>Dialoga:</strong> Rispondi ai messaggi cercando di raggiungere i tuoi obiettivi.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                      <span><strong>Comandi:</strong> Usa <code className="bg-slate-100 px-1 rounded">/observe</code> per analizzare la situazione o <code className="bg-slate-100 px-1 rounded">/status</code> per vedere le metriche.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                      <span><strong>Feedback:</strong> Usa <code className="bg-slate-100 px-1 rounded">/feedback</code> in qualsiasi momento per ricevere consigli dall'IA.</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => setShowTutorialOverlay(false)}
                  className="mt-8 w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/20 transition-all active:scale-95"
                >
                  INIZIA LA SFIDA
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Techniques Modal */}
      <AnimatePresence>
        {showTechniquesModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTechniquesModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-4 border-indigo-100"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">COLLEZIONE TECNICHE</h2>
                    <p className="text-sm text-slate-500 font-medium">Hai sbloccato {unlockedTechniques.length} su {Array.from(new Map(Object.values(SCENARIOS).map(s => [s.technique.name, s.technique])).values()).length} tecniche</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowTechniquesModal(false)}
                  className="w-10 h-10 bg-white hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-slate-100 shadow-sm"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 chat-scrollbar bg-slate-50/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from(new Map(Object.values(SCENARIOS).map(s => [s.technique.name, s.technique])).values()).map((tech, idx) => {
                    const isUnlocked = unlockedTechniques.includes(tech.name);
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`relative group p-6 rounded-[2rem] border-2 transition-all duration-500 flex flex-col gap-4 ${
                          isUnlocked 
                            ? 'bg-white border-indigo-100 shadow-xl hover:shadow-2xl hover:-translate-y-2' 
                            : 'bg-slate-100/50 border-slate-200 grayscale opacity-60'
                        }`}
                      >
                        {!isUnlocked && (
                          <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="bg-slate-800/80 text-white p-3 rounded-full shadow-lg">
                              <Key className="w-6 h-6" />
                            </div>
                          </div>
                        )}
                        
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${isUnlocked ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                          <GraduationCap className="w-6 h-6" />
                        </div>

                        <div>
                          <h3 className={`text-lg font-black leading-tight mb-2 ${isUnlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                            {tech.name}
                          </h3>
                          <p className={`text-xs leading-relaxed ${isUnlocked ? 'text-slate-500' : 'text-slate-300'}`}>
                            {isUnlocked ? tech.description : 'Completa uno scenario che utilizza questa tecnica per sbloccarla.'}
                          </p>
                        </div>

                        {isUnlocked && (
                          <div className="mt-auto pt-4 border-t border-slate-50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Esempio Pratico</p>
                            <p className="text-[11px] text-slate-600 italic leading-snug bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                              {tech.example}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="p-8 bg-white border-t border-slate-100 flex justify-center">
                <button 
                  onClick={() => setShowTechniquesModal(false)}
                  className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  HO CAPITO
                </button>
              </div>
            </motion.div>
          </div>
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
  </div>
  );
}
